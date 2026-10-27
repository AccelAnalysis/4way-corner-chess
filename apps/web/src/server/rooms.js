import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { ApiError, requireString } from './http';
import {
  COLORS,
  COLOR_NAMES,
  applyMove,
  applyResignation,
  applyTimeout,
  chooseAIMove,
  createGameState,
} from '../game/engine.mjs';

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const QUICK_CHATS = new Set([
  'Attack Red 🔴',
  'Attack Blue 🔵',
  'Attack Black ⚫',
  'Attack White ⚪',
  'Alliance? 🤝',
  "Don't take my King! 🛡️",
  'Oops... 😅',
  'Good move! 🔥',
  'Watch out! ⚠️',
]);

function randomRoomCode(length = 6) {
  let code = '';
  for (let index = 0; index < length; index += 1) {
    code += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)];
  }
  return code;
}

export function normalizeRoomCode(value) {
  const code = String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 6) throw new ApiError(400, 'INVALID_ROOM_CODE', 'Room codes contain six letters or numbers.');
  return code;
}

function normalizeMode(value) {
  return ['ffa', 'teams', 'blitz'].includes(value) ? value : 'ffa';
}

function normalizeTimeControl(value, mode) {
  if (value === null || value === 'unlimited') return null;
  if (mode === 'blitz') return 60;
  return Math.max(30, Math.min(3600, Number(value) || 300));
}

function seatForUid(room, uid) {
  return COLORS.find((seat) => room.seats?.[seat] === uid) || null;
}

function firstAvailableSeat(room) {
  return COLORS.find((seat) => !room.seats?.[seat]) || null;
}

function roomReference(db, code) {
  return db.collection('rooms').doc(code);
}

function playerReference(db, code, uid) {
  return roomReference(db, code).collection('players').doc(uid);
}

function moveReference(db, code, version) {
  return roomReference(db, code).collection('moves').doc(String(version).padStart(8, '0'));
}

function playerRecord(claims, seat, ready = false) {
  return {
    uid: claims.uid,
    seat,
    displayName: claims.name || claims.email?.split('@')[0] || `Guest ${claims.uid.slice(0, 6)}`,
    accountType: claims.isAnonymous ? 'anonymous' : 'registered',
    ready,
    connectionState: 'connected',
    joinedAt: FieldValue.serverTimestamp(),
    lastSeenAt: FieldValue.serverTimestamp(),
  };
}

export async function createRoom(db, claims, payload = {}) {
  const mode = normalizeMode(payload.mode);
  const timeControlSeconds = normalizeTimeControl(payload.timeControlSeconds, mode);
  const centerPawns = Boolean(payload.centerPawns);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomRoomCode();
    const roomRef = roomReference(db, code);
    const playerRef = playerReference(db, code, claims.uid);
    let created = false;

    await db.runTransaction(async (transaction) => {
      const roomSnapshot = await transaction.get(roomRef);
      if (roomSnapshot.exists) return;

      const now = Timestamp.now();
      transaction.create(roomRef, {
        schemaVersion: 1,
        code,
        hostUid: claims.uid,
        status: 'lobby',
        mode,
        allianceMode: mode === 'teams' ? 'diagonals' : 'ffa',
        timeControlSeconds,
        centerPawns,
        seats: { W: claims.uid, B: null, K: null, R: null },
        ready: { W: false, B: false, K: false, R: false },
        playerTypes: { W: 'human', B: null, K: null, R: null },
        game: null,
        createdAt: now,
        updatedAt: now,
        expiresAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
      });
      transaction.create(playerRef, playerRecord(claims, 'W'));
      created = true;
    });

    if (created) return { code, seat: 'W', host: true };
  }

  throw new ApiError(503, 'ROOM_CODE_EXHAUSTED', 'Unable to allocate a unique room code.');
}

export async function joinRoom(db, claims, rawCode) {
  const code = normalizeRoomCode(rawCode);
  const roomRef = roomReference(db, code);
  const playerRef = playerReference(db, code, claims.uid);
  let result = null;

  await db.runTransaction(async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);
    if (!roomSnapshot.exists) throw new ApiError(404, 'ROOM_NOT_FOUND', 'That Kani room does not exist.');
    const room = roomSnapshot.data();
    if (!['lobby', 'active'].includes(room.status)) {
      throw new ApiError(409, 'ROOM_CLOSED', 'That room is no longer accepting players.');
    }

    const existingSeat = seatForUid(room, claims.uid);
    if (existingSeat) {
      transaction.set(playerRef, {
        connectionState: 'connected',
        lastSeenAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      result = { code, seat: existingSeat, host: room.hostUid === claims.uid, resumed: true };
      return;
    }

    if (room.status !== 'lobby') {
      throw new ApiError(409, 'MATCH_ALREADY_STARTED', 'The match has already started.');
    }

    const seat = firstAvailableSeat(room);
    if (!seat) throw new ApiError(409, 'ROOM_FULL', 'All four seats are occupied.');

    const seats = { ...room.seats, [seat]: claims.uid };
    const ready = { ...room.ready, [seat]: false };
    const playerTypes = { ...room.playerTypes, [seat]: 'human' };
    transaction.update(roomRef, {
      seats,
      ready,
      playerTypes,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.create(playerRef, playerRecord(claims, seat));
    result = { code, seat, host: room.hostUid === claims.uid, resumed: false };
  });

  return result;
}

export async function setRoomReady(db, claims, rawCode, readyValue) {
  const code = normalizeRoomCode(rawCode);
  const roomRef = roomReference(db, code);
  const playerRef = playerReference(db, code, claims.uid);
  let seat = null;

  await db.runTransaction(async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);
    if (!roomSnapshot.exists) throw new ApiError(404, 'ROOM_NOT_FOUND', 'That Kani room does not exist.');
    const room = roomSnapshot.data();
    if (room.status !== 'lobby') throw new ApiError(409, 'NOT_IN_LOBBY', 'Ready status can only change in the lobby.');
    seat = seatForUid(room, claims.uid);
    if (!seat) throw new ApiError(403, 'NOT_A_ROOM_MEMBER', 'Join the room before changing ready status.');

    transaction.update(roomRef, {
      ready: { ...room.ready, [seat]: Boolean(readyValue) },
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(playerRef, {
      ready: Boolean(readyValue),
      lastSeenAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  return { code, seat, ready: Boolean(readyValue) };
}

export async function startRoom(db, claims, rawCode, { fillWithAI = true } = {}) {
  const code = normalizeRoomCode(rawCode);
  const roomRef = roomReference(db, code);
  let result = null;

  await db.runTransaction(async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);
    if (!roomSnapshot.exists) throw new ApiError(404, 'ROOM_NOT_FOUND', 'That Kani room does not exist.');
    const room = roomSnapshot.data();
    if (room.hostUid !== claims.uid) throw new ApiError(403, 'HOST_REQUIRED', 'Only the host can start the match.');
    if (room.status !== 'lobby') throw new ApiError(409, 'MATCH_ALREADY_STARTED', 'This match has already started.');

    const occupiedSeats = COLORS.filter((seat) => room.seats?.[seat]);
    if (occupiedSeats.length < 2) throw new ApiError(409, 'MORE_PLAYERS_REQUIRED', 'At least two human players must join.');
    const unready = occupiedSeats.filter((seat) => room.ready?.[seat] !== true);
    if (unready.length > 0) {
      throw new ApiError(409, 'PLAYERS_NOT_READY', `Waiting for ${unready.map((seat) => COLOR_NAMES[seat]).join(', ')}.`);
    }

    if (!fillWithAI && occupiedSeats.length < 4) {
      throw new ApiError(409, 'FOUR_PLAYERS_REQUIRED', 'Fill empty seats with AI or wait for four players.');
    }

    const playerTypes = Object.fromEntries(COLORS.map((seat) => [seat, room.seats?.[seat] ? 'human' : 'ai_defensive']));
    const game = createGameState({
      mode: room.mode,
      timeControlSeconds: room.timeControlSeconds,
      centerPawns: room.centerPawns,
    });

    transaction.update(roomRef, {
      status: 'active',
      playerTypes,
      game,
      startedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    result = { code, game, playerTypes };
  });

  return result;
}

function assertExpectedVersion(game, expectedVersion) {
  if (Number(expectedVersion) !== Number(game.version)) {
    throw new ApiError(409, 'STALE_GAME_VERSION', 'The board changed before this action was processed.', {
      currentVersion: game.version,
    });
  }
}

export async function submitRoomMove(db, claims, rawCode, action) {
  const code = normalizeRoomCode(rawCode);
  const roomRef = roomReference(db, code);
  let nextGame = null;

  await db.runTransaction(async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);
    if (!roomSnapshot.exists) throw new ApiError(404, 'ROOM_NOT_FOUND', 'That Kani room does not exist.');
    const room = roomSnapshot.data();
    if (room.status !== 'active' || !room.game) throw new ApiError(409, 'MATCH_NOT_ACTIVE', 'The match is not active.');
    const seat = seatForUid(room, claims.uid);
    if (!seat) throw new ApiError(403, 'NOT_A_ROOM_MEMBER', 'You do not occupy a seat in this room.');
    assertExpectedVersion(room.game, action.expectedVersion);

    nextGame = applyMove(room.game, {
      seat,
      from: Number(action.from),
      to: Number(action.to),
      promotion: action.promotion,
    });

    const moveRef = moveReference(db, code, nextGame.version);
    transaction.update(roomRef, {
      game: nextGame,
      status: nextGame.status,
      completedAt: nextGame.status === 'complete' ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.create(moveRef, {
      ...nextGame.lastMove,
      version: nextGame.version,
      actorUid: claims.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { code, game: nextGame };
}

export async function submitAIMove(db, claims, rawCode, expectedVersion) {
  const code = normalizeRoomCode(rawCode);
  const roomRef = roomReference(db, code);
  let nextGame = null;

  await db.runTransaction(async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);
    if (!roomSnapshot.exists) throw new ApiError(404, 'ROOM_NOT_FOUND', 'That Kani room does not exist.');
    const room = roomSnapshot.data();
    if (!seatForUid(room, claims.uid)) throw new ApiError(403, 'NOT_A_ROOM_MEMBER', 'Join the room first.');
    if (room.status !== 'active' || !room.game) throw new ApiError(409, 'MATCH_NOT_ACTIVE', 'The match is not active.');
    assertExpectedVersion(room.game, expectedVersion);

    const seat = COLORS[room.game.turnIndex];
    if (room.seats?.[seat] || !String(room.playerTypes?.[seat] || '').startsWith('ai')) {
      throw new ApiError(409, 'HUMAN_SEAT_ACTIVE', 'The active seat belongs to a human player.');
    }

    const move = chooseAIMove(room.game, seat);
    if (!move) {
      nextGame = applyResignation(room.game, seat);
    } else {
      nextGame = applyMove(room.game, { seat, ...move });
    }

    const moveRef = moveReference(db, code, nextGame.version);
    transaction.update(roomRef, {
      game: nextGame,
      status: nextGame.status,
      completedAt: nextGame.status === 'complete' ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.create(moveRef, {
      ...nextGame.lastMove,
      version: nextGame.version,
      actorUid: 'server-ai',
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { code, game: nextGame };
}

export async function resignRoom(db, claims, rawCode, expectedVersion) {
  const code = normalizeRoomCode(rawCode);
  const roomRef = roomReference(db, code);
  let nextGame = null;

  await db.runTransaction(async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);
    if (!roomSnapshot.exists) throw new ApiError(404, 'ROOM_NOT_FOUND', 'That Kani room does not exist.');
    const room = roomSnapshot.data();
    if (!room.game) throw new ApiError(409, 'MATCH_NOT_ACTIVE', 'The match is not active.');
    const seat = seatForUid(room, claims.uid);
    if (!seat) throw new ApiError(403, 'NOT_A_ROOM_MEMBER', 'You do not occupy a seat in this room.');
    assertExpectedVersion(room.game, expectedVersion);
    nextGame = applyResignation(room.game, seat);

    const moveRef = moveReference(db, code, nextGame.version);
    transaction.update(roomRef, {
      game: nextGame,
      status: nextGame.status,
      completedAt: nextGame.status === 'complete' ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.create(moveRef, {
      ...nextGame.lastMove,
      version: nextGame.version,
      actorUid: claims.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { code, game: nextGame };
}

export async function timeoutRoomTurn(db, claims, rawCode, expectedVersion) {
  const code = normalizeRoomCode(rawCode);
  const roomRef = roomReference(db, code);
  let nextGame = null;

  await db.runTransaction(async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);
    if (!roomSnapshot.exists) throw new ApiError(404, 'ROOM_NOT_FOUND', 'That Kani room does not exist.');
    const room = roomSnapshot.data();
    if (!seatForUid(room, claims.uid)) throw new ApiError(403, 'NOT_A_ROOM_MEMBER', 'Join the room first.');
    if (!room.game) throw new ApiError(409, 'MATCH_NOT_ACTIVE', 'The match is not active.');
    assertExpectedVersion(room.game, expectedVersion);
    nextGame = applyTimeout(room.game);

    const moveRef = moveReference(db, code, nextGame.version);
    transaction.update(roomRef, {
      game: nextGame,
      status: nextGame.status,
      completedAt: nextGame.status === 'complete' ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.create(moveRef, {
      ...nextGame.lastMove,
      version: nextGame.version,
      actorUid: 'server-clock',
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { code, game: nextGame };
}

export async function sendRoomChat(db, claims, rawCode, rawMessage) {
  const code = normalizeRoomCode(rawCode);
  const message = requireString(rawMessage, 'message', { min: 1, max: 80 });
  if (!QUICK_CHATS.has(message)) throw new ApiError(400, 'CHAT_NOT_ALLOWED', 'Only approved quick-chat messages are allowed.');

  const roomRef = roomReference(db, code);
  const chatRef = roomRef.collection('chat').doc();
  let seat = null;

  await db.runTransaction(async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);
    if (!roomSnapshot.exists) throw new ApiError(404, 'ROOM_NOT_FOUND', 'That Kani room does not exist.');
    const room = roomSnapshot.data();
    seat = seatForUid(room, claims.uid);
    if (!seat) throw new ApiError(403, 'NOT_A_ROOM_MEMBER', 'Join the room first.');
    transaction.create(chatRef, {
      uid: claims.uid,
      seat,
      message,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { id: chatRef.id, code, seat, message };
}

export async function heartbeatRoom(db, claims, rawCode) {
  const code = normalizeRoomCode(rawCode);
  const roomRef = roomReference(db, code);
  const playerRef = playerReference(db, code, claims.uid);
  let seat = null;

  await db.runTransaction(async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);
    if (!roomSnapshot.exists) throw new ApiError(404, 'ROOM_NOT_FOUND', 'That Kani room does not exist.');
    seat = seatForUid(roomSnapshot.data(), claims.uid);
    if (!seat) throw new ApiError(403, 'NOT_A_ROOM_MEMBER', 'Join the room first.');
    transaction.set(playerRef, {
      connectionState: 'connected',
      lastSeenAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  return { code, seat };
}

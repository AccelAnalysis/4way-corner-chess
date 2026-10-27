"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Coins,
  Crown,
  Gamepad2,
  LockKeyhole,
  Palette,
  Play,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  UserPlus,
  Users,
  WandSparkles,
} from 'lucide-react';
import KaniGame from './KaniGame';
import {
  applyMove,
  boardIndex,
  createGameState,
  getValidMoveIndices,
} from '../game/engine.mjs';
import {
  FIRST_REWARD_STORAGE_KEY,
  FIRST_RUN_STORAGE_KEY,
  FIRST_VICTORY_PRACTICE_REWARD,
  LOCAL_PROFILE_STORAGE_KEY,
  grantFirstVictoryPracticeReward,
  mergeFirstRunState,
  parseFirstRunState,
} from '../experience/first-run.mjs';

const TUTORIAL_ROOK = boardIndex(4, 4);
const TUTORIAL_KING = boardIndex(4, 0);
const PIECE_SYMBOLS = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };

function readFirstRun() {
  if (typeof window === 'undefined') return parseFirstRunState(null);
  return parseFirstRunState(window.localStorage.getItem(FIRST_RUN_STORAGE_KEY));
}

function writeFirstRun(update) {
  if (typeof window === 'undefined') return;
  const nextState = mergeFirstRunState(readFirstRun(), update);
  window.localStorage.setItem(FIRST_RUN_STORAGE_KEY, JSON.stringify(nextState));
}

function createTutorialGame() {
  const state = createGameState({ mode: 'ffa', timeControlSeconds: null }, Date.now());
  const board = Array(64).fill(null);
  board[boardIndex(7, 7)] = { type: 'k', color: 'W', id: 'tutorial-W-k', dir: null };
  board[TUTORIAL_ROOK] = { type: 'r', color: 'W', id: 'tutorial-W-r', dir: null };
  board[TUTORIAL_KING] = { type: 'k', color: 'B', id: 'tutorial-B-k', dir: null };
  return {
    ...state,
    board,
    controlled: { W: ['W'], B: ['B'], K: [], R: [] },
    turnIndex: 0,
    turnCount: 0,
    version: 0,
  };
}

function grantFirstReward() {
  if (typeof window === 'undefined') return;
  const alreadyGranted = window.localStorage.getItem(FIRST_REWARD_STORAGE_KEY) === 'granted';
  const currentProfile = window.localStorage.getItem(LOCAL_PROFILE_STORAGE_KEY);
  const nextProfile = grantFirstVictoryPracticeReward(currentProfile, alreadyGranted);
  window.localStorage.setItem(LOCAL_PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
  window.localStorage.setItem(FIRST_REWARD_STORAGE_KEY, 'granted');
  writeFirstRun({ tutorialComplete: true });
}

function ExperienceNav({ onPlay, returning }) {
  return (
    <header className="absolute inset-x-0 top-0 z-30 border-b border-white/10 bg-[#080706]/70 text-white backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-3 font-black tracking-[0.2em] text-amber-300" aria-label="Kani marketing home">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-amber-300/50 bg-amber-300/10">K</span>
          <span>KANI</span>
        </a>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Kani introduction">
          <a href="#how-it-works" className="rounded-full px-4 py-2 text-sm font-bold text-stone-300 hover:bg-white/10 hover:text-white">How it works</a>
          <a href="#fair-play" className="rounded-full px-4 py-2 text-sm font-bold text-stone-300 hover:bg-white/10 hover:text-white">Fair play</a>
          <Link href="/account" className="rounded-full px-4 py-2 text-sm font-bold text-stone-300 hover:bg-white/10 hover:text-white">Account</Link>
        </nav>
        <button onClick={onPlay} className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-stone-950 shadow-lg shadow-amber-300/20">
          {returning ? 'Continue playing' : 'Play free'}
        </button>
      </div>
    </header>
  );
}

function CinematicBoard() {
  const pieces = new Map([
    [0, ['B', '♚']], [7, ['W', '♚']], [56, ['K', '♚']], [63, ['R', '♚']],
    [9, ['B', '♛']], [14, ['W', '♛']], [49, ['K', '♛']], [54, ['R', '♛']],
    [18, ['B', '♜']], [21, ['W', '♜']], [42, ['K', '♜']], [45, ['R', '♜']],
  ]);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[620px] rotate-[2deg] overflow-hidden rounded-[2rem] border-[12px] border-stone-950/90 bg-stone-950 shadow-[0_45px_120px_rgba(0,0,0,0.7)]" aria-hidden="true">
      <div className="absolute inset-0 grid grid-cols-8">
        {Array.from({ length: 64 }, (_, index) => {
          const piece = pieces.get(index);
          const row = Math.floor(index / 8);
          const column = index % 8;
          return (
            <div key={index} className={`relative grid place-items-center ${(row + column) % 2 === 0 ? 'bg-[#d9c7a4]' : 'bg-[#725039]'}`}>
              {piece && (
                <span className={`kani-cinematic-piece grid h-[70%] w-[70%] place-items-center rounded-full border-2 text-[clamp(1.3rem,4vw,3rem)] shadow-xl ${piece[0] === 'W' ? 'border-amber-200 bg-stone-50 text-stone-900' : piece[0] === 'B' ? 'border-blue-300 bg-blue-600 text-white' : piece[0] === 'K' ? 'border-stone-500 bg-stone-950 text-stone-100' : 'border-red-300 bg-red-600 text-white'}`}>{piece[1]}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="kani-cinematic-beam absolute left-[12%] top-[43%] h-1 w-[66%] origin-left rounded-full bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-70 blur-[1px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.48)_100%)]" />
      <style>{`
        @keyframes kani-piece-breathe { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-5px) scale(1.04); } }
        @keyframes kani-beam-scan { 0% { transform: translateX(-30%) scaleX(.2); opacity: 0; } 35% { opacity: .85; } 100% { transform: translateX(80%) scaleX(1); opacity: 0; } }
        .kani-cinematic-piece { animation: kani-piece-breathe 4.8s ease-in-out infinite; }
        .kani-cinematic-beam { animation: kani-beam-scan 5.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .kani-cinematic-piece, .kani-cinematic-beam { animation: none; } }
      `}</style>
    </div>
  );
}

function MarketingLanding({ onPlay, onOpenHub, returning }) {
  return (
    <main id="top" className="min-h-screen overflow-hidden bg-[#080706] text-stone-100">
      <ExperienceNav onPlay={returning ? onOpenHub : onPlay} returning={returning} />
      <section className="relative grid min-h-[100svh] items-center px-5 pb-16 pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(214,162,58,0.2),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(46,94,170,0.18),transparent_28%),linear-gradient(145deg,#17100b,#080706_58%,#140b08)]" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="max-w-2xl">
            <p className="mb-5 text-xs font-black uppercase tracking-[0.34em] text-amber-300">Four armies · One crown</p>
            <h1 className="text-balance text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-8xl">Capture the king. Command the army.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-stone-300 sm:text-xl">Kani turns four-corner chess into a fast, dramatic strategy game. Experience your first victory before deciding whether to create an account.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={returning ? onOpenHub : onPlay} className="flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-amber-300 px-7 font-black text-stone-950 shadow-2xl shadow-amber-400/20 transition hover:-translate-y-0.5 hover:bg-amber-200">
                <Play fill="currentColor" size={21} /> {returning ? 'Continue to Kani' : 'Play your first victory'}
              </button>
              <Link href="/account" className="flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/5 px-7 font-black text-white transition hover:bg-white/10">
                <UserPlus size={20} /> Sign in
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-stone-400">
              <span className="flex items-center gap-2"><Check size={16} className="text-emerald-300" /> No account required</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-emerald-300" /> Free local play</span>
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-300" /> No pay-to-win</span>
            </div>
          </div>
          <CinematicBoard />
        </div>
      </section>

      <section id="how-it-works" className="border-y border-white/10 bg-stone-950/70 px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-300">Designed around player choice</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">Fun first. Commitment when it becomes useful.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {[
              ['01', Gamepad2, 'Play immediately', 'A short guided victory teaches the central rule without email, password, or checkout.'],
              ['02', Trophy, 'See your progress', 'Practice rewards and unlocks appear after the first meaningful action—not before it.'],
              ['03', UserPlus, 'Choose when to save', 'Create a free account for online identity and cross-device cosmetics, or continue locally as a guest.'],
              ['04', Palette, 'Buy only cosmetics', 'The shop appears after play and sells visual expression, never stronger pieces or extra moves.'],
            ].map(([number, Icon, title, copy]) => (
              <article key={number} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                <div className="flex items-center justify-between"><span className="text-sm font-black text-stone-500">{number}</span><Icon className="text-amber-300" /></div>
                <h3 className="mt-8 text-xl font-black">{title}</h3>
                <p className="mt-3 leading-7 text-stone-400">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="fair-play" className="px-5 py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">Cosmetic progression only</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Your style can change. The rules cannot.</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-300">Every player enters the board with the same legal moves and the same opportunity to win. Purchases personalize the experience; they do not alter match outcomes.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-emerald-400/25 bg-emerald-950/20 p-6">
              <BadgeCheck className="text-emerald-300" size={30} /><h3 className="mt-5 text-xl font-black">Always cosmetic</h3>
              <p className="mt-3 leading-7 text-stone-300">Themes, piece skins, capture animations by piece type, board skins, victory banners, profile frames, sound packs, and quick-chat packs.</p>
            </div>
            <div className="rounded-3xl border border-red-400/20 bg-red-950/15 p-6">
              <LockKeyhole className="text-red-300" size={30} /><h3 className="mt-5 text-xl font-black">Never for sale</h3>
              <p className="mt-3 leading-7 text-stone-300">Extra moves, stronger pieces, revives, paid undos, rating boosts, clock advantages, matchmaking priority, or guaranteed wins.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-24">
        <div className="mx-auto flex max-w-5xl flex-col items-center rounded-[2.5rem] border border-amber-400/30 bg-[linear-gradient(135deg,rgba(214,162,58,0.22),rgba(255,255,255,0.04))] p-9 text-center shadow-2xl sm:p-14">
          <Crown className="text-amber-300" size={44} />
          <h2 className="mt-6 text-4xl font-black sm:text-6xl">The first crown is free.</h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-300">Learn the defining capture in under a minute, then choose whether to save your progress or keep playing as a guest.</p>
          <button onClick={onPlay} className="mt-8 flex min-h-14 items-center gap-3 rounded-2xl bg-amber-300 px-8 font-black text-stone-950"><Play fill="currentColor" /> Start first victory</button>
        </div>
      </section>
    </main>
  );
}

function TutorialMatch({ onComplete, onSkip }) {
  const [game, setGame] = useState(() => createTutorialGame());
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('Select your ivory rook.');
  const [complete, setComplete] = useState(false);
  const validMoves = useMemo(() => selected === null ? [] : getValidMoveIndices(game, selected), [game, selected]);

  function clickSquare(index) {
    if (complete) return;
    if (selected === null) {
      if (index === TUTORIAL_ROOK) {
        setSelected(index);
        setMessage('Now capture the blue king.');
      } else {
        setMessage('Start with the glowing ivory rook in the center.');
      }
      return;
    }

    if (index === selected) {
      setSelected(null);
      setMessage('Select your ivory rook.');
      return;
    }

    if (selected === TUTORIAL_ROOK && index === TUTORIAL_KING && validMoves.includes(index)) {
      const nextGame = applyMove(game, { seat: 'W', from: TUTORIAL_ROOK, to: TUTORIAL_KING }, Date.now());
      setGame(nextGame);
      setSelected(null);
      setComplete(true);
      setMessage('Crown captured. The blue army is now yours.');
      window.setTimeout(onComplete, 900);
      return;
    }

    setMessage('For this first lesson, use the rook to capture the highlighted blue king.');
  }

  return (
    <main className="min-h-[100svh] bg-[radial-gradient(circle_at_top,#3c2819,#080706_72%)] p-4 text-stone-100 sm:p-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3 font-black tracking-[0.18em] text-amber-300"><span className="grid h-9 w-9 place-items-center rounded-xl border border-amber-300/50 bg-amber-300/10">K</span>KANI</div>
        <button onClick={onSkip} className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-stone-300 hover:bg-white/10">Skip lesson</button>
      </div>
      <section className="mx-auto grid max-w-6xl items-center gap-8 py-8 lg:grid-cols-[0.72fr_1.28fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-300">Your first turn</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Capture a king. Take command.</h1>
          <p className="mt-5 text-lg leading-8 text-stone-300">In Kani, kings are captured directly. When you capture one, you inherit that army. Learn the defining rule with one guided move.</p>
          <div className="mt-7 space-y-3">
            <div className={`flex items-center gap-3 rounded-2xl border p-4 ${selected !== null || complete ? 'border-emerald-400/30 bg-emerald-950/20' : 'border-amber-400/35 bg-amber-950/20'}`}><span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 font-black">1</span><span className="font-bold">Select the ivory rook</span>{(selected !== null || complete) && <Check className="ml-auto text-emerald-300" />}</div>
            <div className={`flex items-center gap-3 rounded-2xl border p-4 ${complete ? 'border-emerald-400/30 bg-emerald-950/20' : selected !== null ? 'border-blue-400/35 bg-blue-950/20' : 'border-white/10 bg-white/[0.03]'}`}><span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 font-black">2</span><span className="font-bold">Capture the blue king</span>{complete && <Check className="ml-auto text-emerald-300" />}</div>
          </div>
          <p className="mt-5 min-h-7 font-bold text-amber-200" aria-live="polite">{message}</p>
          <p className="mt-3 text-sm text-stone-500">No account, payment, or personal information is needed for this lesson.</p>
        </div>
        <div className="relative mx-auto w-full max-w-[680px]">
          <div className="grid aspect-square grid-cols-8 overflow-hidden rounded-[1.5rem] border-[10px] border-stone-950 shadow-[0_35px_100px_rgba(0,0,0,0.7)]">
            {game.board.map((piece, index) => {
              const row = Math.floor(index / 8);
              const column = index % 8;
              const isRook = index === TUTORIAL_ROOK && piece;
              const isKing = index === TUTORIAL_KING && piece;
              const isSelected = selected === index;
              return (
                <button
                  key={index}
                  onClick={() => clickSquare(index)}
                  className={`relative grid place-items-center ${(row + column) % 2 === 0 ? 'bg-[#d9c7a4]' : 'bg-[#725039]'} ${isSelected ? 'ring-4 ring-inset ring-amber-300' : ''} ${isRook && selected === null ? 'after:absolute after:inset-2 after:animate-pulse after:rounded-xl after:border-4 after:border-amber-300' : ''} ${isKing && selected !== null ? 'after:absolute after:inset-2 after:animate-pulse after:rounded-xl after:border-4 after:border-blue-300' : ''}`}
                  aria-label={`Square ${index + 1}${piece ? ` containing ${piece.color === 'W' ? 'ivory' : 'blue'} ${piece.type === 'k' ? 'king' : 'rook'}` : ''}`}
                >
                  {piece && <span className={`grid h-[72%] w-[72%] place-items-center rounded-full border-2 text-[clamp(1.6rem,7vw,4rem)] shadow-xl ${piece.color === 'W' ? 'border-amber-200 bg-stone-50 text-stone-900' : 'border-blue-300 bg-blue-600 text-white'}`}>{PIECE_SYMBOLS[piece.type]}</span>}
                </button>
              );
            })}
          </div>
          {complete && <div className="absolute inset-0 grid place-items-center rounded-[1.5rem] bg-stone-950/80 backdrop-blur-sm"><div className="text-center"><Trophy className="mx-auto text-amber-300" size={64} /><p className="mt-4 text-3xl font-black">First crown captured</p></div></div>}
        </div>
      </section>
    </main>
  );
}

function HubUtilityBar({ onIntroduction }) {
  return (
    <div className="sticky top-0 z-[120] border-b border-white/10 bg-[#080706]/95 text-stone-100 backdrop-blur-xl">
      <div className="mx-auto flex min-h-12 max-w-7xl items-center justify-between gap-3 px-3 sm:px-5">
        <button onClick={onIntroduction} className="flex items-center gap-2 font-black tracking-[0.16em] text-amber-300"><span className="grid h-7 w-7 place-items-center rounded-lg border border-amber-300/50 bg-amber-300/10 text-xs">K</span><span className="hidden sm:inline">KANI</span></button>
        <nav className="flex items-center gap-1 text-xs font-black sm:text-sm" aria-label="Kani hub shortcuts">
          <Link href="/online" className="rounded-full px-3 py-2 text-stone-300 hover:bg-white/10 hover:text-white">Online</Link>
          <Link href="/shop" className="rounded-full px-3 py-2 text-stone-300 hover:bg-white/10 hover:text-white">Cosmetics</Link>
          <Link href="/account" className="rounded-full px-3 py-2 text-stone-300 hover:bg-white/10 hover:text-white">Account</Link>
        </nav>
      </div>
    </div>
  );
}

function PostMatchDecision({ onContinueGuest, onReplay }) {
  return (
    <main className="grid min-h-[100svh] place-items-center bg-[radial-gradient(circle_at_top,#4b2f19,#080706_70%)] p-5 text-stone-100">
      <section className="w-full max-w-5xl rounded-[2.5rem] border border-amber-400/30 bg-stone-950/85 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.65)] sm:p-10">
        <div className="grid gap-9 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-amber-400/25 bg-amber-300/[0.07] p-7 text-center">
            <Trophy className="mx-auto text-amber-300" size={64} />
            <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-amber-300">Victory</p>
            <h1 className="mt-2 text-4xl font-black">The first crown is yours.</h1>
            <div className="mx-auto mt-7 flex max-w-xs items-center justify-center gap-3 rounded-2xl border border-amber-300/30 bg-stone-950/60 p-4">
              <Coins className="text-amber-300" /><div className="text-left"><p className="text-2xl font-black">+{FIRST_VICTORY_PRACTICE_REWARD}</p><p className="text-xs font-bold uppercase tracking-widest text-stone-400">Practice Coins</p></div>
            </div>
            <p className="mt-4 text-sm leading-6 text-stone-400">Practice Coins reward local play. Paid Kani Coins remain a separate, server-owned balance.</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">Your decision</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight">Save progress now—or keep playing locally.</h2>
            <p className="mt-4 leading-7 text-stone-300">A free account becomes useful when you want online rooms, cross-device cosmetics, purchase history, and a persistent player identity. It is not required for local play.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                [Users, 'Online rooms', 'Join private multiplayer with a persistent player identity.'],
                [WandSparkles, 'Saved cosmetics', 'Keep themes and capture effects across devices.'],
                [ShieldCheck, 'Protected purchases', 'Server-owned balances and an itemized ledger.'],
                [Swords, 'Fair competition', 'Account creation never unlocks stronger gameplay.'],
              ].map(([Icon, title, copy]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><Icon className="text-amber-300" size={21} /><h3 className="mt-3 font-black">{title}</h3><p className="mt-1 text-sm leading-6 text-stone-400">{copy}</p></div>)}
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/account?next=%2F%3Fhub%3D1&source=first-victory" className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 font-black text-stone-950"><UserPlus /> Create free account</Link>
              <button onClick={onContinueGuest} className="min-h-14 flex-1 rounded-2xl border border-white/20 bg-white/5 px-5 font-black text-white hover:bg-white/10">Continue as guest</button>
            </div>
            <button onClick={onReplay} className="mt-4 text-sm font-bold text-stone-500 underline underline-offset-4 hover:text-stone-300">Replay the first victory</button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function FirstRunExperience() {
  const [stage, setStage] = useState('landing');
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    const firstRun = readFirstRun();
    setReturning(firstRun.completed || firstRun.tutorialComplete || firstRun.accountCreated);
    const parameters = new URLSearchParams(window.location.search);
    if (parameters.get('hub') === '1') setStage('hub');
    else if (parameters.get('play') === '1') setStage('tutorial');
  }, []);

  function finishTutorial() {
    grantFirstReward();
    setReturning(true);
    setStage('post-match');
  }

  function continueGuest() {
    writeFirstRun({ tutorialComplete: true, completed: true });
    setReturning(true);
    setStage('hub');
  }

  function openHub() {
    writeFirstRun({ completed: true });
    setStage('hub');
  }

  if (stage === 'hub') return <><HubUtilityBar onIntroduction={() => setStage('landing')} /><KaniGame /></>;
  if (stage === 'tutorial') return <TutorialMatch onComplete={finishTutorial} onSkip={continueGuest} />;
  if (stage === 'post-match') return <PostMatchDecision onContinueGuest={continueGuest} onReplay={() => setStage('tutorial')} />;
  return <MarketingLanding onPlay={() => setStage('tutorial')} onOpenHub={openHub} returning={returning} />;
}

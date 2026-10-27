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

function ExperienceNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="kani-heading text-2xl text-[#805022]" aria-label="Kani home">KANI</a>
        <Link href="/account" className="text-sm text-stone-200 hover:text-[#805022]">Sign in</Link>
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
    <div className="relative mx-auto aspect-square w-full max-w-[620px] rotate-[2deg] overflow-hidden rounded-[2rem] border-[12px] border-stone-950/90 bg-[#d7bd96] shadow-[0_45px_120px_rgba(0,0,0,0.7)]" aria-hidden="true">
      <div className="absolute inset-0 grid grid-cols-8">
        {Array.from({ length: 64 }, (_, index) => {
          const piece = pieces.get(index);
          const row = Math.floor(index / 8);
          const column = index % 8;
          return (
            <div key={index} className={`relative grid place-items-center ${(row + column) % 2 === 0 ? 'bg-[#d9c7a4]' : 'bg-[#725039]'}`}>
              {piece && (
                <span className={`kani-cinematic-piece grid h-[70%] w-[70%] place-items-center rounded-full border-2 text-[clamp(1.3rem,4vw,3rem)] shadow-xl ${piece[0] === 'W' ? 'border-amber-200 bg-stone-50 text-stone-900' : piece[0] === 'B' ? 'border-blue-300 bg-blue-600 text-[#2f251c]' : piece[0] === 'K' ? 'border-stone-500 bg-[#d7bd96] text-stone-100' : 'border-red-300 bg-red-600 text-[#2f251c]'}`}>{piece[1]}</span>
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
    <main id="top" className="relative min-h-[100svh] overflow-hidden bg-[#f7f0e5] text-[#32281f]">
      <ExperienceNav />
      <section className="relative grid min-h-[100svh] items-center px-5 pb-12 pt-24 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,#f4d5a8,transparent_55%),linear-gradient(135deg,#fff9eb,#f3e7d1)]" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="max-w-xl">
            <h1 className="text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
              Capture the king.<br />Command the army.
            </h1>
            <div className="mt-8">
              <button onClick={returning ? onOpenHub : onPlay} className="kani-action">
                <Play size={21} fill="currentColor" /> {returning ? 'Continue playing' : 'Play free'}
              </button>
            </div>
          </div>
          <CinematicBoard />
        </div>
      </section>
    </main>
  );
}

function TutorialMatch({ onComplete, onSkip }) {
  const [game, setGame] = useState(() => createTutorialGame());
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('Tap the highlighted rook.');
  const [complete, setComplete] = useState(false);
  const validMoves = useMemo(() => selected === null ? [] : getValidMoveIndices(game, selected), [game, selected]);

  function clickSquare(index) {
    if (complete) return;
    if (selected === null) {
      if (index === TUTORIAL_ROOK) {
        setSelected(index);
        setMessage('Now tap the blue king.');
      } else {
        setMessage('Tap the glowing rook.');
      }
      return;
    }

    if (index === selected) {
      setSelected(null);
      setMessage('Tap the highlighted rook.');
      return;
    }

    if (selected === TUTORIAL_ROOK && index === TUTORIAL_KING && validMoves.includes(index)) {
      const nextGame = applyMove(game, { seat: 'W', from: TUTORIAL_ROOK, to: TUTORIAL_KING }, Date.now());
      setGame(nextGame);
      setSelected(null);
      setComplete(true);
      setMessage('You command the blue army!');
      window.setTimeout(onComplete, 900);
      return;
    }

    setMessage('Capture the highlighted king.');
  }

  return (
    <main className="min-h-[100svh] bg-[#f7f0e5] p-4 text-[#32281f] sm:p-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 py-2">
        <div className="kani-heading text-2xl text-[#805022]">KANI</div>
        <button onClick={onSkip} className="text-sm text-stone-700 underline underline-offset-4 hover:text-[#2f251c]">Skip</button>
      </div>
      <section className="mx-auto grid max-w-6xl items-center gap-8 py-8 lg:grid-cols-[0.72fr_1.28fr]">
        <div>
          <h1 className="text-4xl sm:text-6xl">Capture the blue king.</h1>
          <div className="mt-6 flex items-center gap-4 text-amber-100">
            <span className="text-5xl" aria-hidden="true">♜</span>
            <ArrowRight size={24} className="text-[#925b24]" aria-hidden="true"/>
            <span className="text-5xl text-blue-300" aria-hidden="true">♚</span>
          </div>
          <p className="mt-6 text-lg text-stone-700" aria-live="polite">{message}</p>
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
                  {piece && <span className={`grid h-[72%] w-[72%] place-items-center rounded-full border-2 text-[clamp(1.6rem,7vw,4rem)] shadow-xl ${piece.color === 'W' ? 'border-amber-200 bg-stone-50 text-stone-900' : 'border-blue-300 bg-blue-600 text-[#2f251c]'}`}>{PIECE_SYMBOLS[piece.type]}</span>}
                </button>
              );
            })}
          </div>
          {complete && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#fff4db]/65"><Trophy className="text-[#925b24]" size={70} /></div>}
        </div>
      </section>
    </main>
  );
}

function HubUtilityBar({ onIntroduction }) {
  return (
    <header className="sticky top-0 z-[120] border-b border-white/10 bg-[#100e0c]/95 text-stone-100 backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-5 px-5">
        <button onClick={onIntroduction} className="kani-heading text-xl text-[#805022]">KANI</button>
        <nav className="flex items-center gap-5 text-sm" aria-label="Game navigation">
          <Link href="/online" className="hover:text-[#805022]">Online</Link>
          <Link href="/shop" className="hover:text-[#805022]">Shop</Link>
          <Link href="/account" className="hover:text-[#805022]">Account</Link>
        </nav>
      </div>
    </header>
  );
}

function PostMatchDecision({ onContinueGuest, onReplay }) {
  return (
    <main className="grid min-h-[100svh] place-items-center bg-[#f7f0e5] p-5 text-[#32281f]">
      <section className="w-full max-w-xl text-center">
        <Trophy className="mx-auto text-[#925b24]" size={66} strokeWidth={1.4} />
        <h1 className="mt-6 text-5xl">First victory!</h1>
        <p className="mt-4 flex items-center justify-center gap-2 text-2xl text-[#805022]">
          <Coins size={25} /> +{FIRST_VICTORY_PRACTICE_REWARD} Practice Coins
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={onContinueGuest} className="kani-action">Keep playing <ArrowRight size={18}/></button>
          <Link href="/account?next=%2F%3Fhub%3D1&source=first-victory"
            className="flex min-h-12 items-center justify-center border-b border-stone-500 px-5 text-stone-100 hover:text-[#805022]">
            Save my progress
          </Link>
        </div>
        <button onClick={onReplay} className="mt-6 text-sm text-stone-600 underline underline-offset-4 hover:text-stone-200">Replay lesson</button>
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

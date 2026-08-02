import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FIRST_VICTORY_PRACTICE_REWARD,
  grantFirstVictoryPracticeReward,
  mergeFirstRunState,
  parseFirstRunState,
  safeInternalNextPath,
} from '../src/experience/first-run.mjs';

test('first victory reward is granted once and preserves profile fields', () => {
  const initial = JSON.stringify({ coins: 200, displayName: 'Guest', elo: { ffa: 1300 } });
  const rewarded = grantFirstVictoryPracticeReward(initial, false);
  assert.equal(rewarded.coins, 200 + FIRST_VICTORY_PRACTICE_REWARD);
  assert.equal(rewarded.displayName, 'Guest');
  assert.equal(rewarded.elo.ffa, 1300);
  assert.equal(rewarded.elo.teams, 1200);
  assert.equal(grantFirstVictoryPracticeReward(JSON.stringify(rewarded), true).coins, rewarded.coins);
});

test('first-run state parsing and merging fail safely', () => {
  assert.deepEqual(parseFirstRunState('not-json'), {
    tutorialComplete: false,
    completed: false,
    accountCreated: false,
  });
  assert.deepEqual(
    mergeFirstRunState({ tutorialComplete: true, completed: false }, { completed: true }),
    { tutorialComplete: true, completed: true, accountCreated: false },
  );
});

test('next path accepts only local paths', () => {
  assert.equal(safeInternalNextPath('/online'), '/online');
  assert.equal(safeInternalNextPath('//evil.example'), '/');
  assert.equal(safeInternalNextPath('https://evil.example'), '/');
});

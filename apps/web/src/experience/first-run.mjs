export const FIRST_RUN_STORAGE_KEY = 'kani_first_run_v2';
export const FIRST_REWARD_STORAGE_KEY = 'kani_first_victory_reward_v1';
export const LOCAL_PROFILE_STORAGE_KEY = 'kani_profile';
export const FIRST_VICTORY_PRACTICE_REWARD = 25;

export function parseFirstRunState(rawValue) {
  if (!rawValue) return { tutorialComplete: false, completed: false, accountCreated: false };
  try {
    const parsed = JSON.parse(rawValue);
    return {
      tutorialComplete: Boolean(parsed?.tutorialComplete),
      completed: Boolean(parsed?.completed),
      accountCreated: Boolean(parsed?.accountCreated),
    };
  } catch {
    return { tutorialComplete: false, completed: false, accountCreated: false };
  }
}

export function mergeFirstRunState(currentState, update) {
  return {
    tutorialComplete: Boolean(update?.tutorialComplete ?? currentState?.tutorialComplete),
    completed: Boolean(update?.completed ?? currentState?.completed),
    accountCreated: Boolean(update?.accountCreated ?? currentState?.accountCreated),
  };
}

export function grantFirstVictoryPracticeReward(profileValue, rewardAlreadyGranted) {
  const fallbackProfile = {
    coins: 200,
    elo: { ffa: 1200, teams: 1200, blitz: 1200 },
    unlockedThemes: ['classic', 'medieval', 'tribal'],
    dailyCompleted: null,
  };

  let profile = fallbackProfile;
  try {
    const candidate = typeof profileValue === 'string' ? JSON.parse(profileValue) : profileValue;
    if (candidate && typeof candidate === 'object') {
      profile = {
        ...fallbackProfile,
        ...candidate,
        elo: { ...fallbackProfile.elo, ...(candidate.elo || {}) },
        unlockedThemes: Array.isArray(candidate.unlockedThemes)
          ? candidate.unlockedThemes
          : fallbackProfile.unlockedThemes,
      };
    }
  } catch {
    profile = fallbackProfile;
  }

  if (rewardAlreadyGranted) return profile;

  return {
    ...profile,
    coins: Math.max(0, Number(profile.coins || 0)) + FIRST_VICTORY_PRACTICE_REWARD,
  };
}

export function safeInternalNextPath(candidate, fallback = '/') {
  const value = String(candidate || '').trim();
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}

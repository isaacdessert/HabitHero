/**
 * XP and leveling calculations.
 * All pure functions — no side effects, no storage access.
 */

export const BASE_XP = 50;
export const MAX_LEVEL = 99;

/** XP required to advance FROM this level to the next. */
export function xpToNextLevel(level) {
  if (level >= MAX_LEVEL) return Infinity;
  return level * 50;
}

/** Streak multiplier for XP rewards. */
export function streakMultiplier(streak) {
  if (streak >= 7) return 2.0;
  if (streak >= 3) return 1.5;
  return 1.0;
}

/**
 * Apply a check-in to a skill, returning the updated skill.
 * Handles XP gain, level-ups, and streak tracking.
 */
export function applyCheckIn(skill, todayStr) {
  if (skill.level >= MAX_LEVEL) {
    return { ...skill, lastChecked: todayStr };
  }

  const yesterdayStr = getYesterday();
  const newStreak = skill.lastChecked === yesterdayStr
    ? skill.streak + 1
    : 1;

  const multiplier = streakMultiplier(newStreak);
  const earned = Math.round(BASE_XP * multiplier);

  let { level, xp } = skill;
  let totalXp = (skill.totalXp || 0) + earned;
  let levelsGained = 0;

  xp += earned;
  while (level < MAX_LEVEL && xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level++;
    levelsGained++;
  }

  return {
    ...skill,
    level,
    xp,
    totalXp,
    streak: newStreak,
    lastChecked: todayStr,
    _levelsGained: levelsGained,
    _earned: earned,
    _multiplier: multiplier,
  };
}

/** XP progress as a 0–1 fraction within the current level. */
export function xpFraction(skill) {
  if (skill.level >= MAX_LEVEL) return 1;
  const needed = xpToNextLevel(skill.level);
  return Math.min(skill.xp / needed, 1);
}

/** Human-readable XP string, e.g. "240 / 500 XP" */
export function xpLabel(skill) {
  if (skill.level >= MAX_LEVEL) return 'MAX';
  return `${skill.xp} / ${xpToNextLevel(skill.level)} XP`;
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
}

export function toDateStr(date = new Date()) {
  return date.toISOString().split('T')[0];
}

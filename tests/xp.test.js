import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  xpToNextLevel,
  streakMultiplier,
  applyCheckIn,
  xpFraction,
  xpLabel,
  toDateStr,
  BASE_XP,
  MAX_LEVEL,
} from '../js/xp.js';

// ── xpToNextLevel ─────────────────────────────────────────────────

describe('xpToNextLevel', () => {
  it('level 1 requires 50 XP', () => {
    expect(xpToNextLevel(1)).toBe(50);
  });

  it('level 10 requires 500 XP', () => {
    expect(xpToNextLevel(10)).toBe(500);
  });

  it('level 50 requires 2500 XP', () => {
    expect(xpToNextLevel(50)).toBe(2500);
  });

  it('scales linearly at level * 50 for all levels 1–98', () => {
    for (let lvl = 1; lvl < MAX_LEVEL; lvl++) {
      expect(xpToNextLevel(lvl)).toBe(lvl * 50);
    }
  });

  it('returns Infinity at max level (99)', () => {
    expect(xpToNextLevel(MAX_LEVEL)).toBe(Infinity);
  });
});

// ── streakMultiplier ──────────────────────────────────────────────

describe('streakMultiplier', () => {
  it('1-day streak = 1.0×', () => expect(streakMultiplier(1)).toBe(1.0));
  it('2-day streak = 1.0×', () => expect(streakMultiplier(2)).toBe(1.0));
  it('3-day streak = 1.5×', () => expect(streakMultiplier(3)).toBe(1.5));
  it('6-day streak = 1.5×', () => expect(streakMultiplier(6)).toBe(1.5));
  it('7-day streak = 2.0×', () => expect(streakMultiplier(7)).toBe(2.0));
  it('30-day streak = 2.0× (cap)', () => expect(streakMultiplier(30)).toBe(2.0));
});

// ── applyCheckIn ──────────────────────────────────────────────────

describe('applyCheckIn', () => {
  const TODAY = '2026-03-28';
  const YESTERDAY = '2026-03-27';
  const TWO_DAYS_AGO = '2026-03-26';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-28T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const base = {
    id: 'test-id',
    name: 'Test',
    emoji: '💧',
    level: 1,
    xp: 0,
    totalXp: 0,
    streak: 0,
    lastChecked: null,
  };

  describe('XP awards', () => {
    it('awards base XP (50) with no streak', () => {
      const result = applyCheckIn(base, TODAY);
      expect(result._earned).toBe(BASE_XP);
      expect(result.totalXp).toBe(BASE_XP);
    });

    it('awards 75 XP at a 3-day streak (1.5×)', () => {
      const skill = { ...base, streak: 2, lastChecked: YESTERDAY };
      const result = applyCheckIn(skill, TODAY);
      expect(result._earned).toBe(75);
    });

    it('awards 100 XP at a 7-day streak (2.0×)', () => {
      const skill = { ...base, streak: 6, lastChecked: YESTERDAY };
      const result = applyCheckIn(skill, TODAY);
      expect(result._earned).toBe(100);
    });

    it('accumulates totalXp correctly', () => {
      const skill = { ...base, totalXp: 200 };
      const result = applyCheckIn(skill, TODAY);
      expect(result.totalXp).toBe(250);
    });
  });

  describe('leveling up', () => {
    it('levels up when earned XP crosses the threshold', () => {
      // L1 needs 50 XP; base check-in earns exactly 50
      const result = applyCheckIn(base, TODAY);
      expect(result.level).toBe(2);
      expect(result.xp).toBe(0);
      expect(result._levelsGained).toBe(1);
    });

    it('does not level up when XP stays below threshold', () => {
      // L5 needs 250 XP; starting at 30 XP + 50 = 80 < 250
      const skill = { ...base, level: 5, xp: 30 };
      const result = applyCheckIn(skill, TODAY);
      expect(result.level).toBe(5);
      expect(result.xp).toBe(80);
      expect(result._levelsGained).toBe(0);
    });

    it('carries over excess XP after leveling up', () => {
      // L1 needs 50 XP. At 7-day streak we earn 100 XP.
      // After L1→L2: 100 - 50 = 50 XP carry into L2
      const skill = { ...base, level: 1, xp: 0, streak: 6, lastChecked: YESTERDAY };
      const result = applyCheckIn(skill, TODAY);
      expect(result.level).toBe(2);
      expect(result.xp).toBe(50); // 100 earned - 50 L1 cost
    });

    it('reports 0 levels gained when no level-up occurs', () => {
      const skill = { ...base, level: 10, xp: 0 }; // L10 needs 500 XP
      const result = applyCheckIn(skill, TODAY);
      expect(result._levelsGained).toBe(0);
    });

    it('does not award XP or level up at max level', () => {
      const skill = { ...base, level: MAX_LEVEL, xp: 0, totalXp: 5000 };
      const result = applyCheckIn(skill, TODAY);
      expect(result.level).toBe(MAX_LEVEL);
      expect(result.totalXp).toBe(5000);
    });

    it('still updates lastChecked at max level', () => {
      const skill = { ...base, level: MAX_LEVEL, lastChecked: null };
      const result = applyCheckIn(skill, TODAY);
      expect(result.lastChecked).toBe(TODAY);
    });
  });

  describe('streak logic', () => {
    it('sets streak to 1 on first check-in', () => {
      const result = applyCheckIn(base, TODAY);
      expect(result.streak).toBe(1);
    });

    it('increments streak when last checked yesterday', () => {
      const skill = { ...base, streak: 4, lastChecked: YESTERDAY };
      const result = applyCheckIn(skill, TODAY);
      expect(result.streak).toBe(5);
    });

    it('resets streak to 1 when a day was missed', () => {
      const skill = { ...base, streak: 10, lastChecked: TWO_DAYS_AGO };
      const result = applyCheckIn(skill, TODAY);
      expect(result.streak).toBe(1);
    });

    it('resets streak when last checked was long ago', () => {
      const skill = { ...base, streak: 50, lastChecked: '2025-01-01' };
      const result = applyCheckIn(skill, TODAY);
      expect(result.streak).toBe(1);
    });

    it('uses the lower 1.0× multiplier after a streak reset', () => {
      const skill = { ...base, streak: 10, lastChecked: TWO_DAYS_AGO };
      const result = applyCheckIn(skill, TODAY);
      expect(result._multiplier).toBe(1.0);
      expect(result._earned).toBe(50);
    });
  });

  describe('immutability', () => {
    it('does not mutate the original skill object', () => {
      const original = { ...base };
      applyCheckIn(base, TODAY);
      expect(base).toEqual(original);
    });
  });

  it('always sets lastChecked to today', () => {
    const result = applyCheckIn(base, TODAY);
    expect(result.lastChecked).toBe(TODAY);
  });
});

// ── xpFraction ────────────────────────────────────────────────────

describe('xpFraction', () => {
  it('returns 0 at the start of a level', () => {
    expect(xpFraction({ level: 5, xp: 0 })).toBe(0);
  });

  it('returns 0.5 at halfway through a level', () => {
    // L5 needs 250 XP
    expect(xpFraction({ level: 5, xp: 125 })).toBe(0.5);
  });

  it('returns 1 at max level', () => {
    expect(xpFraction({ level: MAX_LEVEL, xp: 0 })).toBe(1);
  });

  it('never exceeds 1', () => {
    expect(xpFraction({ level: 3, xp: 9999 })).toBe(1);
  });
});

// ── xpLabel ───────────────────────────────────────────────────────

describe('xpLabel', () => {
  it('shows current XP / XP needed', () => {
    expect(xpLabel({ level: 5, xp: 100 })).toBe('100 / 250 XP');
  });

  it('shows MAX at max level', () => {
    expect(xpLabel({ level: MAX_LEVEL, xp: 0 })).toBe('MAX');
  });
});

// ── toDateStr ─────────────────────────────────────────────────────

describe('toDateStr', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(toDateStr(new Date('2026-03-28T15:30:00Z'))).toBe('2026-03-28');
  });

  it('uses current date when no argument given', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T00:00:00Z'));
    expect(toDateStr()).toBe('2026-06-15');
    vi.useRealTimers();
  });
});

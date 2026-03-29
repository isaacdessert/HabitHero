import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock storage so habits.js never touches chrome.storage
vi.mock('../js/storage.js', () => ({
  load:    vi.fn(),
  save:    vi.fn().mockResolvedValue(undefined),
  loadAll: vi.fn(),
}));

import { save } from '../js/storage.js';
import { isDoneToday, addSkill, deleteSkill } from '../js/habits.js';

// ── isDoneToday ───────────────────────────────────────────────────

describe('isDoneToday', () => {
  it('returns true when lastChecked equals today', () => {
    expect(isDoneToday({ lastChecked: '2026-03-28' }, '2026-03-28')).toBe(true);
  });

  it('returns false when lastChecked is a different date', () => {
    expect(isDoneToday({ lastChecked: '2026-03-27' }, '2026-03-28')).toBe(false);
  });

  it('returns false when lastChecked is null', () => {
    expect(isDoneToday({ lastChecked: null }, '2026-03-28')).toBe(false);
  });

  it('returns false when lastChecked is undefined', () => {
    expect(isDoneToday({ lastChecked: undefined }, '2026-03-28')).toBe(false);
  });
});

// ── addSkill ──────────────────────────────────────────────────────

describe('addSkill', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when name is empty', async () => {
    await expect(addSkill([], { name: '', emoji: '💧' }))
      .rejects.toThrow();
  });

  it('throws when name is whitespace only', async () => {
    await expect(addSkill([], { name: '   ', emoji: '💧' }))
      .rejects.toThrow();
  });

  it('throws when already at 8 skills (capacity)', async () => {
    const full = Array(8).fill(null).map((_, i) => ({
      id: `id-${i}`, name: `Skill ${i}`, emoji: '✨',
      level: 1, xp: 0, totalXp: 0, streak: 0, lastChecked: null,
    }));
    await expect(addSkill(full, { name: 'Extra', emoji: '🎯' }))
      .rejects.toThrow();
  });

  it('adds a skill with correct default values', async () => {
    const result = await addSkill([], { name: 'Meditate', emoji: '🧘' });
    expect(result).toHaveLength(1);
    const skill = result[0];
    expect(skill.name).toBe('Meditate');
    expect(skill.emoji).toBe('🧘');
    expect(skill.level).toBe(1);
    expect(skill.xp).toBe(0);
    expect(skill.totalXp).toBe(0);
    expect(skill.streak).toBe(0);
    expect(skill.lastChecked).toBeNull();
    expect(skill.id).toBeTruthy();
  });

  it('trims whitespace from name', async () => {
    const result = await addSkill([], { name: '  Yoga  ', emoji: '🧘' });
    expect(result[0].name).toBe('Yoga');
  });

  it('appends to an existing skills array', async () => {
    const existing = [{ id: 'abc', name: 'Existing', emoji: '💧', level: 1, xp: 0, totalXp: 0, streak: 0, lastChecked: null }];
    const result = await addSkill(existing, { name: 'New', emoji: '🏋️' });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('abc');
    expect(result[1].name).toBe('New');
  });

  it('assigns a unique id to each skill', async () => {
    const r1 = await addSkill([], { name: 'A', emoji: '💧' });
    const r2 = await addSkill([], { name: 'B', emoji: '💊' });
    expect(r1[0].id).not.toBe(r2[0].id);
  });

  it('persists the updated skills array to storage', async () => {
    await addSkill([], { name: 'Run', emoji: '🏃' });
    expect(save).toHaveBeenCalledOnce();
  });
});

// ── deleteSkill ───────────────────────────────────────────────────

describe('deleteSkill', () => {
  beforeEach(() => vi.clearAllMocks());

  const skills = [
    { id: 'aaa', name: 'A', emoji: '💧', level: 1, xp: 0, totalXp: 0, streak: 0, lastChecked: null },
    { id: 'bbb', name: 'B', emoji: '💊', level: 1, xp: 0, totalXp: 0, streak: 0, lastChecked: null },
    { id: 'ccc', name: 'C', emoji: '🏋️', level: 1, xp: 0, totalXp: 0, streak: 0, lastChecked: null },
  ];

  it('removes the skill with the given id', async () => {
    const result = await deleteSkill(skills, 'bbb');
    expect(result.map(s => s.id)).toEqual(['aaa', 'ccc']);
  });

  it('leaves all other skills intact', async () => {
    const result = await deleteSkill(skills, 'aaa');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('bbb');
    expect(result[1].id).toBe('ccc');
  });

  it('returns empty array when last skill is deleted', async () => {
    const single = [skills[0]];
    const result = await deleteSkill(single, 'aaa');
    expect(result).toHaveLength(0);
  });

  it('returns unchanged array when id is not found', async () => {
    const result = await deleteSkill(skills, 'nonexistent');
    expect(result).toHaveLength(3);
  });

  it('persists the updated skills array to storage', async () => {
    await deleteSkill(skills, 'aaa');
    expect(save).toHaveBeenCalledOnce();
  });
});

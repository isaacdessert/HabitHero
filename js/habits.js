/**
 * Habit/skill state management.
 * Handles init, CRUD, and daily reset detection.
 */

import { load, save } from './storage.js';
import { toDateStr } from './xp.js';

const DEFAULT_SKILLS = [
  { emoji: '💧', name: 'Hydration'   },
  { emoji: '💊', name: 'Supplements' },
  { emoji: '🏋️', name: 'Workout'     },
  { emoji: '📖', name: 'Reading'     },
];

function makeSkill({ emoji, name }) {
  return {
    id: crypto.randomUUID(),
    name,
    emoji,
    level: 1,
    xp: 0,
    totalXp: 0,
    streak: 0,
    lastChecked: null,
  };
}

/**
 * Load state from storage, seed defaults on first run,
 * and return { skills, today }.
 */
export async function loadState() {
  const stored = await load(null);

  const today = toDateStr();

  let skills = stored.skills;
  if (!skills || skills.length === 0) {
    skills = DEFAULT_SKILLS.map(makeSkill);
  }

  await save({ skills, today });
  return { skills, today };
}

/** Persist the full skills array. */
export async function saveSkills(skills) {
  await save({ skills });
}

/** Add a new skill. Returns the updated skills array. */
export async function addSkill(skills, { name, emoji }) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Skill name cannot be empty.');
  if (skills.length >= 8) throw new Error('Maximum 8 skills reached.');

  const updated = [...skills, makeSkill({ name: trimmed, emoji })];
  await saveSkills(updated);
  return updated;
}

/** Delete a skill by id. Returns the updated skills array. */
export async function deleteSkill(skills, id) {
  const updated = skills.filter(s => s.id !== id);
  await saveSkills(updated);
  return updated;
}

/** Check if a skill has been completed today. */
export function isDoneToday(skill, today) {
  return skill.lastChecked === today;
}

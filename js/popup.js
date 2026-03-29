/**
 * Popup entry point — compact daily check-in list.
 * Opens dashboard.html for full management.
 */

import { loadState, saveSkills, isDoneToday } from './habits.js';
import { applyCheckIn, xpFraction, xpLabel } from './xp.js';

let state = { skills: [], today: '' };

async function init() {
  state = await loadState();
  render();

  document.getElementById('manage-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    window.close();
  });
}

function render() {
  const list = document.getElementById('skill-list');
  list.innerHTML = '';
  state.skills.forEach(skill => {
    list.appendChild(buildRow(skill));
  });
}

function buildRow(skill) {
  const done = isDoneToday(skill, state.today);
  const pct  = Math.round(xpFraction(skill) * 100);

  const row = document.createElement('div');
  row.className = `skill-row${done ? ' skill-row--done' : ''}`;
  row.dataset.id = skill.id;

  row.innerHTML = `
    <span class="skill-row__icon">${skill.emoji}</span>
    <div class="skill-row__meta">
      <span class="skill-row__name">${escHtml(skill.name.toUpperCase())}</span>
      <span class="skill-row__level">LV. ${skill.level} &nbsp; ${escHtml(xpLabel(skill))}</span>
      ${skill.streak > 1 ? `<span class="skill-row__streak">🔥 ${skill.streak}-DAY STREAK</span>` : ''}
    </div>
    <button class="skill-row__btn${done ? ' skill-row__btn--done' : ''}" ${done ? 'disabled' : ''}>
      ${done ? '✓ DONE!' : 'CHECK IN'}
    </button>
    <div class="skill-row__bar-wrap">
      <div class="skill-row__bar-fill" style="width:${pct}%"></div>
    </div>
  `;

  if (!done) {
    row.querySelector('.skill-row__btn').addEventListener('click', () => handleCheckIn(skill.id));
  }

  return row;
}

async function handleCheckIn(id) {
  const skill = state.skills.find(s => s.id === id);
  if (!skill || isDoneToday(skill, state.today)) return;

  const updated = applyCheckIn(skill, state.today);
  state.skills = state.skills.map(s => s.id === id ? updated : s);
  await saveSkills(state.skills);

  // Re-render then show feedback on the updated row
  render();

  const row = document.querySelector(`[data-id="${id}"]`);
  if (!row) return;

  // XP gain toast
  const toast = document.createElement('div');
  toast.className = 'xp-gain-toast';
  const mult = updated._multiplier > 1 ? ` ${updated._multiplier}×🔥` : '';
  toast.textContent = `+${updated._earned} XP${mult}`;
  row.appendChild(toast);
  setTimeout(() => toast.remove(), 1400);

  // Level-up flash
  if (updated._levelsGained > 0) {
    row.classList.add('tile--levelup');
    setTimeout(() => row.classList.remove('tile--levelup'), 1200);
  }
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', init);

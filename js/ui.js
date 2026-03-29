/**
 * All DOM rendering. No storage access — receives state, emits events.
 * Exports: renderGrid, showDetail, showAddModal, showLevelUp
 */

import { xpFraction, xpLabel, xpToNextLevel, MAX_LEVEL } from './xp.js';
import { isDoneToday } from './habits.js';

// ── Grid ──────────────────────────────────────────────────────────

export function renderGrid(skills, today, { onCheckIn, onDetail, onAdd, onDelete }) {
  const grid = document.getElementById('skill-grid');
  grid.innerHTML = '';

  skills.forEach(skill => {
    const done = isDoneToday(skill, today);
    const tile = buildTile(skill, done, { onCheckIn, onDetail, onDelete });
    grid.appendChild(tile);
  });

  // Add skill button (only if room)
  if (skills.length < 8) {
    const addBtn = document.createElement('button');
    addBtn.className = 'tile tile--add';
    addBtn.innerHTML = `<span class="tile__add-icon">+</span><span class="tile__add-label">NEW QUEST</span>`;
    addBtn.addEventListener('click', onAdd);
    grid.appendChild(addBtn);
  }
}

function buildTile(skill, done, { onCheckIn, onDetail, onDelete }) {
  const tile = document.createElement('div');
  tile.className = `tile${done ? ' tile--done' : ''}`;
  tile.dataset.id = skill.id;

  const fraction = xpFraction(skill);
  const pct = Math.round(fraction * 100);
  const maxed = skill.level >= MAX_LEVEL;

  tile.innerHTML = `
    <button class="tile__delete" title="Remove skill" aria-label="Remove ${skill.name}">✕</button>
    <div class="tile__icon">${skill.emoji}</div>
    <div class="tile__name">${escHtml(skill.name.toUpperCase())}</div>
    <div class="tile__level" id="level-${skill.id}">LV. ${skill.level}</div>
    <div class="tile__xp-bar">
      <div class="tile__xp-fill" style="width:${pct}%"></div>
    </div>
    <div class="tile__xp-label">${maxed ? 'MAX LEVEL' : escHtml(xpLabel(skill))}</div>
    ${skill.streak > 1 ? `<div class="tile__streak">🔥 ${skill.streak} DAY${skill.streak > 1 ? 'S' : ''}</div>` : ''}
    <button class="tile__btn${done ? ' tile__btn--done' : ''}" ${done ? 'disabled' : ''}>
      ${done ? '✓ DONE!' : 'CHECK IN'}
    </button>
  `;

  tile.querySelector('.tile__btn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (!done) onCheckIn(skill.id);
  });

  tile.querySelector('.tile__delete').addEventListener('click', (e) => {
    e.stopPropagation();
    onDelete(skill.id);
  });

  // Tap tile body (not button/delete) to open detail
  tile.addEventListener('click', (e) => {
    if (!e.target.closest('.tile__btn') && !e.target.closest('.tile__delete')) {
      onDetail(skill);
    }
  });

  return tile;
}

// ── Level-up animation ────────────────────────────────────────────

export function showLevelUp(skillId, newLevel) {
  const tile = document.querySelector(`[data-id="${skillId}"]`);
  if (!tile) return;

  // Update level display immediately
  const levelEl = tile.querySelector('.tile__level');
  if (levelEl) levelEl.textContent = `LV. ${newLevel}`;

  // Flash animation
  tile.classList.add('tile--levelup');
  setTimeout(() => tile.classList.remove('tile--levelup'), 1200);

  // Floating "+LEVEL UP!" toast
  const toast = document.createElement('div');
  toast.className = 'levelup-toast';
  toast.textContent = `⬆ LEVEL ${newLevel}!`;
  tile.appendChild(toast);
  setTimeout(() => toast.remove(), 1800);
}

// ── Skill detail modal ────────────────────────────────────────────

export function showDetail(skill, today) {
  const done = isDoneToday(skill, today);
  setModal(`
    <div class="modal__header">
      <span class="modal__icon">${skill.emoji}</span>
      <span class="modal__title">${escHtml(skill.name.toUpperCase())}</span>
    </div>
    <div class="modal__stats">
      <div class="modal__stat">
        <span class="modal__stat-label">LEVEL</span>
        <span class="modal__stat-value">${skill.level} / ${MAX_LEVEL}</span>
      </div>
      <div class="modal__stat">
        <span class="modal__stat-label">XP</span>
        <span class="modal__stat-value">${skill.level >= MAX_LEVEL ? 'MAX' : `${skill.xp} / ${xpToNextLevel(skill.level)}`}</span>
      </div>
      <div class="modal__stat">
        <span class="modal__stat-label">STREAK</span>
        <span class="modal__stat-value">${skill.streak} DAY${skill.streak !== 1 ? 'S' : ''}</span>
      </div>
      <div class="modal__stat">
        <span class="modal__stat-label">TOTAL XP</span>
        <span class="modal__stat-value">${skill.totalXp || 0}</span>
      </div>
    </div>
    <div class="modal__status">${done ? '✓ Completed today!' : 'Not checked in today.'}</div>
    <button class="modal__close btn">CLOSE</button>
  `);
  document.querySelector('.modal__close').addEventListener('click', closeModal);
}

// ── Add skill modal ───────────────────────────────────────────────

const EMOJI_OPTIONS = [
  '🏃','🚴','🧘','💪','🥗','🥤','💧','😴','💊','🧠',
  '📖','✍️','🎯','🎸','🎨','💻','🌿','🛁','☀️','❤️',
];

export function showAddModal(onConfirm) {
  setModal(`
    <div class="modal__title">NEW QUEST</div>
    <div class="modal__field">
      <label class="modal__label">QUEST NAME</label>
      <input id="skill-name-input" class="modal__input" maxlength="14" placeholder="e.g. MEDITATE" />
    </div>
    <div class="modal__field">
      <label class="modal__label">ICON</label>
      <div class="emoji-grid" id="emoji-grid">
        ${EMOJI_OPTIONS.map(e => `<button class="emoji-btn" data-emoji="${e}">${e}</button>`).join('')}
      </div>
    </div>
    <div class="modal__actions">
      <button class="btn btn--secondary" id="modal-cancel">CANCEL</button>
      <button class="btn" id="modal-confirm">ADD QUEST</button>
    </div>
  `);

  let selectedEmoji = EMOJI_OPTIONS[0];
  document.querySelector(`[data-emoji="${selectedEmoji}"]`).classList.add('emoji-btn--selected');

  document.getElementById('emoji-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.emoji-btn');
    if (!btn) return;
    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('emoji-btn--selected'));
    btn.classList.add('emoji-btn--selected');
    selectedEmoji = btn.dataset.emoji;
  });

  document.getElementById('modal-cancel').addEventListener('click', closeModal);

  document.getElementById('modal-confirm').addEventListener('click', () => {
    const name = document.getElementById('skill-name-input').value.trim();
    if (!name) {
      document.getElementById('skill-name-input').focus();
      return;
    }
    onConfirm({ name, emoji: selectedEmoji });
    closeModal();
  });

  document.getElementById('skill-name-input').focus();
}

// ── Modal helpers ─────────────────────────────────────────────────

function setModal(html) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  box.innerHTML = html;
  overlay.classList.remove('hidden');

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  }, { once: true });
}

export function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ── Misc ──────────────────────────────────────────────────────────

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

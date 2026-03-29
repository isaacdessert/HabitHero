/**
 * Entry point. Loads state, renders UI, wires all events.
 */

import { loadState, saveSkills, addSkill, deleteSkill, isDoneToday } from './habits.js';
import { applyCheckIn } from './xp.js';
import { renderGrid, showDetail, showAddModal, showLevelUp } from './ui.js';

let state = { skills: [], today: '' };

async function init() {
  state = await loadState();
  render();
}

function render() {
  renderGrid(state.skills, state.today, {
    onCheckIn: handleCheckIn,
    onDetail:  handleDetail,
    onAdd:     handleAdd,
    onDelete:  handleDelete,
  });
}

async function handleCheckIn(id) {
  const skill = state.skills.find(s => s.id === id);
  if (!skill || isDoneToday(skill, state.today)) return;

  const updated = applyCheckIn(skill, state.today);
  state.skills = state.skills.map(s => s.id === id ? updated : s);
  await saveSkills(state.skills);

  render();

  if (updated._levelsGained > 0) {
    showLevelUp(id, updated.level);
  }
}

function handleDetail(skill) {
  showDetail(skill, state.today);
}

function handleAdd() {
  showAddModal(async ({ name, emoji }) => {
    try {
      state.skills = await addSkill(state.skills, { name, emoji });
      render();
    } catch (e) {
      alert(e.message);
    }
  });
}

async function handleDelete(id) {
  state.skills = await deleteSkill(state.skills, id);
  render();
}

document.addEventListener('DOMContentLoaded', init);

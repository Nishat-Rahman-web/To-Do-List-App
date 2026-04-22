// ─── State ────────────────────────────────────────────────────────────────────
let tasks         = [];
let currentFilter = "all";
let darkMode      = false;
let editingId     = null;

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const themeToggle       = document.getElementById("themeToggle");
const themeIcon         = document.getElementById("themeIcon");
const taskInput         = document.getElementById("taskInput");
const addBtn            = document.getElementById("addBtn");
const inputError        = document.getElementById("inputError");
const taskList          = document.getElementById("taskList");
const emptyState        = document.getElementById("emptyState");
const emptyText         = document.getElementById("emptyText");
const statsBar          = document.getElementById("statsBar");
const statTotal         = document.getElementById("statTotal");
const statActive        = document.getElementById("statActive");
const statDone          = document.getElementById("statDone");
const filterBar         = document.getElementById("filterBar");
const filterBtns        = document.querySelectorAll(".filter-btn");
const bulkActions       = document.getElementById("bulkActions");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const clearAllBtn       = document.getElementById("clearAllBtn");
const modalOverlay      = document.getElementById("modalOverlay");
const modalInput        = document.getElementById("modalInput");
const modalError        = document.getElementById("modalError");
const modalCancel       = document.getElementById("modalCancel");
const modalSave         = document.getElementById("modalSave");

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  const savedTheme = localStorage.getItem("todoapp-theme");
  if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    darkMode = true;
  }
  applyTheme();

  try {
    const saved = localStorage.getItem("todoapp-tasks");
    tasks = saved ? JSON.parse(saved) : [];
  } catch {
    tasks = [];
  }

  renderTasks();
  taskInput.focus();
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const SVG_SUN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="4"/>
  <line x1="12" y1="2"  x2="12" y2="5"/>
  <line x1="12" y1="19" x2="12" y2="22"/>
  <line x1="4.22" y1="4.22"  x2="6.34" y2="6.34"/>
  <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
  <line x1="2"  y1="12" x2="5"  y2="12"/>
  <line x1="19" y1="12" x2="22" y2="12"/>
  <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
  <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22"/>
</svg>`;

const SVG_MOON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
</svg>`;

function applyTheme() {
  document.body.classList.toggle("dark", darkMode);
  themeIcon.innerHTML = darkMode ? SVG_SUN : SVG_MOON;
  localStorage.setItem("todoapp-theme", darkMode ? "dark" : "light");
}

themeToggle.addEventListener("click", () => {
  darkMode = !darkMode;
  applyTheme();
});

// ─── Add Task ─────────────────────────────────────────────────────────────────
function addTask() {
  const text = taskInput.value.trim();

  if (!text) {
    showInputError("Please enter a task.");
    taskInput.classList.add("shake");
    taskInput.addEventListener("animationend", () => taskInput.classList.remove("shake"), { once: true });
    return;
  }

  hideInputError();

  tasks.unshift({
    id:        Date.now().toString(),
    text,
    completed: false,
  });

  taskInput.value = "";
  saveTasks();
  renderTasks();
  taskInput.focus();
}

addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });
taskInput.addEventListener("input", hideInputError);

function showInputError(msg) {
  inputError.textContent = msg;
  inputError.classList.add("show");
}
function hideInputError() {
  inputError.classList.remove("show");
}

// ─── Toggle Complete ──────────────────────────────────────────────────────────
function toggleComplete(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTasks();
  renderTasks();
}

// ─── Delete Task ──────────────────────────────────────────────────────────────
function deleteTask(id) {
  const item = document.querySelector(`.task-item[data-id="${id}"]`);
  if (item) {
    item.classList.add("removing");
    item.addEventListener("animationend", () => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      renderTasks();
    }, { once: true });
  } else {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }
}

// ─── Edit Task ────────────────────────────────────────────────────────────────
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingId = id;
  modalInput.value = task.text;
  modalError.classList.remove("show");
  openModal();
  setTimeout(() => { modalInput.focus(); modalInput.select(); }, 100);
}

function saveEdit() {
  const text = modalInput.value.trim();
  if (!text) {
    modalError.classList.add("show");
    modalInput.classList.add("shake");
    modalInput.addEventListener("animationend", () => modalInput.classList.remove("shake"), { once: true });
    return;
  }
  tasks = tasks.map(t => t.id === editingId ? { ...t, text } : t);
  editingId = null;
  saveTasks();
  renderTasks();
  closeModal();
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal() {
  modalOverlay.classList.add("open");
}
function closeModal() {
  modalOverlay.classList.remove("open");
  editingId = null;
}

modalSave.addEventListener("click", saveEdit);
modalCancel.addEventListener("click", closeModal);
modalInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveEdit();
  if (e.key === "Escape") closeModal();
});
modalInput.addEventListener("input", () => modalError.classList.remove("show"));
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeModal(); });

// ─── Clear Actions ────────────────────────────────────────────────────────────
clearCompletedBtn.addEventListener("click", () => {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
});

clearAllBtn.addEventListener("click", () => {
  if (tasks.length === 0) return;
  tasks = [];
  saveTasks();
  renderTasks();
});

// ─── Filter ───────────────────────────────────────────────────────────────────
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderTasks();
  });
});

// ─── Persist ──────────────────────────────────────────────────────────────────
function saveTasks() {
  localStorage.setItem("todoapp-tasks", JSON.stringify(tasks));
}

// ─── Render Tasks ─────────────────────────────────────────────────────────────
function renderTasks() {
  const total     = tasks.length;
  const active    = tasks.filter(t => !t.completed).length;
  const done      = tasks.filter(t =>  t.completed).length;

  // Stats
  statTotal.textContent  = total;
  statActive.textContent = active;
  statDone.textContent   = done;

  // Filter + empty state visibility
  const filtered = tasks.filter(t => {
    if (currentFilter === "active")    return !t.completed;
    if (currentFilter === "completed") return  t.completed;
    return true;
  });

  // Bulk actions visibility
  bulkActions.classList.toggle("show", total > 0);

  // Empty state
  const isEmpty = filtered.length === 0;
  emptyState.classList.toggle("show", isEmpty);
  const messages = {
    all:       total === 0 ? "No tasks yet. Add one above!" : "No tasks match this filter.",
    active:    "No active tasks — all done! 🎉",
    completed: "No completed tasks yet.",
  };
  emptyText.textContent = messages[currentFilter] || messages.all;

  // Build list HTML
  taskList.innerHTML = filtered.map(task => `
    <li class="task-item${task.completed ? " completed" : ""}" data-id="${task.id}">
      <button class="check-btn" title="${task.completed ? "Mark active" : "Mark complete"}">
        ${task.completed ? `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>` : ""}
      </button>
      <span class="task-text">${escapeHtml(task.text)}</span>
      <div class="task-actions">
        <button class="action-btn btn-edit" title="Edit task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="action-btn btn-delete" title="Delete task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
        </button>
      </div>
    </li>
  `).join("");
}

// ─── Delegated Click Handler ──────────────────────────────────────────────────
taskList.addEventListener("click", (e) => {
  const item = e.target.closest(".task-item");
  if (!item) return;
  const id = item.dataset.id;

  if (e.target.closest(".check-btn"))  { toggleComplete(id); return; }
  if (e.target.closest(".btn-edit"))   { editTask(id);        return; }
  if (e.target.closest(".btn-delete")) { deleteTask(id);      return; }
});

// ─── Escape HTML ──────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Keyboard shortcut: Escape closes modal ───────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay.classList.contains("open")) closeModal();
});

// ─── Start ────────────────────────────────────────────────────────────────────
init();

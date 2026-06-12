const STORAGE_KEY = "quadrant-tasks-v1";

const quadrants = [
  { id: "do", name: "DO NOW", subtitle: "Urgent & Important", color: "#b93a2c", soft: "#fbefea", line: "#e7b6ae" },
  { id: "schedule", name: "SCHEDULE", subtitle: "Important & Not Urgent", color: "#477347", soft: "#eff5ed", line: "#b9d0b7" },
  { id: "delegate", name: "DELEGATE", subtitle: "Urgent & Not Important", color: "#b67820", soft: "#fcf4e7", line: "#e5c99c" },
  { id: "eliminate", name: "ELIMINATE", subtitle: "Not Urgent & Not Important", color: "#61706d", soft: "#f0f2ef", line: "#c9d0ce" },
];

const seedTasks = [
  { id: crypto.randomUUID(), title: "Send project proposal", quadrant: "do", category: "Work", dueDate: todayISO(), dueTime: "09:00", notes: "", completed: false },
  { id: crypto.randomUUID(), title: "Pay electricity bill", quadrant: "do", category: "Personal", dueDate: todayISO(), dueTime: "17:30", notes: "", completed: false },
  { id: crypto.randomUUID(), title: "Plan next quarter goals", quadrant: "schedule", category: "Growth", dueDate: offsetISO(3), dueTime: "", notes: "", completed: false },
  { id: crypto.randomUUID(), title: "Exercise for 30 minutes", quadrant: "schedule", category: "Health", dueDate: offsetISO(1), dueTime: "18:00", notes: "", completed: false },
  { id: crypto.randomUUID(), title: "Reply to routine emails", quadrant: "delegate", category: "Work", dueDate: todayISO(), dueTime: "14:00", notes: "", completed: false },
  { id: crypto.randomUUID(), title: "Organize old downloads", quadrant: "eliminate", category: "Personal", dueDate: "", dueTime: "", notes: "", completed: false },
];

let tasks = loadTasks();
let activeView = "today";
let searchTerm = "";
let draggedTaskId = null;

const matrix = document.querySelector("#matrix");
const modal = document.querySelector("#taskModal");
const form = document.querySelector("#taskForm");
const taskId = document.querySelector("#taskId");
const taskTitle = document.querySelector("#taskTitle");
const taskQuadrant = document.querySelector("#taskQuadrant");
const taskCategory = document.querySelector("#taskCategory");
const taskDueDate = document.querySelector("#taskDueDate");
const taskDueTime = document.querySelector("#taskDueTime");
const taskNotes = document.querySelector("#taskNotes");

taskQuadrant.innerHTML = quadrants.map(q => `<option value="${q.id}">${q.name} — ${q.subtitle}</option>`).join("");

function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function offsetISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : seedTasks;
  } catch {
    return seedTasks;
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDue(task) {
  if (!task.dueDate && !task.dueTime) return "Someday";
  const date = task.dueDate === todayISO()
    ? "Today"
    : task.dueDate
      ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${task.dueDate}T12:00:00`))
      : "";
  const time = task.dueTime
    ? new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(`2000-01-01T${task.dueTime}`))
    : "";
  return [date, time].filter(Boolean).join(", ");
}

function filteredTasks() {
  return tasks.filter(task => {
    const matchesSearch = `${task.title} ${task.category} ${task.notes}`.toLowerCase().includes(searchTerm);
    if (!matchesSearch) return false;
    if (activeView === "completed") return task.completed;
    if (activeView === "today") return !task.completed;
    return true;
  });
}

function render() {
  const visible = filteredTasks();
  matrix.innerHTML = quadrants.map((quadrant, index) => {
    const quadrantTasks = visible.filter(task => task.quadrant === quadrant.id);
    return `
      <section class="quadrant" data-quadrant="${quadrant.id}" style="--quad:${quadrant.color};--quad-soft:${quadrant.soft};--quad-line:${quadrant.line}">
        <header class="quadrant-header">
          <span class="quadrant-number">${index + 1}</span>
          <h2>${quadrant.name} <span>— ${quadrant.subtitle}</span></h2>
          <span class="quadrant-count">${quadrantTasks.length}</span>
        </header>
        <div class="task-list">
          ${quadrantTasks.length ? quadrantTasks.map(taskTemplate).join("") : `<p class="empty-state">No tasks here. Leave space, or add one.</p>`}
        </div>
        <button class="quadrant-add" data-add="${quadrant.id}">
          <span class="material-symbols-rounded">add</span> Add task
        </button>
      </section>`;
  }).join("");

  bindMatrixEvents();
  renderSummary();
}

function taskTemplate(task) {
  return `
    <article class="task-row ${task.completed ? "completed" : ""}" draggable="true" data-task="${task.id}">
      <button class="check-button" data-complete="${task.id}" aria-label="${task.completed ? "Mark incomplete" : "Complete task"}">
        <span class="material-symbols-rounded">check</span>
      </button>
      <span class="task-title">${escapeHTML(task.title)}</span>
      <span class="task-due">${formatDue(task)}</span>
      <span class="task-tag">${escapeHTML(task.category || "Personal")}</span>
      <button class="row-menu" data-edit="${task.id}" aria-label="Edit task">
        <span class="material-symbols-rounded">more_vert</span>
      </button>
    </article>`;
}

function escapeHTML(value = "") {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function bindMatrixEvents() {
  document.querySelectorAll("[data-add]").forEach(button => button.addEventListener("click", () => openTaskModal(null, button.dataset.add)));
  document.querySelectorAll("[data-edit]").forEach(button => button.addEventListener("click", () => openTaskModal(button.dataset.edit)));
  document.querySelectorAll("[data-complete]").forEach(button => button.addEventListener("click", () => toggleTask(button.dataset.complete)));
  document.querySelectorAll(".task-row").forEach(row => {
    row.addEventListener("dragstart", () => {
      draggedTaskId = row.dataset.task;
      row.classList.add("dragging");
    });
    row.addEventListener("dragend", () => {
      draggedTaskId = null;
      row.classList.remove("dragging");
      document.querySelectorAll(".drag-over").forEach(item => item.classList.remove("drag-over"));
    });
    row.addEventListener("dblclick", () => openTaskModal(row.dataset.task));
  });
  document.querySelectorAll(".quadrant").forEach(quadrant => {
    quadrant.addEventListener("dragover", event => {
      event.preventDefault();
      quadrant.classList.add("drag-over");
    });
    quadrant.addEventListener("dragleave", () => quadrant.classList.remove("drag-over"));
    quadrant.addEventListener("drop", event => {
      event.preventDefault();
      moveTask(draggedTaskId, quadrant.dataset.quadrant);
    });
  });
}

function renderSummary() {
  const completed = tasks.filter(task => task.completed).length;
  const total = tasks.length;
  const percent = total ? Math.round(completed / total * 100) : 0;
  document.querySelector("#progressPercent").textContent = `${percent}%`;
  document.querySelector("#progressFraction").textContent = `${completed} / ${total} tasks`;
  document.querySelector("#completedCount").textContent = completed;
  document.querySelector("#remainingCount").textContent = total - completed;
  document.querySelector("#footerComplete").textContent = `${completed} completed today`;
  document.querySelector("#progressRing").style.setProperty("--progress", `${percent * 3.6}deg`);
}

function openTaskModal(id = null, defaultQuadrant = "do") {
  form.reset();
  taskId.value = "";
  taskQuadrant.value = defaultQuadrant;
  document.querySelector("#deleteTask").classList.add("hidden");
  document.querySelector("#modalEyebrow").textContent = "New task";
  document.querySelector("#modalTitle").textContent = "Add something that matters";
  if (id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;
    taskId.value = task.id;
    taskTitle.value = task.title;
    taskQuadrant.value = task.quadrant;
    taskCategory.value = task.category;
    taskDueDate.value = task.dueDate;
    taskDueTime.value = task.dueTime;
    taskNotes.value = task.notes;
    document.querySelector("#deleteTask").classList.remove("hidden");
    document.querySelector("#modalEyebrow").textContent = "Edit task";
    document.querySelector("#modalTitle").textContent = "Shape the next action";
  }
  modal.classList.remove("hidden");
  setTimeout(() => taskTitle.focus(), 50);
}

function closeTaskModal() {
  modal.classList.add("hidden");
}

function toggleTask(id) {
  tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
  saveTasks();
  render();
  showToast("Task updated");
}

function moveTask(id, quadrant) {
  if (!id) return;
  tasks = tasks.map(task => task.id === id ? { ...task, quadrant } : task);
  saveTasks();
  render();
  showToast("Task moved");
}

function removeTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  closeTaskModal();
  render();
  showToast("Task deleted");
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const values = {
    title: taskTitle.value.trim(),
    quadrant: taskQuadrant.value,
    category: taskCategory.value.trim() || "Personal",
    dueDate: taskDueDate.value,
    dueTime: taskDueTime.value,
    notes: taskNotes.value.trim(),
  };
  if (taskId.value) {
    tasks = tasks.map(task => task.id === taskId.value ? { ...task, ...values } : task);
    showToast("Task saved");
  } else {
    tasks.push({ id: crypto.randomUUID(), completed: false, ...values });
    showToast("Task added");
  }
  saveTasks();
  closeTaskModal();
  render();
});

document.querySelector("#openAddModal").addEventListener("click", () => openTaskModal());
document.querySelector("#closeModal").addEventListener("click", closeTaskModal);
document.querySelector("#cancelModal").addEventListener("click", closeTaskModal);
document.querySelector("#deleteTask").addEventListener("click", () => removeTask(taskId.value));
modal.addEventListener("click", event => { if (event.target === modal) closeTaskModal(); });
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeTaskModal();
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.querySelector("#searchInput").focus();
  }
});

document.querySelector("#searchInput").addEventListener("input", event => {
  searchTerm = event.target.value.trim().toLowerCase();
  render();
});

document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
  activeView = button.dataset.view;
  document.querySelectorAll("[data-view]").forEach(item => item.classList.toggle("active", item === button));
  render();
  document.querySelector("#sidebar").classList.remove("open");
}));

document.querySelector("#clearCompleted").addEventListener("click", () => {
  const count = tasks.filter(task => task.completed).length;
  if (!count) return showToast("No completed tasks to clear");
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  render();
  showToast(`${count} completed task${count === 1 ? "" : "s"} cleared`);
});
document.querySelector("#reviewDay").addEventListener("click", () => {
  activeView = "completed";
  document.querySelectorAll("[data-view]").forEach(item => item.classList.toggle("active", item.dataset.view === "completed"));
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
document.querySelector("#openSidebar").addEventListener("click", () => document.querySelector("#sidebar").classList.add("open"));
document.querySelector("#closeSidebar").addEventListener("click", () => document.querySelector("#sidebar").classList.remove("open"));

const now = new Date();
document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat("en", { weekday: "long" }).format(now);
document.querySelector("#fullDate").textContent = new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(now);
render();

const STORAGE_KEY = "quadrant-tasks-v1";
const JOURNAL_DB = "quadrant-local-journal";
const JOURNAL_HANDLE_KEY = "journal-directory";

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
let journalDirectoryHandle = null;
let importCandidates = [];

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
const importModal = document.querySelector("#importModal");
const smartImportButton = document.querySelector("#smartImport");

taskQuadrant.innerHTML = quadrants.map(q => `<option value="${q.id}">${q.name} - ${q.subtitle}</option>`).join("");

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

function openJournalDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(JOURNAL_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("handles");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeJournalHandle(handle) {
  const db = await openJournalDB();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction("handles", "readwrite");
    transaction.objectStore("handles").put(handle, JOURNAL_HANDLE_KEY);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function restoreJournalHandle() {
  try {
    const db = await openJournalDB();
    journalDirectoryHandle = await new Promise((resolve, reject) => {
      const request = db.transaction("handles").objectStore("handles").get(JOURNAL_HANDLE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
  } catch {
    journalDirectoryHandle = null;
  }
}

async function selectJournalFolder() {
  if (!window.showDirectoryPicker) {
    throw new Error("Smart Import requires Edge or Chrome with folder access support.");
  }
  journalDirectoryHandle = await window.showDirectoryPicker({ id: "quadrant-journal", mode: "read", startIn: "documents" });
  await storeJournalHandle(journalDirectoryHandle);
  return journalDirectoryHandle;
}

async function getAuthorizedJournalFolder(forcePicker = false) {
  if (forcePicker || !journalDirectoryHandle) return selectJournalFolder();
  const permission = await journalDirectoryHandle.queryPermission({ mode: "read" });
  if (permission === "granted") return journalDirectoryHandle;
  const requested = await journalDirectoryHandle.requestPermission({ mode: "read" });
  if (requested !== "granted") throw new Error("Folder access was not granted.");
  return journalDirectoryHandle;
}

async function readJournalFile(directory, date) {
  try {
    const handle = await directory.getFileHandle(`${date}.md`);
    const file = await handle.getFile();
    return await file.text();
  } catch (error) {
    if (error.name === "NotFoundError") return "";
    throw error;
  }
}

function parseHeadingDate(line, fallback) {
  const match = line.match(/(?:to\s*do|todo|tasks?).*?(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/i);
  if (!match) return fallback;
  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

function cleanJournalTaskTitle(value) {
  return value
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label || target)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseJournalTodos(content, defaultDate, sourceFile) {
  let contextDate = defaultDate;
  const parsed = [];
  content.split(/\r?\n/).forEach((line, lineIndex) => {
    contextDate = parseHeadingDate(line, contextDate);
    const match = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.+)$/);
    if (!match) return;
    const indentation = match[1].replace(/\t/g, "  ").length;
    parsed.push({
      title: cleanJournalTaskTitle(match[3]),
      completed: match[2].toLowerCase() === "x",
      indentation,
      sourceDate: contextDate,
      sourceFile,
      lineIndex,
    });
  });

  return parsed.filter((item, index) => {
    if (item.completed || !item.title) return false;
    for (let next = index + 1; next < parsed.length; next += 1) {
      if (parsed[next].indentation <= item.indentation) break;
      if (!parsed[next].completed) return false;
    }
    return true;
  });
}

function includesAny(text, words) {
  return words.some(word => text.includes(word));
}

function categorizeTask(title) {
  const text = title.toLowerCase();
  if (includesAny(text, ["job", "application", "cv", "linkedin", "interview", "career", "position"])) return "Career";
  if (includesAny(text, ["study", "learn", "practice", "revision", "prd", "product", "road map", "roadmap", "stakeholder"])) return "Growth";
  if (includesAny(text, ["doctor", "health", "exercise", "sleep"])) return "Health";
  if (includesAny(text, ["email", "reply", "book", "laundry", "pay", "call", "follow up"])) return "Admin";
  return "Personal";
}

function analyzeJournalTask(item) {
  const text = item.title.toLowerCase();
  const today = todayISO();
  const important = includesAny(text, [
    "job", "application", "cv", "interview", "study", "learn", "practice", "revision",
    "prd", "product", "project", "plan", "goal", "doctor", "health", "exercise", "career", "stakeholder", "flower",
  ]);
  const urgentLanguage = includesAny(text, ["urgent", "today", "now", "deadline", "overdue", "send out", "follow up", "pay"]);
  const delegatable = includesAny(text, ["laundry", "book", "routine", "email", "reply", "schedule", "organize", "admin"]);
  const lowValue = includesAny(text, ["browse", "scroll", "someday", "maybe", "old downloads"]);
  const dueToday = item.sourceDate <= today;
  const urgent = dueToday || urgentLanguage;
  let quadrant;
  let reason;
  let score = (important ? 3 : 0) + (urgent ? 2 : 0) + (urgentLanguage ? 1 : 0);

  if (lowValue && !important) {
    quadrant = "eliminate";
    reason = "Low-impact activity; remove it to protect focus.";
  } else if (important && urgent) {
    quadrant = "do";
    reason = dueToday
      ? "Unfinished today and tied to a high-impact outcome."
      : "High-impact task with explicit urgency.";
  } else if (important) {
    quadrant = "schedule";
    reason = "Important future work; reserve focused time before it becomes urgent.";
  } else if (urgent || delegatable) {
    quadrant = "delegate";
    reason = delegatable
      ? "Necessary admin work; batch, automate, or delegate it."
      : "Time-sensitive but lower-impact; handle quickly or delegate.";
  } else {
    quadrant = "eliminate";
    reason = "No clear urgency or high-impact outcome; defer or remove it.";
  }

  return { ...item, quadrant, reason, score, category: categorizeTask(item.title) };
}

function normalizeTaskTitle(value) {
  return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ").trim();
}

function prepareImportCandidates(items, focusLimit = 5) {
  const existingTitles = new Set(tasks.map(task => normalizeTaskTitle(task.title)));
  const seen = new Set();
  const analyzed = items
    .map(analyzeJournalTask)
    .filter(item => {
      const key = normalizeTaskTitle(item.title);
      if (!key || seen.has(key) || existingTitles.has(key)) return false;
      seen.add(key);
      return true;
    });

  const doNow = analyzed.filter(item => item.quadrant === "do").sort((a, b) => b.score - a.score);
  doNow.slice(focusLimit).forEach(item => {
    item.quadrant = "schedule";
    item.reason = "Deferred to protect today's focus; important but lower priority.";
  });
  return analyzed;
}

function renderImportPreview(filesRead, completedToday, focusLimit) {
  const results = document.querySelector("#importResults");
  const summary = document.querySelector("#importSummary");
  const selectedCount = importCandidates.length;
  summary.textContent = `${filesRead} journal file${filesRead === 1 ? "" : "s"} analyzed. Based on ${completedToday} completed item${completedToday === 1 ? "" : "s"}, Do Now is limited to ${focusLimit}; ${selectedCount} new actionable item${selectedCount === 1 ? "" : "s"} found.`;
  results.innerHTML = importCandidates.length
    ? quadrants.map(quadrant => {
      const items = importCandidates.filter(item => item.quadrant === quadrant.id);
      if (!items.length) return "";
      return `
        <section class="import-group" style="--quad:${quadrant.color}">
          <h3 class="import-group-title"><span></span>${quadrant.name} · ${items.length}</h3>
          ${items.map(item => `
            <label class="import-item">
              <input type="checkbox" data-import-line="${item.lineIndex}" data-import-file="${escapeHTML(item.sourceFile)}" checked />
              <span><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.reason)}</small></span>
              <span class="import-date">${item.sourceDate === todayISO() ? "Today" : escapeHTML(item.sourceDate)}</span>
            </label>`).join("")}
        </section>`;
    }).join("")
    : `<p class="import-empty">No new actionable tasks found. Completed and already-imported items were skipped.</p>`;
  document.querySelector("#confirmImport").disabled = !importCandidates.length;
}

async function analyzeJournal(forcePicker = false) {
  smartImportButton.disabled = true;
  try {
    const directory = await getAuthorizedJournalFolder(forcePicker);
    const dates = [todayISO(), offsetISO(1)];
    const contents = await Promise.all(dates.map(date => readJournalFile(directory, date)));
    const filesRead = contents.filter(Boolean).length;
    if (!filesRead) throw new Error(`No ${dates[0]}.md or ${dates[1]}.md file was found in that folder.`);

    const parsed = contents.flatMap((content, index) => content ? parseJournalTodos(content, dates[index], `${dates[index]}.md`) : []);
    const completedToday = contents[0]
      ? (contents[0].match(/^\s*[-*+]\s+\[[xX]\]\s+/gm) || []).length
      : 0;
    const totalToday = contents[0]
      ? (contents[0].match(/^\s*[-*+]\s+\[[ xX]\]\s+/gm) || []).length
      : 0;
    const completionRatio = totalToday ? completedToday / totalToday : 0;
    const focusLimit = completionRatio >= 0.6 ? 5 : completionRatio >= 0.3 ? 4 : 3;
    importCandidates = prepareImportCandidates(parsed, focusLimit);
    renderImportPreview(filesRead, completedToday, focusLimit);
    importModal.classList.remove("hidden");
  } catch (error) {
    if (error.name !== "AbortError") showToast(error.message || "Could not read the journal folder.");
  } finally {
    smartImportButton.disabled = false;
  }
}

function closeImportModal() {
  importModal.classList.add("hidden");
}

function importSelectedTasks() {
  const selectedKeys = new Set(
    [...document.querySelectorAll("[data-import-line]:checked")]
      .map(input => `${input.dataset.importFile}:${input.dataset.importLine}`),
  );
  const selected = importCandidates.filter(item => selectedKeys.has(`${item.sourceFile}:${item.lineIndex}`));
  selected.forEach(item => tasks.push({
    id: crypto.randomUUID(),
    title: item.title.slice(0, 80),
    quadrant: item.quadrant,
    category: item.category,
    dueDate: item.sourceDate,
    dueTime: "",
    notes: `Smart Import: ${item.reason} Source: ${item.sourceFile}`,
    completed: false,
  }));
  saveTasks();
  closeImportModal();
  activeView = "today";
  document.querySelectorAll("[data-view]").forEach(item => item.classList.toggle("active", item.dataset.view === "today"));
  render();
  showToast(`${selected.length} task${selected.length === 1 ? "" : "s"} imported`);
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
          <h2>${quadrant.name}<span>${quadrant.subtitle}</span></h2>
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
  document.querySelector("#progressFraction").textContent = `${completed} / ${total}`;
  document.querySelector("#progressBar").style.width = `${percent}%`;
  document.querySelector("#remainingCount").textContent = `${total - completed} remaining`;
  document.querySelector("#footerComplete").textContent = `${completed} completed today`;
}

function openTaskModal(id = null, defaultQuadrant = "do") {
  form.reset();
  taskId.value = "";
  taskQuadrant.value = defaultQuadrant;
  document.querySelector("#deleteTask").classList.add("hidden");
  document.querySelector("#modalEyebrow").textContent = "New task";
  document.querySelector("#modalTitle").textContent = "Add task";
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
    document.querySelector("#modalTitle").textContent = "Edit task";
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
smartImportButton.addEventListener("click", () => analyzeJournal());
document.querySelector("#chooseJournalFolder").addEventListener("click", () => analyzeJournal(true));
document.querySelector("#closeImportModal").addEventListener("click", closeImportModal);
document.querySelector("#cancelImport").addEventListener("click", closeImportModal);
document.querySelector("#confirmImport").addEventListener("click", importSelectedTasks);
modal.addEventListener("click", event => { if (event.target === modal) closeTaskModal(); });
importModal.addEventListener("click", event => { if (event.target === importModal) closeImportModal(); });
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeTaskModal();
    closeImportModal();
  }
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
}));

document.querySelector("#clearCompleted").addEventListener("click", () => {
  const count = tasks.filter(task => task.completed).length;
  if (!count) return showToast("No completed tasks to clear");
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  render();
  showToast(`${count} completed task${count === 1 ? "" : "s"} cleared`);
});
const now = new Date();
document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat("en", { weekday: "long" }).format(now);
document.querySelector("#fullDate").textContent = new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(now);
restoreJournalHandle();
render();

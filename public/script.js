// TaskFlow UI — uses the existing Express + MySQL API.
const API_BASE = 'http://localhost:3000';

const form = document.getElementById('add-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const message = document.getElementById('message');
const loading = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const emptyTitle = document.getElementById('empty-title');
const emptyDescription = document.getElementById('empty-description');
const totalCount = document.getElementById('total-count');
const remainingCount = document.getElementById('remaining-count');
const completedCount = document.getElementById('completed-count');
const headingCount = document.getElementById('heading-count');
const sidebarTotal = document.getElementById('sidebar-total');
const sidebarActive = document.getElementById('sidebar-active');
const progressPercent = document.getElementById('progress-percent');
const progressFill = document.getElementById('progress-fill');
const progressTrack = document.getElementById('progress-track');
const progressCaption = document.getElementById('progress-caption');
const searchInput = document.getElementById('search-input');

let tasksCache = [];
let currentFilter = 'all';
let searchTerm = '';
let loadingCount = 0;

function showMessage(text, type = '') {
  message.textContent = text;
  message.className = 'message' + (type ? ` ${type}` : '');
}
function clearMessage() {
  message.textContent = '';
  message.className = 'message';
}
function setLoading(isLoading) {
  loadingCount = Math.max(0, loadingCount + (isLoading ? 1 : -1));
  loading.hidden = loadingCount === 0;
}
function setBusy(button, busy, busyText = 'Saving…') {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `<span class="button-spinner"></span> ${busyText}`;
    button.disabled = true;
  } else {
    button.innerHTML = button.dataset.originalText || button.innerHTML;
    button.disabled = false;
  }
}
async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Cannot connect to the API. Make sure your server is running at localhost:3000.');
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.error) msg = data.error;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}
function getVisibleTasks() {
  return tasksCache.filter(task => {
    const isCompleted = !!task.completed;
    const matchesFilter = currentFilter === 'all' ||
      (currentFilter === 'active' && !isCompleted) ||
      (currentFilter === 'completed' && isCompleted);
    const matchesSearch = String(task.title || '').toLowerCase().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });
}
function updateStats(tasks) {
  const total = tasks.length;
  const done = tasks.filter(t => !!t.completed).length;
  const remaining = total - done;
  const percent = total ? Math.round((done / total) * 100) : 0;

  totalCount.textContent = total;
  remainingCount.textContent = remaining;
  completedCount.textContent = done;
  headingCount.textContent = total;
  sidebarTotal.textContent = total;
  sidebarActive.textContent = remaining;
  progressPercent.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
  progressTrack.setAttribute('aria-valuenow', String(percent));
  progressCaption.textContent = total === 0
    ? 'Every journey starts with one task.'
    : percent === 100
      ? 'Amazing work — everything is complete!'
      : `${done} of ${total} tasks completed. Keep it going!`;
  document.getElementById('footer-summary').textContent = total === 0
    ? 'A fresh start awaits.'
    : remaining === 0 ? 'All done. Great work!' : `${remaining} task${remaining === 1 ? '' : 's'} left to go.`;
}
function updateActiveControls() {
  document.querySelectorAll('[data-filter]').forEach(button => {
    const active = button.dataset.filter === currentFilter;
    button.classList.toggle('active', active);
    if (button.classList.contains('nav-item')) {
      button.setAttribute('aria-current', active ? 'page' : 'false');
    }
  });
}
function createButton(label, className, onClick, ariaLabel) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
  button.addEventListener('click', onClick);
  return button;
}
function renderTasks() {
  const visibleTasks = getVisibleTasks();
  list.innerHTML = '';
  updateStats(tasksCache);
  updateActiveControls();

  if (visibleTasks.length === 0) {
    emptyState.hidden = false;
    if (tasksCache.length === 0) {
      emptyTitle.textContent = 'Nothing on your list yet';
      emptyDescription.textContent = 'Add your first task above and start building momentum.';
    } else if (searchTerm) {
      emptyTitle.textContent = 'No matching tasks';
      emptyDescription.textContent = 'Try a different search phrase.';
    } else if (currentFilter === 'active') {
      emptyTitle.textContent = 'All caught up!';
      emptyDescription.textContent = 'You have no tasks in progress right now.';
    } else {
      emptyTitle.textContent = 'No completed tasks yet';
      emptyDescription.textContent = 'Complete a task and it will appear here.';
    }
    return;
  }
  emptyState.hidden = true;

  visibleTasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.style.animationDelay = `${Math.min(index * 35, 210)}ms`;
    li.dataset.id = task.id;

    const checkboxWrap = document.createElement('label');
    checkboxWrap.className = 'task-check-wrap';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.title}" as ${task.completed ? 'in progress' : 'completed'}`);
    checkbox.addEventListener('change', () => toggleTask(task, checkbox));
    const customCheck = document.createElement('span');
    customCheck.className = 'custom-check';
    checkboxWrap.append(checkbox, customCheck);

    const content = document.createElement('div');
    content.className = 'task-content';
    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;
    const meta = document.createElement('span');
    meta.className = 'task-meta';
    meta.innerHTML = task.completed
      ? '<span class="task-status status-done"></span> Completed'
      : '<span class="task-status status-active"></span> In progress';
    content.append(title, meta);

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    const editBtn = createButton('Edit', 'task-action edit-action', () => editTask(task), `Edit ${task.title}`);
    const deleteBtn = createButton('Delete', 'task-action delete-action', () => deleteTask(task), `Delete ${task.title}`);
    actions.append(editBtn, deleteBtn);

    li.append(checkboxWrap, content, actions);
    list.appendChild(li);
  });
}
async function loadTasks({ quiet = false } = {}) {
  if (!quiet) setLoading(true);
  try {
    const tasks = await request('/tasks');
    if (!Array.isArray(tasks)) throw new Error('The API response was not a task list. Check your GET /tasks endpoint.');
    tasksCache = tasks;
    renderTasks();
    if (!quiet) clearMessage();
  } catch (err) {
    showMessage(err.message, 'error');
    if (!tasksCache.length) renderTasks();
  } finally {
    if (!quiet) setLoading(false);
  }
}
async function addTask(title) {
  const button = form.querySelector('button[type="submit"]');
  setBusy(button, true, 'Adding…');
  try {
    await request('/tasks', { method: 'POST', body: JSON.stringify({ title }) });
    input.value = '';
    currentFilter = 'all';
    searchTerm = '';
    searchInput.value = '';
    showMessage('Task added successfully!', 'success');
    await loadTasks({ quiet: true });
    input.focus();
  } catch (err) {
    showMessage(err.message, 'error');
  } finally {
    setBusy(button, false);
  }
}
async function toggleTask(task, checkbox) {
  checkbox.disabled = true;
  try {
    await request(`/tasks/${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: checkbox.checked }),
    });
    showMessage(checkbox.checked ? 'Nice work — task completed!' : 'Task moved back to in progress.', 'success');
    await loadTasks({ quiet: true });
  } catch (err) {
    checkbox.checked = !checkbox.checked;
    showMessage(err.message, 'error');
  } finally {
    checkbox.disabled = false;
  }
}
async function editTask(task) {
  const newTitle = prompt('Edit task title:', task.title);
  if (newTitle === null) return;
  const trimmed = newTitle.trim();
  if (!trimmed) {
    showMessage('Task title cannot be empty.', 'error');
    return;
  }
  if (trimmed.length > 255) {
    showMessage('Task title must be 255 characters or fewer.', 'error');
    return;
  }
  try {
    await request(`/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: trimmed, completed: !!task.completed }),
    });
    showMessage('Task updated successfully!', 'success');
    await loadTasks({ quiet: true });
  } catch (err) {
    showMessage(err.message, 'error');
  }
}
async function deleteTask(task) {
  if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
  try {
    await request(`/tasks/${task.id}`, { method: 'DELETE' });
    showMessage('Task deleted.', 'success');
    await loadTasks({ quiet: true });
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) {
    showMessage('Please enter a task title first.', 'error');
    input.focus();
    return;
  }
  addTask(title);
});
document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    renderTasks();
  });
});
searchInput.addEventListener('input', () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  renderTasks();
});
document.getElementById('refresh-button').addEventListener('click', async () => {
  const button = document.getElementById('refresh-button');
  button.classList.add('is-refreshing');
  await loadTasks();
  button.classList.remove('is-refreshing');
});
document.getElementById('empty-add-button').addEventListener('click', () => input.focus());

const themeToggle = document.getElementById('theme-toggle');
if (localStorage.getItem('taskflow-theme') === 'dark') document.body.classList.add('dark-theme');
function updateThemeButton() {
  const dark = document.body.classList.contains('dark-theme');
  themeToggle.textContent = dark ? '☀' : '☾';
  themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  localStorage.setItem('taskflow-theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
  updateThemeButton();
});
updateThemeButton();

const now = new Date();
document.getElementById('today-date').textContent = new Intl.DateTimeFormat(undefined, {
  weekday: 'short', month: 'short', day: 'numeric'
}).format(now);
loadTasks();

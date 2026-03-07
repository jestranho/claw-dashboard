const API_BASE = '/api';

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-700' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-700' },
  { id: 'testing', title: 'Testing', color: 'bg-yellow-700' },
  { id: 'done', title: 'Done', color: 'bg-green-700' }
];

let currentTasks = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadTasks();
  renderColumns();
  await renderTasks();
});

async function loadTasks() {
  try {
    const response = await fetch(API_BASE + '/tasks');
    currentTasks = await response.json();
    return currentTasks;
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
}

function getPriorityColor(priority) {
  switch (priority?.toLowerCase()) {
    case 'high': return 'border-red-500';
    case 'low': return 'border-green-500';
    default: return 'border-yellow-500';
  }
}

function getBadgeColor(priority) {
  switch (priority?.toLowerCase()) {
    case 'high': return 'bg-red-600';
    case 'low': return 'bg-green-600';
    default: return 'bg-yellow-600';
  }
}

function renderColumns() {
  const board = document.getElementById('kanbanBoard');
  board.innerHTML = columns.map(col => 
    '<div class="column ' + col.color + ' rounded-lg p-4 flex-shrink-0 w-80" data-column="' + col.id + '" ondrop="drop(event)" ondragover="allowDrop(event)" ondragleave="dragLeave(event)">' +
      '<h2 class="text-xl font-bold mb-4 text-white border-b border-gray-500 pb-2 flex justify-between items-center">' + 
        '<span>' + col.title + '</span>' +
        '<span class="bg-gray-600 px-2 py-1 rounded text-xs" id="count-' + col.id + '">0</span>' +
      '</h2>' +
      '<div class="task-list space-y-3 min-h-[200px]"></div>' +
    '</div>'
  ).join('');
}

async function renderTasks() {
  columns.forEach(col => {
    const columnDiv = document.querySelector('.column[data-column="' + col.id + '"]');
    const taskList = columnDiv ? columnDiv.querySelector('.task-list') : null;
    if (taskList) {
      const columnTasks = currentTasks.filter(t => t.column === col.id);
      document.getElementById('count-' + col.id).textContent = columnTasks.length;
      
      taskList.innerHTML = columnTasks.map(task => 
        '<div class="task-card bg-gray-800 rounded p-4 cursor-move border-l-4 ' + getPriorityColor(task.priority) + '" draggable="true" ondragstart="drag(event)" ondragend="dragEnd(event)" data-id="' + task.id + '">' +
          '<div class="flex justify-between items-start mb-2">' +
            '<h3 class="font-semibold text-white flex-1 mr-2">' + escapeHtml(task.title) + '</h3>' +
            '<button onclick="editTask(' + task.id + ')" class="text-indigo-400 hover:text-indigo-300 text-sm mr-2">✎</button>' +
          '</div>' +
          (task.description ? '<p class="text-gray-400 text-sm mb-2 italic">' + escapeHtml(task.description) + '</p>' : '') +
          '<div class="flex justify-between items-center mt-2">' +
            '<span class="text-xs px-2 py-1 rounded ' + getBadgeColor(task.priority) + ' text-white">' + (task.priority || 'medium') + '</span>' +
            '<button onclick="deleteTask(' + task.id + ')" class="text-red-400 hover:text-red-300">&times;</button>' +
          '</div>' +
        '</div>'
      ).join('');
    }
  });
}

function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Add New Task';
  document.getElementById('taskId').value = '';
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskDescription').value = '';
  document.getElementById('taskColumn').value = 'backlog';
  document.getElementById('taskPriority').value = 'medium';
  document.getElementById('taskModal').classList.remove('hidden');
  document.getElementById('taskTitle').focus();
}

function openEditModal(task) {
  document.getElementById('modalTitle').textContent = 'Edit Task';
  document.getElementById('taskId').value = task.id;
  document.getElementById('taskTitle').value = task.title || '';
  document.getElementById('taskDescription').value = task.description || '';
  document.getElementById('taskColumn').value = task.column || 'backlog';
  document.getElementById('taskPriority').value = task.priority || 'medium';
  document.getElementById('taskModal').classList.remove('hidden');
  document.getElementById('taskTitle').focus();
}

function closeModal() {
  document.getElementById('taskModal').classList.add('hidden');
}

async function saveTask() {
  const id = document.getElementById('taskId').value;
  const title = document.getElementById('taskTitle').value.trim();
  const description = document.getElementById('taskDescription').value;
  const column = document.getElementById('taskColumn').value;
  const priority = document.getElementById('taskPriority').value;
  
  if (!title) {
    alert('Title is required');
    return;
  }
  
  try {
    if (id) {
      // Update existing task
      await fetch(API_BASE + '/tasks/' + id, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ title, description, column, priority }) 
      });
    } else {
      // Add new task
      await fetch(API_BASE + '/tasks', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ title, description, column, priority }) 
      });
    }
    
    // Reload tasks from server to get fresh data
    await loadTasks();
    closeModal();
    renderTasks();
  } catch (error) {
    console.error('Error saving task:', error);
    alert('Failed to save task');
  }
}

async function editTask(id) {
  const task = currentTasks.find(t => t.id === id);
  if (task) openEditModal(task);
}

async function updateTask(id, updates) {
  try {
    await fetch(API_BASE + '/tasks/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    // Reload tasks from server to get fresh data
    await loadTasks();
    renderTasks();
  } catch (error) {
    console.error('Error updating task:', error);
  }
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    await fetch(API_BASE + '/tasks/' + id, { method: 'DELETE' });
    // Reload tasks from server to get fresh data
    await loadTasks();
    renderTasks();
  } catch (error) {
    console.error('Error deleting task:', error);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Drag and drop functions
function allowDrop(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}

function dragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

function drag(event) {
  event.dataTransfer.setData('text/plain', event.target.dataset.id);
  event.target.classList.add('opacity-50');
}

function dragEnd(event) {
  event.target.classList.remove('opacity-50');
}

function drop(event) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  
  const taskId = event.dataTransfer.getData('text/plain');
  const newColumn = event.currentTarget.dataset.column;
  
  if (taskId && newColumn) {
    updateTask(taskId, { column: newColumn });
  }
}

// Close modal when clicking outside
document.getElementById('taskModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// Add event listeners after DOM is ready
document.addEventListener('dragend', function(e) {
  if (e.target.classList.contains('task-card')) {
    e.target.classList.remove('opacity-50');
  }
});
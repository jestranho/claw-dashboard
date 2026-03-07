const API_BASE = '/api';

let sessionData = [];
let modelData = {};
let lastUpdate = new Date();

// Update timestamp
function updateTimestamp() {
  const now = new Date();
  document.getElementById('last-update').textContent = now.toLocaleTimeString();
}

// Load session data from OpenClaw API
async function loadSessionData() {
  try {
    // Get active sessions
    const response = await fetch(API_BASE + '/sessions');
    if (response.ok) {
      sessionData = await response.json();
      updateDashboard();
    }
    
    // Get usage data for model breakdown
    const usageResponse = await fetch(API_BASE + '/usage');
    if (usageResponse.ok) {
      modelData = await usageResponse.json();
      updateModelBreakdown();
    }
  } catch (error) {
    console.error('Error loading session data:', error);
  }
}

// Update dashboard with session data
function updateDashboard() {
  const activeSessions = sessionData.length;
  let totalTokens = 0;
  let totalCost = 0;

  document.getElementById('active-sessions').textContent = activeSessions;

  const sessionList = document.getElementById('session-list');
  sessionList.innerHTML = sessionData.map(session => {
    // Calculate tokens and cost from session data
    const tokens = session.tokens || 0;
    const cost = session.cost || 0;
    const contextPct = session.context_percent || 0;

    totalTokens += tokens;
    totalCost += cost;

    return `
      <tr class="session-row border-b border-gray-700 hover:bg-gray-700 transition-colors">
        <td class="p-2 font-mono text-sm">${escapeHtml(session.id)}</td>
        <td class="p-2">${escapeHtml(session.model || 'N/A')}</td>
        <td class="p-2">
          <span class="px-2 py-1 rounded text-xs ${
            session.type === 'dm' ? 'bg-blue-600' :
            session.type === 'group' ? 'bg-purple-600' : 'bg-gray-600'
          }">${escapeHtml(session.type || 'unknown')}</span>
        </td>
        <td class="text-right p-2">
          <div class="w-24 mx-auto bg-gray-700 rounded-full h-2">
            <div class="bg-indigo-500 h-2 rounded-full" style="width: ${contextPct}%"></div>
          </div>
        </td>
        <td class="text-right p-2 font-mono">${tokens.toLocaleString()}</td>
        <td class="text-right p-2 font-mono">$${cost.toFixed(4)}</td>
      </tr>
    `;
  }).join('');

  document.getElementById('total-tokens').textContent = totalTokens.toLocaleString();
  document.getElementById('total-cost').textContent = '$' + totalCost.toFixed(2);
}

// Update model breakdown section
function updateModelBreakdown() {
  const container = document.getElementById('model-breakdown');
  
  if (!modelData || !modelData.models) {
    container.innerHTML = '<p class="text-gray-500">No usage data available</p>';
    return;
  }

  container.innerHTML = Object.entries(modelData.models).map(([modelName, data]) => {
    const inputTokens = data.input_tokens || 0;
    const outputTokens = data.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;
    const cost = data.cost || 0;

    return `
      <div class="bg-gray-700 rounded-lg p-4">
        <h4 class="font-semibold text-indigo-400 mb-2">${escapeHtml(modelName)}</h4>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="text-gray-400">Input:</span>
            <span class="ml-1 font-mono">${inputTokens.toLocaleString()}</span>
          </div>
          <div>
            <span class="text-gray-400">Output:</span>
            <span class="ml-1 font-mono">${outputTokens.toLocaleString()}</span>
          </div>
          <div class="col-span-2 border-t border-gray-600 pt-2 mt-1">
            <span class="text-gray-400">Total Cost:</span>
            <span class="ml-1 font-mono text-green-400">$${cost.toFixed(4)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  updateTimestamp();
  loadSessionData();
  
  // Auto-refresh every 30 seconds
  setInterval(() => {
    updateTimestamp();
    loadSessionData();
  }, 30000);

  // Tab switching
  document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all tabs and contents
      document.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('bg-indigo-600', 'text-white'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      
      // Add active class to clicked tab and content
      tab.classList.add('bg-indigo-600', 'text-white');
      const target = tab.dataset.tab;
      document.getElementById(target).classList.remove('hidden');
    });
  });
});
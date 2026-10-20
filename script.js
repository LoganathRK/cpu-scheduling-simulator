/* =============================================
   CPU SCHEDULING SIMULATOR — CORE LOGIC
   ============================================= */

// ============ TOAST UTILITY ============
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = ''; }, 2800);
}

// ============ NAVBAR HAMBURGER ============
document.addEventListener('DOMContentLoaded', () => {
  const ham = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (ham && navLinks) {
    ham.addEventListener('click', () => navLinks.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!ham.contains(e.target) && !navLinks.contains(e.target))
        navLinks.classList.remove('open');
    });
  }

  // Active link highlight
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === currentPage) a.classList.add('active');
  });

  // Reveal animation
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Init page-specific logic
  const page = document.body.dataset.page;
  if (page === 'fcfs') initFCFS();
  if (page === 'sjf') initSJF();
  if (page === 'priority') initPriority();
  if (page === 'rr') initRR();
});

// ============ GANTT COLORS ============
const GANTT_COLORS = [
  '#00d4ff','#7b61ff','#00ff9d','#ffaa00',
  '#ff4d6a','#ff7eb3','#4dffa8','#ffd24d',
  '#a78bfa','#34d399','#fb923c','#60a5fa'
];

function getColor(idx) { return GANTT_COLORS[idx % GANTT_COLORS.length]; }

// ============ GANTT RENDER ============
function renderGantt(ganttData, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!ganttData.length) { container.innerHTML = '<div class="empty-state"><p>Run simulation to see Gantt chart</p></div>'; return; }

  const totalTime = ganttData[ganttData.length - 1].end;
  container.innerHTML = '';

  // Chart row
  const chartDiv = document.createElement('div');
  chartDiv.className = 'gantt-chart gantt-colors';
  chartDiv.style.cssText = 'margin-bottom:8px;';

  // Collect unique PIDs for stable color assignment
  const pidColorMap = {};
  let pidIdx = 0;

  ganttData.forEach(seg => {
    if (!(seg.pid in pidColorMap)) pidColorMap[seg.pid] = pidIdx++;
    const block = document.createElement('div');
    block.className = 'gantt-block';
    const width = Math.max(((seg.end - seg.start) / totalTime) * 100, 2);
    block.style.cssText = `flex: 0 0 ${width}%; background: ${getColor(pidColorMap[seg.pid])}; min-width:${Math.max(width,3)}%;`;
    block.innerHTML = `<span class="pid">${seg.pid}</span><span class="duration">${seg.end - seg.start}</span>`;
    block.title = `${seg.pid}: ${seg.start} → ${seg.end}`;
    chartDiv.appendChild(block);
  });

  // Timeline
  const timeDiv = document.createElement('div');
  timeDiv.className = 'gantt-timeline';
  timeDiv.style.position = 'relative';
  timeDiv.style.height = '20px';

  const ticks = new Set();
  ganttData.forEach(s => { ticks.add(s.start); ticks.add(s.end); });
  [...ticks].sort((a,b) => a-b).forEach(t => {
    const tick = document.createElement('span');
    tick.className = 'gantt-tick';
    tick.textContent = t;
    tick.style.left = ((t / totalTime) * 100) + '%';
    timeDiv.appendChild(tick);
  });

  const scroll = document.createElement('div');
  scroll.className = 'gantt-scroll';
  scroll.appendChild(chartDiv);
  scroll.appendChild(timeDiv);
  container.appendChild(scroll);
}

// ============ PROCESS TABLE HELPERS ============
function renderProcessTable(processes, tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  table.innerHTML = '';
  processes.forEach((p, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${p.pid}</td>
      <td>${p.arrival}</td>
      <td>${p.burst}</td>
      ${p.priority !== undefined ? `<td>${p.priority}</td>` : ''}
      <td><button class="del-btn" onclick="deleteProcessRow('${tableId}', ${i}, '${p._listId}')">✕</button></td>
    `;
    table.appendChild(row);
  });
}

// ============ RESULTS TABLE RENDER ============
function renderResults(results, tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  table.innerHTML = '';
  results.forEach(r => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><span class="badge badge-cyan">${r.pid}</span></td>
      <td>${r.arrival}</td>
      <td>${r.burst}</td>
      ${r.priority !== undefined ? `<td>${r.priority}</td>` : ''}
      <td>${r.completion}</td>
      <td><span class="badge badge-purple">${r.turnaround}</span></td>
      <td><span class="badge badge-green">${r.waiting}</span></td>
    `;
    table.appendChild(row);
  });
}

function updateMetrics(results, prefix='') {
  const avgWT = results.reduce((s,r) => s + r.waiting, 0) / results.length;
  const avgTAT = results.reduce((s,r) => s + r.turnaround, 0) / results.length;
  const el = id => document.getElementById(prefix + id);
  if (el('avgWT')) el('avgWT').textContent = avgWT.toFixed(2);
  if (el('avgTAT')) el('avgTAT').textContent = avgTAT.toFixed(2);
  if (el('totalProc')) el('totalProc').textContent = results.length;
  if (el('totalTime')) el('totalTime').textContent = Math.max(...results.map(r=>r.completion));
}

// ============================================================
//   FCFS ALGORITHM
// ============================================================
let fcfsProcesses = [];

function initFCFS() {
  document.getElementById('fcfsAddBtn').addEventListener('click', addFCFSProcess);
  document.getElementById('fcfsRunBtn').addEventListener('click', runFCFS);
  document.getElementById('fcfsResetBtn').addEventListener('click', resetFCFS);
  addFCFSProcess(null, {pid:'P1', arrival:0, burst:6});
  addFCFSProcess(null, {pid:'P2', arrival:2, burst:4});
  addFCFSProcess(null, {pid:'P3', arrival:4, burst:2});
}

function addFCFSProcess(e, preset=null) {
  const pid = preset ? preset.pid : document.getElementById('fcfsPid').value.trim() || `P${fcfsProcesses.length+1}`;
  const arrival = parseInt(preset ? preset.arrival : document.getElementById('fcfsArrival').value) || 0;
  const burst = parseInt(preset ? preset.burst : document.getElementById('fcfsBurst').value);
  if (!preset && isNaN(burst)) { showToast('Enter a valid Burst Time', 'error'); return; }
  const p = { pid, arrival, burst, _listId: Date.now() + Math.random() };
  fcfsProcesses.push(p);
  renderProcessTable(fcfsProcesses, 'fcfsInputTable');
  if (!preset) {
    document.getElementById('fcfsPid').value = '';
    document.getElementById('fcfsArrival').value = '';
    document.getElementById('fcfsBurst').value = '';
    showToast(`${pid} added`, 'success');
  }
}

window.deleteProcessRow = function(tableId, idx, listId) {
  if (tableId === 'fcfsInputTable') fcfsProcesses = fcfsProcesses.filter((p,i) => i !== idx);
  else if (tableId === 'sjfInputTable') sjfProcesses = sjfProcesses.filter((p,i) => i !== idx);
  else if (tableId === 'priInputTable') priProcesses = priProcesses.filter((p,i) => i !== idx);
  else if (tableId === 'rrInputTable') rrProcesses = rrProcesses.filter((p,i) => i !== idx);
  const map = {
    fcfsInputTable: () => renderProcessTable(fcfsProcesses, 'fcfsInputTable'),
    sjfInputTable: () => renderProcessTable(sjfProcesses, 'sjfInputTable'),
    priInputTable: () => renderProcessTable(priProcesses, 'priInputTable'),
    rrInputTable: () => renderProcessTable(rrProcesses, 'rrInputTable'),
  };
  map[tableId] && map[tableId]();
};

function runFCFS() {
  if (!fcfsProcesses.length) { showToast('Add at least one process', 'error'); return; }
  const procs = [...fcfsProcesses].sort((a,b) => a.arrival - b.arrival);
  let time = 0;
  const gantt = [];
  const results = procs.map(p => {
    if (time < p.arrival) time = p.arrival;
    const start = time;
    time += p.burst;
    gantt.push({ pid: p.pid, start, end: time });
    const completion = time;
    const turnaround = completion - p.arrival;
    const waiting = turnaround - p.burst;
    return { ...p, completion, turnaround, waiting };
  });
  renderResults(results, 'fcfsResultTable');
  updateMetrics(results, 'fcfs');
  renderGantt(gantt, 'fcfsGantt');
  document.getElementById('fcfsResults').style.display = '';
  showToast('FCFS Simulation complete!', 'success');
}

function resetFCFS() {
  fcfsProcesses = [];
  renderProcessTable([], 'fcfsInputTable');
  document.getElementById('fcfsResults').style.display = 'none';
  renderGantt([], 'fcfsGantt');
  showToast('Reset complete');
}

// ============================================================
//   SJF ALGORITHM (Non-Preemptive)
// ============================================================
let sjfProcesses = [];

function initSJF() {
  document.getElementById('sjfAddBtn').addEventListener('click', addSJFProcess);
  document.getElementById('sjfRunBtn').addEventListener('click', runSJF);
  document.getElementById('sjfResetBtn').addEventListener('click', resetSJF);
  addSJFProcess(null, {pid:'P1', arrival:0, burst:7});
  addSJFProcess(null, {pid:'P2', arrival:2, burst:3});
  addSJFProcess(null, {pid:'P3', arrival:4, burst:1});
  addSJFProcess(null, {pid:'P4', arrival:5, burst:5});
}

function addSJFProcess(e, preset=null) {
  const pid = preset ? preset.pid : document.getElementById('sjfPid').value.trim() || `P${sjfProcesses.length+1}`;
  const arrival = parseInt(preset ? preset.arrival : document.getElementById('sjfArrival').value) || 0;
  const burst = parseInt(preset ? preset.burst : document.getElementById('sjfBurst').value);
  if (!preset && isNaN(burst)) { showToast('Enter a valid Burst Time', 'error'); return; }
  sjfProcesses.push({ pid, arrival, burst, _listId: Date.now()+Math.random() });
  renderProcessTable(sjfProcesses, 'sjfInputTable');
  if (!preset) {
    document.getElementById('sjfPid').value = '';
    document.getElementById('sjfArrival').value = '';
    document.getElementById('sjfBurst').value = '';
    showToast(`${pid} added`, 'success');
  }
}

function runSJF() {
  if (!sjfProcesses.length) { showToast('Add at least one process', 'error'); return; }
  const procs = sjfProcesses.map(p => ({ ...p, done: false }));
  let time = 0, completed = 0;
  const gantt = [], results = [];

  while (completed < procs.length) {
    const ready = procs.filter(p => !p.done && p.arrival <= time);
    if (!ready.length) { time++; continue; }
    ready.sort((a,b) => a.burst - b.burst || a.arrival - b.arrival);
    const p = ready[0];
    gantt.push({ pid: p.pid, start: time, end: time + p.burst });
    time += p.burst;
    p.done = true;
    const completion = time;
    const turnaround = completion - p.arrival;
    const waiting = turnaround - p.burst;
    results.push({ ...p, completion, turnaround, waiting });
    completed++;
  }
  renderResults(results, 'sjfResultTable');
  updateMetrics(results, 'sjf');
  renderGantt(gantt, 'sjfGantt');
  document.getElementById('sjfResults').style.display = '';
  showToast('SJF Simulation complete!', 'success');
}

function resetSJF() {
  sjfProcesses = [];
  renderProcessTable([], 'sjfInputTable');
  document.getElementById('sjfResults').style.display = 'none';
  showToast('Reset complete');
}

// ============================================================
//   PRIORITY SCHEDULING (Non-Preemptive, lower = higher pri)
// ============================================================
let priProcesses = [];

function initPriority() {
  document.getElementById('priAddBtn').addEventListener('click', addPriProcess);
  document.getElementById('priRunBtn').addEventListener('click', runPriority);
  document.getElementById('priResetBtn').addEventListener('click', resetPriority);
  addPriProcess(null, {pid:'P1', arrival:0, burst:4, priority:2});
  addPriProcess(null, {pid:'P2', arrival:1, burst:3, priority:1});
  addPriProcess(null, {pid:'P3', arrival:2, burst:5, priority:3});
  addPriProcess(null, {pid:'P4', arrival:3, burst:2, priority:1});
}

function addPriProcess(e, preset=null) {
  const pid = preset ? preset.pid : document.getElementById('priPid').value.trim() || `P${priProcesses.length+1}`;
  const arrival = parseInt(preset ? preset.arrival : document.getElementById('priArrival').value) || 0;
  const burst = parseInt(preset ? preset.burst : document.getElementById('priBurst').value);
  const priority = parseInt(preset ? preset.priority : document.getElementById('priPriority').value) || 1;
  if (!preset && isNaN(burst)) { showToast('Enter a valid Burst Time', 'error'); return; }
  priProcesses.push({ pid, arrival, burst, priority, _listId: Date.now()+Math.random() });
  renderProcessTable(priProcesses, 'priInputTable');
  if (!preset) {
    ['priPid','priArrival','priBurst','priPriority'].forEach(id => document.getElementById(id).value = '');
    showToast(`${pid} added`, 'success');
  }
}

function runPriority() {
  if (!priProcesses.length) { showToast('Add at least one process', 'error'); return; }
  const procs = priProcesses.map(p => ({ ...p, done: false }));
  let time = 0, completed = 0;
  const gantt = [], results = [];

  while (completed < procs.length) {
    const ready = procs.filter(p => !p.done && p.arrival <= time);
    if (!ready.length) { time++; continue; }
    ready.sort((a,b) => a.priority - b.priority || a.arrival - b.arrival);
    const p = ready[0];
    gantt.push({ pid: p.pid, start: time, end: time + p.burst });
    time += p.burst;
    p.done = true;
    const completion = time;
    const turnaround = completion - p.arrival;
    const waiting = turnaround - p.burst;
    results.push({ ...p, completion, turnaround, waiting });
    completed++;
  }
  renderResults(results, 'priResultTable');
  updateMetrics(results, 'pri');
  renderGantt(gantt, 'priGantt');
  document.getElementById('priResults').style.display = '';
  showToast('Priority Simulation complete!', 'success');
}

function resetPriority() {
  priProcesses = [];
  renderProcessTable([], 'priInputTable');
  document.getElementById('priResults').style.display = 'none';
  showToast('Reset complete');
}

// ============================================================
//   ROUND ROBIN ALGORITHM
// ============================================================
let rrProcesses = [];

function initRR() {
  document.getElementById('rrAddBtn').addEventListener('click', addRRProcess);
  document.getElementById('rrRunBtn').addEventListener('click', runRR);
  document.getElementById('rrResetBtn').addEventListener('click', resetRR);
  addRRProcess(null, {pid:'P1', arrival:0, burst:5});
  addRRProcess(null, {pid:'P2', arrival:1, burst:3});
  addRRProcess(null, {pid:'P3', arrival:2, burst:6});
  addRRProcess(null, {pid:'P4', arrival:4, burst:2});
}

function addRRProcess(e, preset=null) {
  const pid = preset ? preset.pid : document.getElementById('rrPid').value.trim() || `P${rrProcesses.length+1}`;
  const arrival = parseInt(preset ? preset.arrival : document.getElementById('rrArrival').value) || 0;
  const burst = parseInt(preset ? preset.burst : document.getElementById('rrBurst').value);
  if (!preset && isNaN(burst)) { showToast('Enter a valid Burst Time', 'error'); return; }
  rrProcesses.push({ pid, arrival, burst, _listId: Date.now()+Math.random() });
  renderProcessTable(rrProcesses, 'rrInputTable');
  if (!preset) {
    ['rrPid','rrArrival','rrBurst'].forEach(id => document.getElementById(id).value = '');
    showToast(`${pid} added`, 'success');
  }
}

function runRR() {
  if (!rrProcesses.length) { showToast('Add at least one process', 'error'); return; }
  const quantum = parseInt(document.getElementById('rrQuantum').value) || 2;
  const procs = rrProcesses.map(p => ({ ...p, remaining: p.burst, completion: 0 }));
  let time = 0;
  const gantt = [];
  const queue = [];
  let sortedProcs = [...procs].sort((a,b) => a.arrival - b.arrival);
  let procIdx = 0;

  // Add processes that arrive at time 0
  while (procIdx < sortedProcs.length && sortedProcs[procIdx].arrival <= time) {
    queue.push(sortedProcs[procIdx++]);
  }

  while (queue.length > 0) {
    const p = queue.shift();
    const execTime = Math.min(p.remaining, quantum);
    gantt.push({ pid: p.pid, start: time, end: time + execTime });
    time += execTime;
    p.remaining -= execTime;

    // Add newly arrived processes
    while (procIdx < sortedProcs.length && sortedProcs[procIdx].arrival <= time) {
      queue.push(sortedProcs[procIdx++]);
    }

    if (p.remaining > 0) {
      queue.push(p);
    } else {
      p.completion = time;
    }

    // If queue is empty but processes still pending
    if (queue.length === 0 && procIdx < sortedProcs.length) {
      time = sortedProcs[procIdx].arrival;
      while (procIdx < sortedProcs.length && sortedProcs[procIdx].arrival <= time) {
        queue.push(sortedProcs[procIdx++]);
      }
    }
  }

  const results = procs.map(p => ({
    ...p,
    turnaround: p.completion - p.arrival,
    waiting: p.completion - p.arrival - p.burst
  }));

  renderResults(results, 'rrResultTable');
  updateMetrics(results, 'rr');
  renderGantt(gantt, 'rrGantt');
  document.getElementById('rrResults').style.display = '';
  showToast(`Round Robin (Q=${quantum}) complete!`, 'success');
}

function resetRR() {
  rrProcesses = [];
  renderProcessTable([], 'rrInputTable');
  document.getElementById('rrResults').style.display = 'none';
  showToast('Reset complete');
}

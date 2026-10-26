/**
 * Concurrency & Live WebSocket Stream Simulation Engine
 * Simulates high-throughput concurrent score mutations with atomic event queuing,
 * rate limiting, and real-time rank delta tracking.
 */

class MatchSimulationEngine {
  constructor(appContext) {
    this.app = appContext;
    this.isRunning = false;
    this.timer = null;
    this.updatesPerSecond = 5;
    this.totalOperations = 0;
    this.lastThroughputCheck = performance.now();
    this.opsInWindow = 0;

    // Elements
    this.streamPill = document.getElementById('streamPill');
    this.streamStatusText = document.getElementById('streamStatusText');
    this.btnToggle = document.getElementById('btnToggleLiveStream');
    this.speedRange = document.getElementById('streamSpeedRange');
    this.speedVal = document.getElementById('streamRateVal');
    this.eventFeedList = document.getElementById('eventFeedList');
    this.throughputMetric = document.getElementById('metricThroughput');

    this.bindEvents();
  }

  bindEvents() {
    this.btnToggle?.addEventListener('click', () => this.toggle());

    this.speedRange?.addEventListener('input', (e) => {
      this.updatesPerSecond = parseInt(e.target.value, 10);
      if (this.speedVal) {
        this.speedVal.textContent = `${this.updatesPerSecond} updates/sec`;
      }
      if (this.isRunning) {
        this.restartInterval();
      }
    });

    document.getElementById('btnSimulateBurst')?.addEventListener('click', () => {
      this.runBurstStressTest(1000);
    });

    document.getElementById('btnClearLog')?.addEventListener('click', () => {
      if (this.eventFeedList) {
        this.eventFeedList.innerHTML = '';
      }
    });
  }

  toggle() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    if (this.btnToggle) {
      this.btnToggle.textContent = '⏸ Pause Live Stream';
      this.btnToggle.classList.remove('btn-success');
      this.btnToggle.classList.add('btn-warning');
    }
    if (this.streamPill) {
      this.streamPill.style.display = 'flex';
    }
    if (this.streamStatusText) {
      this.streamStatusText.textContent = `Live Stream (${this.updatesPerSecond}/s)`;
    }

    this.restartInterval();
    this.app.showToast('📡 WebSocket Live Stream Connected', 'info');
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.btnToggle) {
      this.btnToggle.textContent = '▶ Start Live Match Stream';
      this.btnToggle.classList.remove('btn-warning');
      this.btnToggle.classList.add('btn-success');
    }
    if (this.streamStatusText) {
      this.streamStatusText.textContent = 'WebSocket Paused';
    }
    this.app.showToast('⏸ WebSocket Stream Paused', 'warning');
  }

  restartInterval() {
    if (this.timer) clearInterval(this.timer);
    const intervalMs = Math.max(20, Math.floor(1000 / this.updatesPerSecond));
    this.timer = setInterval(() => this.tick(), intervalMs);
  }

  /**
   * Single event tick: pick a player, mutate score, update MaxHeap and Fenwick Tree
   */
  tick() {
    const players = this.app.getAllPlayers();
    if (!players || players.length === 0) return;

    // Pick random player
    const targetPlayer = players[Math.floor(Math.random() * players.length)];
    const oldScore = targetPlayer.score;
    const oldRank = this.app.fenwick.getRank(oldScore).rank;

    // Random score mutation (+50 to +300 for gaming/contest progress, or slight penalty -50)
    const delta = Math.random() > 0.85 ? -50 : Math.floor(Math.random() * 250 + 50);
    const newScore = Math.max(0, Math.min(10000, oldScore + delta));

    targetPlayer.score = newScore;
    targetPlayer.lastDelta = delta;

    // Mutate Fenwick tree in O(log M)
    this.app.fenwick.update(oldScore, newScore);

    // Mutate MaxHeap in O(log K)
    this.app.heap.update(targetPlayer.id, newScore);

    const newRank = this.app.fenwick.getRank(newScore).rank;
    const rankDelta = oldRank - newRank; // positive means climbed ranks!

    // Record event
    this.addEventLog({
      playerName: targetPlayer.name,
      oldScore,
      newScore,
      delta,
      rankDelta,
      type: delta > 0 ? (rankDelta > 0 ? 'rank-up' : 'kill') : 'kill'
    });

    this.totalOperations++;
    this.opsInWindow++;

    // Refresh UI periodically
    this.app.refreshUI(targetPlayer.id, rankDelta);
    this.updateThroughputMeter();
  }

  updateThroughputMeter() {
    const now = performance.now();
    const elapsed = now - this.lastThroughputCheck;
    if (elapsed >= 1000) {
      const currentOps = Math.round((this.opsInWindow * 1000) / elapsed);
      if (this.throughputMetric) {
        this.throughputMetric.textContent = `${currentOps} ops/s`;
      }
      this.opsInWindow = 0;
      this.lastThroughputCheck = now;
    }
  }

  addEventLog(evt) {
    if (!this.eventFeedList) return;

    const item = document.createElement('div');
    item.className = `event-feed-item ${evt.type}`;

    const deltaSign = evt.delta >= 0 ? `+${evt.delta}` : `${evt.delta}`;
    const rankTag = evt.rankDelta !== 0
      ? `<span class="${evt.rankDelta > 0 ? 'text-success' : 'text-danger'}">(${evt.rankDelta > 0 ? '▲' : '▼'}${Math.abs(evt.rankDelta)})</span>`
      : '';

    item.innerHTML = `
      <span><strong>${evt.playerName}</strong> ${deltaSign} pts ${rankTag}</span>
      <span class="text-muted">${evt.newScore} pts</span>
    `;

    this.eventFeedList.prepend(item);

    // Keep max 20 events in DOM
    while (this.eventFeedList.children.length > 20) {
      this.eventFeedList.removeChild(this.eventFeedList.lastChild);
    }
  }

  /**
   * Stress test: 1,000 concurrent mutations
   */
  runBurstStressTest(count = 1000) {
    const start = performance.now();
    const players = this.app.getAllPlayers();
    if (!players || players.length === 0) return;

    for (let i = 0; i < count; i++) {
      const p = players[Math.floor(Math.random() * players.length)];
      const oldScore = p.score;
      const delta = Math.floor(Math.random() * 200 - 50);
      const newScore = Math.max(0, Math.min(10000, oldScore + delta));
      p.score = newScore;
      this.app.fenwick.update(oldScore, newScore);
      this.app.heap.update(p.id, newScore);
    }

    const elapsed = performance.now() - start;
    const opsPerSec = Math.round((count / elapsed) * 1000);

    this.app.refreshUI();
    this.app.showToast(`⚡ Processed ${count.toLocaleString()} atomic updates in ${elapsed.toFixed(1)}ms (${opsPerSec.toLocaleString()} ops/s)!`, 'success');

    if (this.throughputMetric) {
      this.throughputMetric.textContent = `${opsPerSec.toLocaleString()} ops/s`;
    }
  }
}

window.MatchSimulationEngine = MatchSimulationEngine;

/**
 * NexusRank Main Controller
 * Coordinates Arena Presets, Max-Heap, Fenwick Tree, Quick Select,
 * Voice Assistant, Real-time Visualizers, and Light/Dark Mode.
 */

class NexusRankApp {
  constructor() {
    this.currentPresetKey = 'pubg';
    this.currentTheme = 'dark';
    this.topKCount = 10;
    this.filterQuery = '';

    // Data Structures
    this.heap = new PlayerMaxHeap(100);
    this.fenwick = new FenwickRankTree(10000);
    this.quickSelectEngine = new QuickSelectEngine();

    // Data
    this.activePlayers = [];
    this.backgroundPlayerCount = 9988; // total 10,000 players in the system!

    // Quick Select Stepper state
    this.qsSteps = [];
    this.qsCurrentStep = 0;
    this.qsAutoPlayTimer = null;

    // Subsystems
    this.simulation = null;
    this.voiceAssistant = null;

    this.init();
  }

  init() {
    this.initTheme();
    this.loadPreset(this.currentPresetKey);
    this.initSubsystems();
    this.bindEvents();
    this.renderCodeSnippet('cpp');
    this.drawFenwickDistribution();
    this.updateHeapVisualizer();
  }

  /* ==========================================================================
     Theme Management (Dark to Light & Light to Dark)
     ========================================================================== */
  initTheme() {
    const saved = localStorage.getItem('nexus_theme');
    if (saved) {
      this.currentTheme = saved;
    } else {
      this.currentTheme = 'dark';
    }
    this.applyTheme(this.currentTheme);
  }

  setTheme(theme) {
    this.currentTheme = theme;
    this.applyTheme(theme);
    localStorage.setItem('nexus_theme', theme);
  }

  toggleTheme() {
    const next = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const label = document.getElementById('themeLabel');
    if (label) {
      label.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
    // Redraw canvases with new theme colors
    setTimeout(() => {
      this.drawFenwickDistribution();
      this.updateHeapVisualizer();
    }, 50);
  }

  /* ==========================================================================
     Preset Loading & Data Initialization
     ========================================================================== */
  loadPreset(presetKey) {
    const preset = ARENA_PRESETS[presetKey];
    if (!preset) return;
    this.currentPresetKey = presetKey;

    // Set custom detail table header
    const detailHeader = document.getElementById('customDetailHeader');
    if (detailHeader) {
      detailHeader.textContent = preset.detailLabel;
    }

    // Clone seed players
    this.activePlayers = preset.players.map(p => ({
      ...p,
      lastDelta: 0
    }));

    // Reset and build Fenwick Rank Tree with 10,000 players
    this.fenwick.clear();

    // 1. Add our named top players
    this.activePlayers.forEach(p => {
      this.fenwick.add(p.score, 1);
    });

    // 2. Add realistic background player scores (Gaussian-like distribution centered at 4500)
    for (let i = 0; i < this.backgroundPlayerCount; i++) {
      // Box-Muller transform for normal distribution
      const u = Math.random();
      const v = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      const score = Math.max(200, Math.min(6500, Math.round(4500 + z * 1200)));
      this.fenwick.add(score, 1);
    }

    // Build Max-Heap
    this.heap.buildHeap(this.activePlayers);

    // Update Player Suggestions Datalist
    this.updatePlayerDatalist();

    // Refresh UI components
    this.refreshUI();
    this.drawFenwickDistribution();
    this.updateHeapVisualizer();
    this.initQuickSelectData();
  }

  initSubsystems() {
    this.simulation = new MatchSimulationEngine(this);
    this.voiceAssistant = new NexusVoiceAssistant(this);
  }

  /* ==========================================================================
     UI Rendering: Leaderboard Table & Podium
     ========================================================================== */
  refreshUI(updatedPlayerId = null, rankDelta = 0) {
    const sorted = this.heap.toSortedArray();
    const visiblePlayers = sorted.slice(0, this.topKCount);

    this.renderPodium(visiblePlayers.slice(0, 3));
    this.renderTable(visiblePlayers, updatedPlayerId, rankDelta);
    this.updateHeapVisualizer();
    this.updateTotalPlayersMetric();
  }

  updateTotalPlayersMetric() {
    const totalEl = document.getElementById('metricTotalPlayers');
    if (totalEl) {
      totalEl.textContent = this.fenwick.totalElements.toLocaleString();
    }
  }

  renderPodium(top3) {
    const container = document.getElementById('podiumContainer');
    if (!container || top3.length < 3) return;

    const p1 = top3[0];
    const p2 = top3[1];
    const p3 = top3[2];

    container.innerHTML = `
      <!-- Rank 2 -->
      <div class="podium-card podium-2">
        <div class="podium-avatar">${p2.avatar}</div>
        <div class="podium-name">${p2.name}</div>
        <div class="podium-score">${p2.score.toLocaleString()} pts</div>
        <span class="podium-rank-tag">RANK #2 • SILVER</span>
      </div>

      <!-- Rank 1 Champion -->
      <div class="podium-card podium-1">
        <div class="podium-crown">👑</div>
        <div class="podium-avatar">${p1.avatar}</div>
        <div class="podium-name">${p1.name}</div>
        <div class="podium-score">${p1.score.toLocaleString()} pts</div>
        <span class="podium-rank-tag">CHAMPION • RANK #1</span>
      </div>

      <!-- Rank 3 -->
      <div class="podium-card podium-3">
        <div class="podium-avatar">${p3.avatar}</div>
        <div class="podium-name">${p3.name}</div>
        <div class="podium-score">${p3.score.toLocaleString()} pts</div>
        <span class="podium-rank-tag">RANK #3 • BRONZE</span>
      </div>
    `;
  }

  renderTable(players, updatedId = null, rankDelta = 0) {
    const tbody = document.getElementById('leaderboardTbody');
    if (!tbody) return;

    let filtered = players;
    if (this.filterQuery) {
      const q = this.filterQuery.toLowerCase();
      filtered = players.filter(p => p.name.toLowerCase().includes(q) || (p.squad && p.squad.toLowerCase().includes(q)));
    }

    tbody.innerHTML = '';

    filtered.forEach((player, idx) => {
      const rank = idx + 1;
      const tr = document.createElement('tr');
      if (player.id === updatedId) {
        tr.className = rankDelta > 0 ? 'flash-up' : (rankDelta < 0 ? 'flash-down' : '');
      }

      // Rank badge style
      let rankBadgeClass = 'rank-badge-cell';
      if (rank === 1) rankBadgeClass += ' rank-1-badge';
      else if (rank === 2) rankBadgeClass += ' rank-2-badge';
      else if (rank === 3) rankBadgeClass += ' rank-3-badge';

      // Delta badge
      let deltaBadge = '<span class="delta-badge delta-neutral">— 0</span>';
      if (player.lastDelta > 0) {
        deltaBadge = `<span class="delta-badge delta-up">▲ +${player.lastDelta}</span>`;
      } else if (player.lastDelta < 0) {
        deltaBadge = `<span class="delta-badge delta-down">▼ ${player.lastDelta}</span>`;
      }

      // Fenwick rank lookup for percentile
      const fenwickData = this.fenwick.getRank(player.score);

      tr.innerHTML = `
        <td><span class="${rankBadgeClass}">${rank}</span></td>
        <td>
          <div class="player-cell">
            <div class="player-avatar-mini">${player.avatar || '👤'}</div>
            <div class="player-cell-info">
              <span class="player-cell-name">${player.name}</span>
              <span class="player-cell-handle">${player.squad || 'SOLO'}</span>
            </div>
          </div>
        </td>
        <td class="score-cell">${player.score.toLocaleString()}</td>
        <td>${player.detail || '—'}</td>
        <td>${deltaBadge}</td>
        <td><span class="badge-tag">${fenwickData.percentile}</span></td>
        <td>
          <button class="btn btn-outline btn-sm btn-find-this-rank" data-name="${player.name}">
            Rank Trace
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Rebind action buttons
    tbody.querySelectorAll('.btn-find-this-rank').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = e.currentTarget.getAttribute('data-name');
        this.lookupPlayerRank(name);
      });
    });
  }

  /* ==========================================================================
     Instant Rank Finder
     ========================================================================== */
  lookupPlayerRank(playerName) {
    const player = this.activePlayers.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    const box = document.getElementById('rankResultBox');
    if (!box) return;

    if (!player) {
      this.showToast(`Player "${playerName}" not found.`, 'warning');
      return;
    }

    const rankInfo = this.fenwick.getRank(player.score);

    // Populate Box
    document.getElementById('resAvatar').textContent = player.avatar || '👤';
    document.getElementById('resPlayerName').textContent = player.name;
    document.getElementById('resPlayerTag').textContent = player.squad || 'ACTIVE';
    document.getElementById('resRankBadge').textContent = `#${rankInfo.rank}`;
    document.getElementById('resScore').textContent = player.score.toLocaleString();
    document.getElementById('resGlobalRank').textContent = `${rankInfo.rank.toLocaleString()} / ${rankInfo.totalPlayers.toLocaleString()}`;
    document.getElementById('resPercentile').textContent = rankInfo.percentile;
    document.getElementById('resTimeComp').textContent = `${rankInfo.timeMicroseconds} µs [O(log N)]`;

    // Visual Bitwise Traversal Trace
    const jumpsStr = rankInfo.jumps.slice(0, 6).join(' ➔ ');
    document.getElementById('traceCode').textContent =
      `queryPrefix(${player.score}) :: BIT nodes visited [${jumpsStr}] | count(> ${player.score}) = ${rankInfo.playersHigher} ➔ Global Rank = #${rankInfo.rank}`;

    box.style.display = 'block';
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    this.showToast(`Calculated Rank #${rankInfo.rank} for ${player.name} in ${rankInfo.timeMicroseconds} µs!`, 'success');
  }

  findPlayerRankByName(name) {
    const player = this.activePlayers.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
    if (!player) return null;
    const rank = this.fenwick.getRank(player.score);
    this.lookupPlayerRank(player.name);
    return { player, rank };
  }

  /* ==========================================================================
     Max-Heap Visualizer (SVG Tree & Array Representation)
     ========================================================================== */
  updateHeapVisualizer() {
    const svg = document.getElementById('heapSvgCanvas');
    const arrayContainer = document.getElementById('heapArrayView');
    if (!svg || !arrayContainer) return;

    const heapArray = this.heap.toArray().slice(0, 15); // Show top 15 nodes for clean tree
    svg.innerHTML = '';
    arrayContainer.innerHTML = '';

    if (heapArray.length === 0) return;

    // Render Sequential Array Cells
    heapArray.forEach((item, idx) => {
      const cell = document.createElement('div');
      cell.className = `heap-array-cell ${idx === 0 ? 'root-cell' : ''}`;
      cell.innerHTML = `
        <span class="array-idx">[${idx}] ${idx === 0 ? '(ROOT)' : ''}</span>
        <span class="array-val">${item.score}</span>
        <span class="text-xs text-muted">${item.name}</span>
      `;
      arrayContainer.appendChild(cell);
    });

    // Render Binary Tree in SVG
    const width = svg.clientWidth || 800;
    const height = 340;
    const levelHeight = 65;

    // Calculate node coordinates
    const positions = [];
    const maxDepth = Math.floor(Math.log2(heapArray.length));

    heapArray.forEach((item, i) => {
      const level = Math.floor(Math.log2(i + 1));
      const posInLevel = i - (Math.pow(2, level) - 1);
      const totalInLevel = Math.pow(2, level);
      const levelWidth = width / (totalInLevel + 1);
      const x = (posInLevel + 1) * levelWidth;
      const y = 40 + level * levelHeight;

      positions.push({ x, y, item, i });
    });

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const edgeColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
    const nodeBg = isDark ? '#1e293b' : '#ffffff';
    const nodeBorder = isDark ? '#6366f1' : '#4f46e5';
    const rootBg = isDark ? '#4338ca' : '#6366f1';

    // Draw Edges first
    positions.forEach(pos => {
      if (pos.i > 0) {
        const parentIdx = Math.floor((pos.i - 1) / 2);
        const parentPos = positions[parentIdx];
        if (parentPos) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', parentPos.x);
          line.setAttribute('y1', parentPos.y);
          line.setAttribute('x2', pos.x);
          line.setAttribute('y2', pos.y);
          line.setAttribute('stroke', edgeColor);
          line.setAttribute('stroke-width', '2');
          svg.appendChild(line);
        }
      }
    });

    // Draw Nodes
    positions.forEach(pos => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pos.x);
      circle.setAttribute('cy', pos.y);
      circle.setAttribute('r', pos.i === 0 ? '22' : '18');
      circle.setAttribute('fill', pos.i === 0 ? rootBg : nodeBg);
      circle.setAttribute('stroke', pos.i === 0 ? '#f59e0b' : nodeBorder);
      circle.setAttribute('stroke-width', pos.i === 0 ? '3' : '2');
      circle.setAttribute('class', 'heap-node-circle');

      const textScore = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textScore.setAttribute('x', pos.x);
      textScore.setAttribute('y', pos.y + 4);
      textScore.setAttribute('class', 'heap-node-text-val');
      textScore.textContent = pos.item.score;

      const textName = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textName.setAttribute('x', pos.x);
      textName.setAttribute('y', pos.y + 26);
      textName.setAttribute('class', 'heap-node-text-name');
      textName.textContent = pos.item.name.slice(0, 8);

      g.appendChild(circle);
      g.appendChild(textScore);
      g.appendChild(textName);
      svg.appendChild(g);
    });
  }

  /* ==========================================================================
     Quick Select Visualizer
     ========================================================================== */
  initQuickSelectData() {
    this.runQuickSelectForK(4);
  }

  runQuickSelectForK(k = 4) {
    const sample = this.activePlayers.map(p => ({ ...p }));
    const result = this.quickSelectEngine.findKthLargest(sample, k);
    this.qsSteps = result.steps;
    this.qsCurrentStep = 0;

    this.renderQsStep(0);
    this.updateQsControls();
  }

  renderQsStep(stepIdx) {
    const step = this.qsSteps[stepIdx];
    if (!step) return;

    const container = document.getElementById('qsArrayContainer');
    const indicator = document.getElementById('qsStepIndicator');
    const logBox = document.getElementById('qsLogBox');
    if (!container || !indicator) return;

    indicator.innerHTML = step.message;

    container.innerHTML = '';
    step.arrayState.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'qs-element';

      if (idx === step.pivotIdx) {
        el.classList.add('is-pivot');
      }
      if (step.low !== undefined && step.high !== undefined) {
        if (idx >= step.low && idx <= step.high) {
          el.classList.add('is-active-range');
        } else {
          el.classList.add('is-discarded');
        }
      }
      if (step.type === 'found' && idx === step.foundIdx) {
        el.classList.add('is-target-found');
      }

      el.innerHTML = `
        <span class="qs-idx">[${idx}]</span>
        <span class="qs-val">${item.score}</span>
        <span class="text-xs text-muted">${item.name.slice(0, 6)}</span>
      `;
      container.appendChild(el);
    });

    // Append to log box
    if (logBox) {
      const logEntry = document.createElement('div');
      logEntry.className = 'qs-log-entry';
      logEntry.textContent = `[Step ${stepIdx + 1}/${this.qsSteps.length}] ${step.message}`;
      logBox.appendChild(logEntry);
      logBox.scrollTop = logBox.scrollHeight;
    }

    const counter = document.getElementById('qsStepCounter');
    if (counter) {
      counter.textContent = `Step ${stepIdx + 1} of ${this.qsSteps.length}`;
    }
  }

  updateQsControls() {
    const prevBtn = document.getElementById('btnQsPrevStep');
    const nextBtn = document.getElementById('btnQsNextStep');
    if (prevBtn) prevBtn.disabled = this.qsCurrentStep <= 0;
    if (nextBtn) nextBtn.disabled = this.qsCurrentStep >= this.qsSteps.length - 1;
  }

  qsNextStep() {
    if (this.qsCurrentStep < this.qsSteps.length - 1) {
      this.qsCurrentStep++;
      this.renderQsStep(this.qsCurrentStep);
      this.updateQsControls();
    }
  }

  qsPrevStep() {
    if (this.qsCurrentStep > 0) {
      this.qsCurrentStep--;
      this.renderQsStep(this.qsCurrentStep);
      this.updateQsControls();
    }
  }

  /* ==========================================================================
     Fenwick Score Frequency Histogram (Canvas)
     ========================================================================== */
  drawFenwickDistribution() {
    const canvas = document.getElementById('fenwickChartCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const buckets = this.fenwick.getBuckets(45);
    const maxCount = Math.max(...buckets.map(b => b.count), 1);
    const barWidth = width / buckets.length;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const primaryColor = isDark ? '#6366f1' : '#4f46e5';
    const accentColor = isDark ? '#06b6d4' : '#0891b2';

    buckets.forEach((b, i) => {
      const barHeight = (b.count / maxCount) * (height - 40);
      const x = i * barWidth;
      const y = height - barHeight - 25;

      const grad = ctx.createLinearGradient(0, y, 0, height - 25);
      grad.addColorStop(0, accentColor);
      grad.addColorStop(1, primaryColor);

      ctx.fillStyle = grad;
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
    });

    // Base axis line
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.moveTo(0, height - 25);
    ctx.lineTo(width, height - 25);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText('Score 0', 10, height - 10);
    ctx.fillText('Median ~4,500', width / 2 - 35, height - 10);
    ctx.fillText('Score 10,000 (Top)', width - 110, height - 10);
  }

  /* ==========================================================================
     Code Snippets for MNC Showcase
     ========================================================================== */
  renderCodeSnippet(lang) {
    const display = document.getElementById('codeDisplayArea');
    if (!display) return;

    const snippets = {
      cpp: `// ===================================================================
// C++: Policy-Based Data Structure (ordered_set) for O(log N) Ranking
// Used in Competitive Programming & High-Throughput Engines
// ===================================================================
#include <iostream>
#include <ext/pb_ds/assoc_container.hpp>
#include <ext/pb_ds/tree_policy.hpp>

using namespace __gnu_pbds;

// order_of_key(k): returns number of strictly smaller elements -> O(log N)
// find_by_order(k): returns iterator to kth element (0-indexed) -> O(log N)
typedef tree<
    std::pair<int, int>, // {score, playerId}
    null_type,
    std::less<std::pair<int, int>>,
    rb_tree_tag,
    tree_order_statistics_node_update
> ordered_set;

class HighPerformanceLeaderboard {
    ordered_set ost;
    std::unordered_map<int, int> playerScores;
public:
    void updateScore(int playerId, int newScore) {
        if (playerScores.count(playerId)) {
            ost.erase({playerScores[playerId], playerId});
        }
        playerScores[playerId] = newScore;
        ost.insert({newScore, playerId});
    }

    int getRank(int playerId) {
        int score = playerScores[playerId];
        // Rank = Total elements - elements strictly less or equal
        int smaller = ost.order_of_key({score, playerId});
        return ost.size() - smaller; // 1-indexed rank
    }
};`,
      java: `// ===================================================================
// Java: Concurrent SkipList / TreeMap + Top-K PriorityQueue
// Standard MNC Architecture (BYJU'S / HackerRank / Gaming Backend)
// ===================================================================
import java.util.*;
import java.util.concurrent.*;

public class LeaderboardEngine {
    private final PriorityQueue<Player> topKHeap; // O(1) peek, O(log K) insert
    private final ConcurrentHashMap<String, Integer> scoreIndex;
    private final int MAX_TOP_K = 100;

    public LeaderboardEngine() {
        this.topKHeap = new PriorityQueue<>(Comparator.comparingInt(p -> p.score));
        this.scoreIndex = new ConcurrentHashMap<>();
    }

    public synchronized void updateScore(String playerId, int newScore) {
        scoreIndex.put(playerId, newScore);

        // Maintain bounded Min-Heap for Top-K
        topKHeap.removeIf(p -> p.id.equals(playerId));
        topKHeap.offer(new Player(playerId, newScore));
        if (topKHeap.size() > MAX_TOP_K) {
            topKHeap.poll(); // Evict lowest among top-K
        }
    }

    public List<Player> getTopK() {
        List<Player> list = new ArrayList<>(topKHeap);
        list.sort((a, b) -> Integer.compare(b.score, a.score));
        return list;
    }
}`,
      redis: `// ===================================================================
// Redis Sorted Sets (ZSET) Architecture: PUBG / Mobile Game Scale
// Underlying Structure: SkipList + Hash Table
// ===================================================================

// 1. Ingest atomic score update in O(log N):
ZADD leaderboard:pubg_squad 9850 "ApexSniper"

// 2. Fetch instant 1-based rank in O(log N):
ZREVRANK leaderboard:pubg_squad "ApexSniper"
// Returns: 0 (which is Rank #1)

// 3. Fetch Top 10 with scores in O(log N + M):
ZREVRANGE leaderboard:pubg_squad 0 9 WITHSCORES

// 4. Count users with score strictly greater than 8,000 in O(log N):
ZCOUNT leaderboard:pubg_squad (8000 +inf`,
      js: `// ===================================================================
// JavaScript: Fenwick Rank Tree (Binary Indexed Tree)
// O(log M) rank query with sub-millisecond execution
// ===================================================================
class FenwickLeaderboard {
    constructor(maxScore = 10000) {
        this.tree = new Int32Array(maxScore + 2);
        this.total = 0;
    }

    add(score, delta) {
        let i = score + 1;
        this.total += delta;
        while (i < this.tree.length) {
            this.tree[i] += delta;
            i += (i & -i); // lowest set bit
        }
    }

    getRank(score) {
        let sum = 0, i = score + 1;
        while (i > 0) {
            sum += this.tree[i];
            i -= (i & -i);
        }
        return (this.total - sum) + 1; // 1-indexed global rank
    }
}`
    };

    display.textContent = snippets[lang] || snippets.cpp;
  }

  /* ==========================================================================
     Event Binding
     ========================================================================== */
  bindEvents() {
    // Theme toggle
    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
      const next = this.toggleTheme();
      this.showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
    });

    // Preset selector buttons
    document.querySelectorAll('#presetSelector .seg-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#presetSelector .seg-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const preset = e.currentTarget.getAttribute('data-preset');
        this.loadPreset(preset);
        this.showToast(`Switched arena to: ${ARENA_PRESETS[preset].title}`, 'info');
      });
    });

    // Tab buttons
    document.querySelectorAll('.app-tab-nav .tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Leaderboard search filter
    document.getElementById('playerSearchInput')?.addEventListener('input', (e) => {
      this.filterQuery = e.target.value;
      this.refreshUI();
    });

    // Top-K count dropdown
    document.getElementById('topKSelect')?.addEventListener('change', (e) => {
      this.topKCount = parseInt(e.target.value, 10);
      this.refreshUI();
    });

    // Instant Rank Finder
    document.getElementById('btnFindRank')?.addEventListener('click', () => {
      const input = document.getElementById('targetPlayerQuery');
      if (input && input.value) {
        this.lookupPlayerRank(input.value.trim());
      }
    });

    document.getElementById('targetPlayerQuery')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const input = document.getElementById('targetPlayerQuery');
        if (input && input.value) {
          this.lookupPlayerRank(input.value.trim());
        }
      }
    });

    // Heap Visualizer Controls
    document.getElementById('btnHeapExtractMax')?.addEventListener('click', () => {
      const res = this.heap.extractMax(true);
      if (res && res.item) {
        this.refreshUI();
        this.showToast(`Extracted root: ${res.item.name} (${res.item.score})`, 'warning');
      }
    });

    document.getElementById('btnHeapInsertRandom')?.addEventListener('click', () => {
      const randomScore = Math.floor(Math.random() * 4000 + 6000);
      const randomId = 'rand_' + Math.floor(Math.random() * 9999);
      const player = {
        id: randomId,
        name: `Challenger_${randomId.slice(-4)}`,
        score: randomScore,
        detail: 'Dynamic Challenger',
        avatar: '⚡',
        squad: 'WILDCARD'
      };
      this.activePlayers.push(player);
      this.fenwick.add(randomScore, 1);
      this.heap.insert(player, true);
      this.updatePlayerDatalist();
      this.refreshUI();
      this.showToast(`Inserted ${player.name} with score ${player.score}!`, 'success');
    });

    document.getElementById('btnHeapReset')?.addEventListener('click', () => {
      this.loadPreset(this.currentPresetKey);
      this.showToast('Rebuilt Max-Heap from seed arena data', 'info');
    });

    // Quick Select Stepper Buttons
    document.getElementById('btnRunQuickSelect')?.addEventListener('click', () => {
      const k = parseInt(document.getElementById('qsKInput')?.value || '4', 10);
      this.runQuickSelectForK(k);
    });

    document.getElementById('btnQsNextStep')?.addEventListener('click', () => this.qsNextStep());
    document.getElementById('btnQsPrevStep')?.addEventListener('click', () => this.qsPrevStep());

    document.getElementById('btnQsPlayAuto')?.addEventListener('click', (e) => {
      if (this.qsAutoPlayTimer) {
        clearInterval(this.qsAutoPlayTimer);
        this.qsAutoPlayTimer = null;
        e.currentTarget.textContent = 'Auto Play';
      } else {
        e.currentTarget.textContent = 'Pause';
        this.qsAutoPlayTimer = setInterval(() => {
          if (this.qsCurrentStep < this.qsSteps.length - 1) {
            this.qsNextStep();
          } else {
            clearInterval(this.qsAutoPlayTimer);
            this.qsAutoPlayTimer = null;
            e.currentTarget.textContent = 'Auto Play';
          }
        }, 700);
      }
    });

    // Subtab navigation in Operations
    document.querySelectorAll('.tabs-sub .subtab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tabs-sub .subtab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const target = e.currentTarget.getAttribute('data-subtab');
        document.getElementById(`subtab-${target}`)?.classList.add('active');
      });
    });

    // Score +/- buttons in manual form
    document.getElementById('btnScorePlus500')?.addEventListener('click', () => {
      const input = document.getElementById('updateScoreInput');
      if (input) input.value = Math.min(10000, parseInt(input.value || '0', 10) + 500);
    });

    document.getElementById('btnScoreMinus500')?.addEventListener('click', () => {
      const input = document.getElementById('updateScoreInput');
      if (input) input.value = Math.max(0, parseInt(input.value || '0', 10) - 500);
    });

    // Execute Manual Score Update
    document.getElementById('btnExecuteScoreUpdate')?.addEventListener('click', () => {
      const select = document.getElementById('updatePlayerSelect');
      const input = document.getElementById('updateScoreInput');
      if (!select || !input) return;

      const playerId = select.value;
      const newScore = parseInt(input.value, 10);
      const player = this.activePlayers.find(p => p.id === playerId);

      if (player && !isNaN(newScore)) {
        const oldScore = player.score;
        this.fenwick.update(oldScore, newScore);
        player.score = newScore;
        player.lastDelta = newScore - oldScore;
        this.heap.update(playerId, newScore, true);
        this.refreshUI(playerId, player.lastDelta);
        this.showToast(`Updated ${player.name} score to ${newScore}!`, 'success');
      }
    });

    // Insert Player
    document.getElementById('btnExecutePlayerInsert')?.addEventListener('click', () => {
      const nameInput = document.getElementById('insertPlayerName');
      const scoreInput = document.getElementById('insertPlayerScore');
      if (!nameInput || !scoreInput) return;

      const name = nameInput.value.trim();
      const score = parseInt(scoreInput.value, 10);

      if (name && !isNaN(score)) {
        const newPlayer = {
          id: 'custom_' + Date.now(),
          name,
          score,
          detail: 'New Contestant',
          avatar: '⭐',
          squad: 'NEW'
        };
        this.activePlayers.push(newPlayer);
        this.fenwick.add(score, 1);
        this.heap.insert(newPlayer);
        this.updatePlayerDatalist();
        this.refreshUI();
        this.showToast(`Inserted ${name} with score ${score}!`, 'success');
        nameInput.value = '';
      }
    });

    // Fenwick chart test button
    document.getElementById('btnTestFenwick')?.addEventListener('click', () => {
      const input = document.getElementById('testFenwickScore');
      const out = document.getElementById('fenwickOutputBox');
      if (!input || !out) return;

      const score = parseInt(input.value, 10);
      const rankInfo = this.fenwick.getRank(score);

      out.innerHTML = `
        Score ${score.toLocaleString()}: <strong>Rank #${rankInfo.rank.toLocaleString()}</strong> 
        among ${rankInfo.totalPlayers.toLocaleString()} contestants (Higher: ${rankInfo.playersHigher.toLocaleString()} | 
        ${rankInfo.percentile}). Computed in ${rankInfo.timeMicroseconds} µs!
      `;
    });

    // Code language selector
    document.querySelectorAll('.code-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.code-tab').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const lang = e.currentTarget.getAttribute('data-lang');
        this.renderCodeSnippet(lang);
      });
    });
  }

  updatePlayerDatalist() {
    const list = document.getElementById('playerSuggestions');
    const select = document.getElementById('updatePlayerSelect');
    if (list) {
      list.innerHTML = '';
      this.activePlayers.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        list.appendChild(opt);
      });
    }
    if (select) {
      select.innerHTML = '';
      this.activePlayers.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} (${p.score} pts)`;
        select.appendChild(opt);
      });
    }
  }

  switchTab(tabKey) {
    document.querySelectorAll('.app-tab-nav .tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabKey);
    });
    document.querySelectorAll('.tab-content').forEach(c => {
      c.classList.toggle('active', c.id === `tab-${tabKey}`);
    });

    if (tabKey === 'heap-visualizer') {
      setTimeout(() => this.updateHeapVisualizer(), 50);
    } else if (tabKey === 'order-statistics') {
      setTimeout(() => this.drawFenwickDistribution(), 50);
    }
  }

  getAllPlayers() {
    return this.activePlayers;
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.nexusApp = new NexusRankApp();
});

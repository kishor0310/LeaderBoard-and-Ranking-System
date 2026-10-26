# NexusRank: High-Performance Real-Time Leaderboard & Ranking System

> **Category**: Sorting & Searching | **Difficulty**: ⭐ Easy | **MNC Relevance**: ★★★★☆ (Gaming / PUBG / HackerRank / BYJU'S / Codeforces)  
> **Core Algorithms**: Max-Heap / Priority Queue, Order Statistics Tree (Fenwick Tree / BIT), Quick Select, Heap Sort

---

## 🚀 Key Features Built

### 1. Max-Heap for Real-Time Top-K Maintenance
- **Time Complexity**: $O(1)$ Top element access, $O(\log K)$ insertion/eviction, and $O(\log K)$ in-place score mutation via an inverted hash index map (`indexMap`).
- **Interactive Visualizer**: Dynamic SVG binary tree showing node relationships ($2i+1$, $2i+2$, $\lfloor(i-1)/2\rfloor$) and memory array representation.

### 2. Order Statistics & Fenwick Tree (Binary Indexed Tree)
- **Time Complexity**: $O(\log M)$ point updates and $O(\log M)$ exact global rank lookups across **millions** of active contestants.
- **Percentile Calculation**: Instant top percentile reporting (e.g., Top 0.01%) with a bitwise traversal path trace.

### 3. Quick Select Algorithm Visualizer
- **Time Complexity**: $O(n)$ average time to find the $k$-th highest score without requiring an $O(n \log n)$ full sort.
- **Interactive Sandbox**: Step-by-step playback with visual indicators for the pivot element, active subarray boundaries, discarded partitions, and target discovery.

### 4. Interactive Voice Assistant ("Voice AI")
- **Web Speech API**: Integrated Speech-to-Text (Speech Recognition) and Text-to-Speech (Speech Synthesis) with dynamic audio canvas sound wave animations.
- **Supported Voice Commands**:
  - *"Show top 10"* or *"Who is winning?"*
  - *"Find rank of ApexSniper"* or *"Where is Valkyrie?"*
  - *"Find score at rank 4"* (executes Quick Select)
  - *"Start live match"* / *"Stop simulation"*
  - *"Switch to light mode"* / *"Switch to dark mode"*
  - *"Explain algorithms"*

### 5. Seamless Dark & Light Mode Theme Conversion
- **Theme Switcher**: Convert between **Dark Mode** (cyberpunk obsidian glassmorphism) and **Light Mode** (clean porcelain executive white with crisp typography) with a single click or voice command.
- **State Persistence**: Theme preference is automatically saved in `localStorage`.

### 6. Real-Time Concurrency & WebSocket Simulation
- **Concurrent Stream**: Ingests up to 50 updates/second or a 1,000-update burst stress test.
- **Dynamic Leaderboard**: Real-time rank changes with green/red delta animations, podium crowns, and simulated live event feeds.

---

## 📂 Project Directory Structure

```
algo-leaderboard-system/
├── index.html                  # Accessible semantic UI with tabs, podium, and metrics
├── css/
│   └── style.css               # Comprehensive Light & Dark design system with glassmorphism
├── js/
│   ├── algorithms/
│   │   ├── heap.js             # PlayerMaxHeap with O(log K) updates and step recorder
│   │   ├── order-statistics.js # FenwickRankTree with O(log M) rank query and binary lifting
│   │   └── quick-select.js     # Lomuto descending partition with visual step tracing
│   ├── presets.js              # PUBG, HackerRank, and BYJU'S arena presets
│   ├── voice-assistant.js      # Web Speech API STT/TTS engine with wave canvas visualizer
│   ├── simulation.js           # Concurrent WebSocket event generator and stress tester
│   └── app.js                  # Master application controller and event coordinator
└── README.md                   # Documentation and usage guide
```

---

## 🏃 Running the Application

To launch or view the application locally:
```bash
cd /Users/megasree/.gemini/antigravity-ide/scratch/algo-leaderboard-system
python3 -m http.server 8085
```
Open your browser at: **`http://localhost:8085/`**

/**
 * Production Max-Heap and Priority Queue Implementation
 * Used for maintaining Top-K contestants in real-time.
 * Supports O(log K) insertion, O(log K) extraction, and O(log K) in-place score updates
 * using an inverted index (hashmap) mapping player IDs to heap array indices.
 */

class PlayerMaxHeap {
  constructor(maxCapacity = 100) {
    this.heap = []; // array of { id, name, score, detail, avatar, ... }
    this.indexMap = new Map(); // id -> index in this.heap
    this.maxCapacity = maxCapacity;
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  /**
   * Insert a player into the heap.
   * If heap exceeds maxCapacity, we can prune if tracking strictly Top-K.
   */
  insert(player, recordSteps = false) {
    const steps = [];
    if (this.indexMap.has(player.id)) {
      return this.update(player.id, player.score, recordSteps);
    }

    this.heap.push(player);
    const index = this.heap.length - 1;
    this.indexMap.set(player.id, index);

    if (recordSteps) {
      steps.push({
        action: 'insert_end',
        index,
        player: { ...player },
        description: `Appended ${player.name} (score: ${player.score}) at index ${index}`
      });
    }

    this.heapifyUp(index, steps, recordSteps);
    return steps;
  }

  /**
   * Extract max (root) in O(log K)
   */
  extractMax(recordSteps = false) {
    if (this.isEmpty()) return null;
    const steps = [];
    const maxItem = this.heap[0];
    this.indexMap.delete(maxItem.id);

    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.indexMap.set(last.id, 0);

      if (recordSteps) {
        steps.push({
          action: 'swap_root',
          player: { ...last },
          description: `Moved last element ${last.name} to root; starting heapify-down`
        });
      }

      this.heapifyDown(0, steps, recordSteps);
    }

    return { item: maxItem, steps };
  }

  /**
   * Update a player's score in O(log K) using the indexMap
   */
  update(playerId, newScore, recordSteps = false) {
    const steps = [];
    if (!this.indexMap.has(playerId)) return steps;

    const index = this.indexMap.get(playerId);
    const oldScore = this.heap[index].score;
    this.heap[index].score = newScore;

    if (recordSteps) {
      steps.push({
        action: 'update_score',
        index,
        oldScore,
        newScore,
        player: { ...this.heap[index] },
        description: `Updated ${this.heap[index].name} score from ${oldScore} to ${newScore}`
      });
    }

    if (newScore > oldScore) {
      this.heapifyUp(index, steps, recordSteps);
    } else if (newScore < oldScore) {
      this.heapifyDown(index, steps, recordSteps);
    }

    return steps;
  }

  /**
   * Heapify up: compare with parent floor((i-1)/2)
   */
  heapifyUp(i, steps = [], recordSteps = false) {
    while (i > 0) {
      const parentIdx = Math.floor((i - 1) / 2);
      if (this.heap[i].score > this.heap[parentIdx].score) {
        if (recordSteps) {
          steps.push({
            action: 'swap_up',
            from: i,
            to: parentIdx,
            fromPlayer: { ...this.heap[i] },
            toPlayer: { ...this.heap[parentIdx] },
            description: `Heapify Up: ${this.heap[i].name} (${this.heap[i].score}) > parent ${this.heap[parentIdx].name} (${this.heap[parentIdx].score}). Swapping.`
          });
        }
        this.swap(i, parentIdx);
        i = parentIdx;
      } else {
        break;
      }
    }
  }

  /**
   * Heapify down: compare with children 2i+1 and 2i+2
   */
  heapifyDown(i, steps = [], recordSteps = false) {
    const length = this.heap.length;
    while (true) {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      if (left < length && this.heap[left].score > this.heap[largest].score) {
        largest = left;
      }
      if (right < length && this.heap[right].score > this.heap[largest].score) {
        largest = right;
      }

      if (largest !== i) {
        if (recordSteps) {
          steps.push({
            action: 'swap_down',
            from: i,
            to: largest,
            fromPlayer: { ...this.heap[i] },
            toPlayer: { ...this.heap[largest] },
            description: `Heapify Down: Child ${this.heap[largest].name} (${this.heap[largest].score}) > ${this.heap[i].name} (${this.heap[i].score}). Swapping.`
          });
        }
        this.swap(i, largest);
        i = largest;
      } else {
        break;
      }
    }
  }

  swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;

    this.indexMap.set(this.heap[i].id, i);
    this.indexMap.set(this.heap[j].id, j);
  }

  /**
   * Rebuild the entire heap in O(N) using bottom-up buildHeap
   */
  buildHeap(items) {
    this.heap = items.map(x => ({ ...x }));
    this.indexMap.clear();
    this.heap.forEach((item, idx) => {
      this.indexMap.set(item.id, idx);
    });

    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this.heapifyDown(i);
    }
  }

  /**
   * Returns a copy of the heap array
   */
  toArray() {
    return [...this.heap];
  }

  /**
   * Returns sorted array of items from top to bottom (Heap Sort)
   */
  toSortedArray() {
    const clone = new PlayerMaxHeap();
    clone.heap = this.heap.map(x => ({ ...x }));
    clone.heap.forEach((item, idx) => clone.indexMap.set(item.id, idx));

    const sorted = [];
    while (!clone.isEmpty()) {
      sorted.push(clone.extractMax().item);
    }
    return sorted;
  }
}

// Export for window
window.PlayerMaxHeap = PlayerMaxHeap;

/**
 * Quick Select Visualizer & Execution Engine
 * Computes the k-th rank element in O(n) average time complexity
 * using Lomuto/Hoare partitioning without doing an expensive O(n log n) full sort.
 */

class QuickSelectEngine {
  constructor() {
    this.steps = [];
    this.currentStepIndex = 0;
  }

  /**
   * Find the k-th largest element (1-indexed rank, where rank 1 = maximum score).
   * Generates detailed visual steps for playback.
   */
  findKthLargest(rawArray, k) {
    // Clone array so original isn't mutated
    const arr = rawArray.map(item => ({ ...item }));
    this.steps = [];
    this.currentStepIndex = 0;

    // k-th largest is equivalent to (k-1)th element in descending order,
    // or (n - k)th element in ascending order.
    // Let's implement descending partition so index (k-1) directly gives the k-th rank!
    const targetIdx = k - 1;

    this.steps.push({
      type: 'init',
      arrayState: arr.map(x => ({ ...x })),
      low: 0,
      high: arr.length - 1,
      targetIdx,
      k,
      message: `Initial Array loaded. Target: Rank #${k} (Index ${targetIdx} in descending order).`
    });

    this.quickSelect(arr, 0, arr.length - 1, targetIdx, k);

    return {
      result: arr[targetIdx],
      steps: this.steps
    };
  }

  quickSelect(arr, low, high, targetIdx, k) {
    if (low <= high) {
      // Pick pivot (using median or rightmost element)
      const pivotIdx = high;
      const pivotVal = arr[pivotIdx].score;

      this.steps.push({
        type: 'pivot_chosen',
        arrayState: arr.map(x => ({ ...x })),
        low,
        high,
        pivotIdx,
        pivotVal,
        targetIdx,
        k,
        message: `Subarray [${low}..${high}]: Chosen Pivot '${arr[pivotIdx].name}' with Score ${pivotVal}. Partitioning descending...`
      });

      // Lomuto descending partition: elements > pivot go to the left
      let i = low;
      for (let j = low; j < high; j++) {
        const isGreater = arr[j].score > pivotVal;
        this.steps.push({
          type: 'compare',
          arrayState: arr.map(x => ({ ...x })),
          low,
          high,
          pivotIdx,
          compareIdx: j,
          i,
          message: `Comparing '${arr[j].name}' (${arr[j].score}) with Pivot (${pivotVal}): ${arr[j].score} ${isGreater ? '>' : '≤'} ${pivotVal}`
        });

        if (isGreater) {
          if (i !== j) {
            // Swap arr[i] and arr[j]
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;

            this.steps.push({
              type: 'swap',
              arrayState: arr.map(x => ({ ...x })),
              low,
              high,
              pivotIdx,
              swapped: [i, j],
              message: `Swapped '${arr[i].name}' (${arr[i].score}) into left partition at index ${i}`
            });
          }
          i++;
        }
      }

      // Move pivot to its final sorted position at index i
      const temp = arr[i];
      arr[i] = arr[high];
      arr[high] = temp;

      const finalPivotPos = i;

      this.steps.push({
        type: 'pivot_placed',
        arrayState: arr.map(x => ({ ...x })),
        low,
        high,
        pivotIdx: finalPivotPos,
        message: `Pivot placed at index ${finalPivotPos}. All elements to the left have score ≥ ${arr[finalPivotPos].score}.`
      });

      if (finalPivotPos === targetIdx) {
        this.steps.push({
          type: 'found',
          arrayState: arr.map(x => ({ ...x })),
          low,
          high,
          foundIdx: finalPivotPos,
          result: arr[finalPivotPos],
          message: `SUCCESS! Pivot index ${finalPivotPos} matches target rank #${k}. Value: ${arr[finalPivotPos].name} (Score: ${arr[finalPivotPos].score})!`
        });
        return;
      } else if (finalPivotPos > targetIdx) {
        this.steps.push({
          type: 'recurse_left',
          arrayState: arr.map(x => ({ ...x })),
          low,
          high: finalPivotPos - 1,
          discarded: [finalPivotPos, high],
          message: `Pivot index ${finalPivotPos} > Target ${targetIdx}. Discarding right subarray [${finalPivotPos}..${high}]. Recursing left.`
        });
        this.quickSelect(arr, low, finalPivotPos - 1, targetIdx, k);
      } else {
        this.steps.push({
          type: 'recurse_right',
          arrayState: arr.map(x => ({ ...x })),
          low: finalPivotPos + 1,
          high,
          discarded: [low, finalPivotPos],
          message: `Pivot index ${finalPivotPos} < Target ${targetIdx}. Discarding left subarray [${low}..${finalPivotPos}]. Recursing right.`
        });
        this.quickSelect(arr, finalPivotPos + 1, high, targetIdx, k);
      }
    }
  }
}

window.QuickSelectEngine = QuickSelectEngine;

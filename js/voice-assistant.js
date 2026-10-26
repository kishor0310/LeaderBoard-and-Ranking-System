/**
 * Nexus Voice Assistant (Speech-to-Text & Text-to-Speech)
 * Supports continuous speech recognition, natural language intent parsing,
 * audio synthesized feedback, and animated canvas sound waves.
 */

class NexusVoiceAssistant {
  constructor(appContext) {
    this.app = appContext;
    this.recognition = null;
    this.synth = window.speechSynthesis || null;
    this.isListening = false;
    this.isMuted = false;
    this.animationId = null;

    // Elements
    this.panel = document.getElementById('voiceAssistantPanel');
    this.voiceToggleBtn = document.getElementById('voiceToggleBtn');
    this.voiceStatusLine = document.getElementById('voiceStatusLine');
    this.transcriptContent = document.getElementById('transcriptContent');
    this.voiceResponseText = document.getElementById('voiceResponseText');
    this.waveCanvas = document.getElementById('voiceWaveCanvas');
    this.waveCtx = this.waveCanvas ? this.waveCanvas.getContext('2d') : null;
    this.ttsMuteBtn = document.getElementById('ttsMuteBtn');
    this.closeBtn = document.getElementById('closeVoicePanelBtn');

    // Audio Context for subtle UX SFX
    this.audioCtx = null;

    this.initSpeechRecognition();
    this.bindEvents();
    this.startWaveAnimation();
  }

  initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  playTone(freq = 600, duration = 0.12, type = 'sine') {
    try {
      this.initAudioContext();
      if (!this.audioCtx || this.isMuted) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio tone error', e);
    }
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (this.voiceStatusLine) {
        this.voiceStatusLine.textContent = 'Speech API not supported in browser • Use command chips';
      }
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.playTone(880, 0.1, 'triangle');
      this.voiceToggleBtn?.classList.add('listening');
      this.voiceStatusLine.textContent = 'Listening... Speak now!';
    };

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const text = final || interim;
      if (this.transcriptContent) {
        this.transcriptContent.textContent = `"${text}"`;
      }

      if (final) {
        this.processCommand(final);
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('Speech Recognition Error:', event.error);
      this.isListening = false;
      this.voiceToggleBtn?.classList.remove('listening');
      this.voiceStatusLine.textContent = `Error: ${event.error}. Click mic to retry.`;
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.voiceToggleBtn?.classList.remove('listening');
      if (this.voiceStatusLine.textContent === 'Listening... Speak now!') {
        this.voiceStatusLine.textContent = 'Ready • Click Mic or press [Space]';
      }
    };
  }

  toggleListening() {
    this.openPanel();
    if (!this.recognition) {
      this.speak("Speech recognition is not available in your browser, but you can click any command chip below!");
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      try {
        this.recognition.start();
      } catch (err) {
        console.warn('Recognition start exception:', err);
      }
    }
  }

  openPanel() {
    this.panel?.classList.add('open');
  }

  closePanel() {
    this.panel?.classList.remove('open');
    if (this.isListening && this.recognition) {
      this.recognition.stop();
    }
  }

  speak(text) {
    if (this.voiceResponseText) {
      this.voiceResponseText.textContent = text;
    }

    if (!this.synth || this.isMuted) return;

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Prefer a smooth English voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.synth.speak(utterance);
  }

  /**
   * Natural Language Intent Parser
   */
  processCommand(rawQuery) {
    const query = rawQuery.toLowerCase().trim();
    this.playTone(523, 0.15, 'sine');

    // 1. Theme toggle: dark to light or vice versa
    if (query.includes('light mode') || query.includes('switch to light')) {
      this.app.setTheme('light');
      this.speak("Switched to Light Mode. Enjoy the clean porcelain interface!");
      return;
    }
    if (query.includes('dark mode') || query.includes('switch to dark')) {
      this.app.setTheme('dark');
      this.speak("Switched to Dark Mode. Welcome to the cyberpunk arena!");
      return;
    }
    if (query.includes('theme') || query.includes('toggle mode')) {
      const next = this.app.toggleTheme();
      this.speak(`Switched theme to ${next} mode.`);
      return;
    }

    // 2. Show top N players
    if (query.includes('top') || query.includes('who is first') || query.includes('leader') || query.includes('champion')) {
      let topCount = 10;
      const match = query.match(/\b([1-9]|10|20)\b/);
      if (match) topCount = parseInt(match[1], 10);

      this.app.switchTab('leaderboard');
      const topPlayer = this.app.heap.peek();
      if (topPlayer) {
        this.speak(`Showing the top contestants. Current champion is ${topPlayer.name} with ${topPlayer.score} points!`);
      } else {
        this.speak("Leaderboard displayed.");
      }
      return;
    }

    // 3. Find rank of a specific user: e.g. "find rank of ApexSniper" or "rank of Valkyrie"
    if (query.includes('rank of') || query.includes('find rank') || query.includes('where is')) {
      let targetName = query.replace(/(find rank of|rank of|where is|what is rank of|rank for)/gi, '').trim();
      targetName = targetName.replace(/[^a-zA-Z0-9_\s]/g, '').trim();

      if (targetName) {
        const found = this.app.findPlayerRankByName(targetName);
        if (found) {
          this.speak(`${found.player.name} holds rank number ${found.rank.rank} globally with ${found.player.score} points, placing them in the ${found.rank.percentile}.`);
        } else {
          this.speak(`I could not locate player ${targetName} in the live dataset. Try searching ApexSniper or Valkyrie.`);
        }
        return;
      }
    }

    // 4. Quick Select: "find score at rank 5" or "kth rank score"
    if (query.includes('quick select') || query.includes('rank score') || query.includes('score at rank')) {
      let k = 5;
      const match = query.match(/\b([1-9]|1[0-5])\b/);
      if (match) k = parseInt(match[1], 10);

      this.app.switchTab('quick-select');
      this.app.runQuickSelectForK(k);
      this.speak(`Executing Quick Select algorithm in O of n average time to find the score at rank ${k}.`);
      return;
    }

    // 5. Live Simulation: start / stop
    if (query.includes('start simulation') || query.includes('start live') || query.includes('start match')) {
      this.app.simulation.start();
      this.speak("Live match simulation started! Ingesting real-time scores via simulated WebSocket stream.");
      return;
    }
    if (query.includes('stop simulation') || query.includes('pause simulation')) {
      this.app.simulation.stop();
      this.speak("Live score stream paused.");
      return;
    }

    // 6. Explain Algorithms
    if (query.includes('explain') || query.includes('algorithm') || query.includes('how it works')) {
      this.app.switchTab('architecture');
      this.speak("NexusRank combines three key algorithms: a Max-Heap for real-time O of 1 Top-K access, a Fenwick Order Statistics Tree for O of log n rank queries, and Quick Select for O of n rank score lookup!");
      return;
    }

    // 7. Extract Max
    if (query.includes('extract max') || query.includes('remove top')) {
      this.app.switchTab('heap-visualizer');
      const res = this.app.heap.extractMax(true);
      if (res && res.item) {
        this.app.refreshUI();
        this.speak(`Extracted top player ${res.item.name} with score ${res.item.score}. Heapified down in O of log K.`);
      }
      return;
    }

    // Fallback response
    this.speak(`Received: "${rawQuery}". You can say: 'Show top 10', 'Rank of ApexSniper', 'Find score at rank 5', 'Switch to light mode', or 'Start simulation'.`);
  }

  bindEvents() {
    this.voiceToggleBtn?.addEventListener('click', () => this.toggleListening());
    this.closeBtn?.addEventListener('click', () => this.closePanel());

    this.ttsMuteBtn?.addEventListener('click', () => {
      this.isMuted = !this.isMuted;
      this.ttsMuteBtn.classList.toggle('muted', this.isMuted);
      this.ttsMuteBtn.title = this.isMuted ? 'Unmute AI Voice' : 'Mute AI Voice';
      if (this.isMuted && this.synth) this.synth.cancel();
    });

    // Suggested command chips
    document.querySelectorAll('.command-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const cmd = chip.getAttribute('data-cmd');
        if (cmd) {
          if (this.transcriptContent) {
            this.transcriptContent.textContent = `"${cmd}"`;
          }
          this.processCommand(cmd);
        }
      });
    });

    // Keyboard shortcut: Space when panel is open
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyV' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.toggleListening();
      }
    });
  }

  startWaveAnimation() {
    if (!this.waveCtx) return;
    let step = 0;

    const renderWave = () => {
      const width = this.waveCanvas.width;
      const height = this.waveCanvas.height;
      this.waveCtx.clearRect(0, 0, width, height);

      const isTalking = this.isListening || (this.synth && this.synth.speaking);
      const amplitude = isTalking ? 8 : 2;
      const frequency = isTalking ? 0.2 : 0.05;

      this.waveCtx.beginPath();
      this.waveCtx.strokeStyle = isTalking ? '#06b6d4' : '#64748b';
      this.waveCtx.lineWidth = 2;

      for (let x = 0; x < width; x++) {
        const y = height / 2 + Math.sin(x * frequency + step) * amplitude;
        if (x === 0) {
          this.waveCtx.moveTo(x, y);
        } else {
          this.waveCtx.lineTo(x, y);
        }
      }
      this.waveCtx.stroke();
      step += isTalking ? 0.2 : 0.04;

      this.animationId = requestAnimationFrame(renderWave);
    };

    renderWave();
  }
}

window.NexusVoiceAssistant = NexusVoiceAssistant;

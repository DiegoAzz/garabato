/**
 * Motor de Audio y Síntesis de GARABATO FEST 3D (v2.1 Robusto)
 * - Base rítmica completa de discoteca (Kick, Snare, Hi-hat, Funky Bassline, Melodía Lead)
 * - Analizador de frecuencias en tiempo real (reactividad de luces y bocinas)
 * - Modo A: Voz cómica con Web Speech API optimizada para Chrome + Vocoder Synth Fallback
 * - Modo B: Canción completa con melodía de sintetizador o archivo importado (MP3/WebM)
 * - Desbloqueo universal de audio y compatibilidad con autoplay en navegadores
 */

/**
 * Limpieza profunda de texto para síntesis de voz (TTS).
 * Elimina comillas angulares (« »), comillas simples/dobles, guiones largos,
 * puntos suspensivos hablados, dos puntos, emojis y caracteres especiales
 * para que la voz del navegador lea 100% LIMPIO como un humano sin pronunciar símbolos.
 */
export function cleanSpokenText(text) {
  if (!text) return '';
  return String(text)
    // 1. Eliminar comillas angulares (« »), comillas curvas y rectas
    .replace(/[«»"“‘’”`]/g, '')
    // 2. Eliminar guiones largos, medios y rayas (TTS suele decir "raya" o "guión")
    .replace(/[—–_]/g, ' ')
    // 3. Puntos suspensivos: convertirlos en punto simple (hace pausa natural sin decir "puntos suspensivos")
    .replace(/\.{2,}/g, '.')
    .replace(/…/g, '.')
    // 4. Dos puntos y punto y coma: sustituir por coma para pausar sin decir "dos puntos"
    .replace(/[:;]/g, ', ')
    // 5. Corchetes, paréntesis, barras, numerales, asteriscos y arrobas
    .replace(/[()[\]{}<>@#$%^&*~|\\\/+=]/g, ' ')
    // 6. Eliminar emojis (para que no diga "cara de risa", "tomate", etc.)
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, '')
    // 7. Normalizar signos de exclamación e interrogación repetidos
    .replace(/¡+/g, '¡')
    .replace(/!+/g, '!')
    .replace(/¿+/g, '¿')
    .replace(/\?+/g, '?')
    // 8. Normalizar espacios
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Limpieza para subtítulos visuales compactos y legibles
 */
export function cleanSubtitleText(text) {
  if (!text) return '';
  return String(text)
    .replace(/[«»"]/g, '')
    .replace(/—/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.dataArray = null;

    // Estado del sintetizador de ritmo procedural
    this.isPlayingBeat = false;
    this.bpm = 126;
    this.beatTimer = null;
    this.currentStep = 0;

    // Ganancias de canales
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    // Modo B: Canción importada
    this.audioElement = null;
    this.audioSourceNode = null;
    this.isPlayingImported = false;

    // Estado de voz cómica y melodía
    this.isSpeaking = false;
    this.vocalAmplitude = 0;
    this.speechUtterance = null;
    this.speechVoices = [];
    this.activeUtterances = new Set();
    this.keepAliveInterval = null;

    // Frecuencias analizadas para reactividad visual
    this.audioLevels = {
      bass: 0,
      mid: 0,
      treble: 0,
      overall: 0
    };

    // Melodía disco cartoon procedural (notas en Hz)
    // C4, E4, G4, A4, G4, E4, D4, C4...
    this.melodyNotes = [
      261.63, 0, 329.63, 0, 392.00, 440.00, 392.00, 0,
      329.63, 0, 293.66, 0, 261.63, 329.63, 392.00, 523.25
    ];

    // ==========================================
    // MÚSICA DE FONDO SUAVE PARA CONTAR CUENTOS (STAND-UP LOUNGE)
    // ==========================================
    this.bgMusicPlaying = false;
    this.bgMusicVolume = 0.28; // Volumen suave, agradable y relajante
    this.bgMusicPreset = 'lounge'; // 'lounge' (Jazz club suave), 'bossa' (Bossa acústico), 'piano' (Pianito íntimo), 'off'
    this.bgMusicGain = null;
    this.bgMusicTimer = null;
    this.bgMusicStep = 0;
    this.bgBpm = 82; // Tempo relajado, tranquilo y elegante para narración
    this.autoDuckingEnabled = true; // Baja el volumen automáticamente cuando habla el comediante

    this.initSpeech();
  }

  initContext() {
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        this.ctx = new AudioContextClass();

        // Ganancias principales (volumen alto y claro)
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        // Canal dedicado a música de fondo suave (Lounge / Cuentos)
        this.bgMusicGain = this.ctx.createGain();
        this.bgMusicGain.gain.setValueAtTime(this.bgMusicVolume, this.ctx.currentTime);
        this.bgMusicGain.connect(this.musicGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        // Analizador FFT
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }

      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (err) {
      console.warn('[AudioEngine] Error al inicializar AudioContext:', err);
    }
  }

  initSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        try {
          this.speechVoices = window.speechSynthesis.getVoices();
        } catch (e) {}
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  // ==========================================
  // SINTETIZADOR DE CANCIÓN Y RITMO PROCEDURAL
  // ==========================================
  startDiscoBeat() {
    this.initContext();
    if (this.isPlayingBeat) return;
    this.isPlayingBeat = true;
    this.currentStep = 0;

    const stepInterval = (60 / this.bpm / 4) * 1000; // semicorcheas

    this.beatTimer = setInterval(() => {
      this.playBeatStep(this.currentStep);
      this.currentStep = (this.currentStep + 1) % 16;
    }, stepInterval);
  }

  stopDiscoBeat() {
    this.isPlayingBeat = false;
    if (this.beatTimer) {
      clearInterval(this.beatTimer);
      this.beatTimer = null;
    }
  }

  playBeatStep(step) {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    const now = this.ctx.currentTime;

    // 1. Bombo (Kick Drum) potente en pasos 0, 4, 8, 12
    if (step % 4 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.start(now);
      osc.stop(now + 0.22);
    }

    // 2. Caja (Snare) en pasos 4 y 12
    if (step === 4 || step === 12) {
      this.playSnare(now);
    }

    // 3. Hi-hat a contratiempo en pasos 2, 6, 10, 14
    if (step % 4 === 2) {
      this.playNoiseHat(now, 0.07, 0.45);
    }

    // 4. Bajo funky (Bassline) en pasos pares
    const bassNotes = [65.41, 65.41, 77.78, 65.41, 87.31, 65.41, 77.78, 98.00];
    if (step % 2 === 0) {
      const noteFreq = bassNotes[(step / 2) % bassNotes.length];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(500, now);

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(noteFreq, now);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicGain);

      bassGain.gain.setValueAtTime(0.5, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

      bassOsc.start(now);
      bassOsc.stop(now + 0.16);
    }

    // 5. Melodía Lead de sintetizador disco cartoon
    const leadFreq = this.melodyNotes[step % this.melodyNotes.length];
    if (leadFreq > 0) {
      this.playLeadNote(leadFreq, now);
    }

    // 6. Acordes de sintetizador en pasos 0 y 8
    if (step === 0 || step === 8) {
      this.playSynthChord(now);
    }
  }

  playLeadNote(freq, time) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, time);

    gain.gain.setValueAtTime(0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.22);

    // Si no hay voz activa, el lead anima ligeramente la boca
    if (!this.isSpeaking) {
      this.vocalAmplitude = 0.5;
    }
  }

  playSnare(time) {
    if (!this.ctx) return;
    // Ruido blanco filtrado + tono rápido
    this.playNoiseHat(time, 0.15, 0.6);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(60, time + 0.1);
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  playNoiseHat(time, duration, volume) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    whiteNoise.start(time);
  }

  playSynthChord(time) {
    if (!this.ctx) return;
    const freqs = [261.63, 329.63, 392.0]; // Acorde Do Mayor
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, time);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, time);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + 0.35);
    });
  }

  /**
   * Pista de baile para la orden ¡A BAILAR!
   * Enciende el ritmo disco fiestero y bailable de 128 BPM con bajo y bombo durante X segundos
   */
  startPartyDanceTrack(durationSeconds = 8.0, onComplete = null) {
    this.initContext();
    const wasLounge = this.bgMusicPlaying;
    if (wasLounge) this.stopComedyLoungeMusic();

    this.bpm = 128;
    this.startDiscoBeat();

    setTimeout(() => {
      this.stopDiscoBeat();
      this.playCheer();
      this.playCrowdApplause(4.0);
      if (wasLounge) {
        setTimeout(() => this.startComedyLoungeMusic(this.bgMusicPreset), 800);
      }
      if (onComplete) onComplete();
    }, durationSeconds * 1000);
  }

  /**
   * Acompañamiento musical armónico para la orden ¡A CANTAR!
   * Genera acordes melódicos rítmicos de piano y percusión ligera mientras el actor canta
   */
  startSingingAccompaniment(durationSeconds = 9.0, onComplete = null) {
    this.initContext();
    if (!this.ctx) {
      if (onComplete) onComplete();
      return () => {};
    }

    const wasLounge = this.bgMusicPlaying;
    if (wasLounge) this.stopComedyLoungeMusic();

    let step = 0;
    // Progresión melódica clásica pegajosa: C -> G -> Am -> F
    const chords = [
      [261.63, 329.63, 392.00, 523.25], // C
      [196.00, 246.94, 293.66, 392.00], // G
      [220.00, 261.63, 329.63, 440.00], // Am
      [174.61, 220.00, 261.63, 349.23]  // F
    ];

    const timer = setInterval(() => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chordIdx = Math.floor(step / 4) % chords.length;
      const chord = chords[chordIdx];

      // Acordes melódicos alegres
      chord.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + 0.38);
      });

      // Ritmo de bombo y shaker
      if (step % 2 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(130, now);
        kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
        kickGain.gain.setValueAtTime(0.35, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.14);
      } else {
        this.playNoiseHat(now, 0.08, 0.22);
      }

      step++;
    }, 280);

    const stopFn = () => {
      clearInterval(timer);
      if (this.ctx) {
        const now = this.ctx.currentTime;
        [261.63, 329.63, 392.00, 523.25].forEach(f => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
          osc.connect(gain);
          gain.connect(this.musicGain);
          osc.start(now);
          osc.stop(now + 1.2);
        });
      }
      if (wasLounge) {
        setTimeout(() => this.startComedyLoungeMusic(this.bgMusicPreset), 600);
      }
      if (onComplete) onComplete();
    };

    setTimeout(stopFn, durationSeconds * 1000);
    return stopFn;
  }

  // ==========================================
  // MODO A: VOZ CÓMICA (Web Speech API + Chrome Fix)
  // ==========================================
  speakLyrics(text, options = {}, onEndCallback = null) {
    this.initContext();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('[AudioEngine] Síntesis de voz no disponible');
      if (onEndCallback) onEndCallback();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const voiceCfg = this.getVoiceSettings();
      const voice = options.voice || this.getBestSpanishVoice();
      const utterance = new SpeechSynthesisUtterance(text);
      if (voice) utterance.voice = voice;
      utterance.lang = (voice && voice.lang) || options.lang || 'es-ES';
      utterance.pitch = options.pitch !== undefined ? options.pitch : voiceCfg.pitch;
      utterance.rate = options.rate !== undefined ? options.rate : voiceCfg.rate;
      utterance.volume = 1.0;

      this.isSpeaking = true;
      this.speechUtterance = utterance;

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.vocalAmplitude = 0.9;
      };

      utterance.onboundary = () => {
        this.vocalAmplitude = 0.85 + Math.random() * 0.15;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.vocalAmplitude = 0;
        if (onEndCallback) onEndCallback();
      };

      utterance.onerror = (e) => {
        console.warn('[AudioEngine] Evento onerror en SpeechSynthesis', e);
        this.isSpeaking = false;
        this.vocalAmplitude = 0;
        if (onEndCallback) onEndCallback();
      };

      window.speechSynthesis.speak(utterance);

      // Despertar Chrome SpeechSynthesis si se duerme
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (err) {
      console.warn('[AudioEngine] Excepción en speakLyrics:', err);
      this.isSpeaking = false;
      this.vocalAmplitude = 0;
      if (onEndCallback) onEndCallback();
    }
  }

  /**
   * Keep-Alive para Chrome/Edge: Previene que SpeechSynthesis se pause
   * o se congele automáticamente después de 15 segundos en cuentos largos.
   */
  startSpeechKeepAlive() {
    this.stopSpeechKeepAlive();
    this.keepAliveInterval = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    }, 2000);
  }

  stopSpeechKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  /**
   * Divide cuentos largos en fragmentos naturales por oraciones o comas (máx 90 caracteres)
   * Limpia totalmente cualquier carácter que el sintetizador pueda vocalizar (« », —, ..., dos puntos, etc.)
   * y produce subtítulos limpios, breves y cómodos de leer al ritmo de la voz.
   */
  splitTextIntoChunks(text, maxChunkLen = 90) {
    if (!text) return [];
    // Limpieza profunda de caracteres no deseados en la voz
    const clean = cleanSpokenText(text);

    if (clean.length <= maxChunkLen) {
      return [clean];
    }

    // Dividir por signos de puntuación naturales (. ? ! \n)
    const sentenceDelim = /([.?!]+)/g;
    const parts = clean.split(sentenceDelim);
    const rawSentences = [];
    for (let i = 0; i < parts.length; i += 2) {
      const sentence = ((parts[i] || '') + (parts[i + 1] || '')).trim();
      if (sentence) rawSentences.push(sentence);
    }

    const chunks = [];
    let currentChunk = '';

    for (const sentence of rawSentences) {
      const candidate = currentChunk ? `${currentChunk} ${sentence}` : sentence;
      if (candidate.length <= maxChunkLen) {
        currentChunk = candidate;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
        }

        // Si una sola oración excede maxChunkLen, subdividir por comas
        if (sentence.length > maxChunkLen) {
          const subParts = sentence.split(/([,]+)/g);
          let subSentence = '';
          for (let s = 0; s < subParts.length; s += 2) {
            const piece = ((subParts[s] || '') + (subParts[s + 1] || '')).trim();
            if (!piece) continue;
            const subCandidate = subSentence ? `${subSentence} ${piece}` : piece;
            if (subCandidate.length <= maxChunkLen) {
              subSentence = subCandidate;
            } else {
              if (subSentence) chunks.push(subSentence);
              subSentence = piece;
            }
          }
          if (subSentence) currentChunk = subSentence;
        } else {
          currentChunk = sentence;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.length > 0 ? chunks : [clean];
  }

  /**
   * Reproduce secuencialmente una lista de fragmentos de voz garantizando:
   * 1. Protección contra el Garbage Collector de Chrome (activeUtterances).
   * 2. Despertador Keep-Alive para que historias largas de minutos enteros no se corten.
   * 3. Animación facial y modulación fluida.
   */
  speakChunksSequence(chunks, options = {}, onChunkStart = null, onComplete = null) {
    if (!chunks || chunks.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    let currentIndex = 0;
    this.startSpeechKeepAlive();

    const playNext = () => {
      if (currentIndex >= chunks.length) {
        this.stopSpeechKeepAlive();
        this.isSpeaking = false;
        this.vocalAmplitude = 0;
        if (onComplete) onComplete();
        return;
      }

      const chunkText = chunks[currentIndex];
      currentIndex++;

      const utterance = new SpeechSynthesisUtterance(chunkText);
      const voiceCfg = this.getVoiceSettings();
      const voice = options.voice || this.getBestSpanishVoice();
      if (voice) utterance.voice = voice;
      utterance.pitch = options.pitch !== undefined ? options.pitch : voiceCfg.pitch;
      utterance.rate = options.rate !== undefined ? options.rate : voiceCfg.rate;
      utterance.lang = (voice && voice.lang) || 'es-ES';

      // Referencia fuerte permanente para evitar que el Garbage Collector destruya la voz
      this.activeUtterances.add(utterance);

      let chunkFinished = false;
      let watchdogTimer = null;

      const advanceNext = () => {
        if (chunkFinished) return;
        chunkFinished = true;
        clearTimeout(watchdogTimer);
        this.activeUtterances.delete(utterance);
        setTimeout(playNext, 80);
      };

      // Watchdog generoso de seguridad para evitar bloqueos si Chrome falla onend, sin cortar la narración natural
      const maxChunkTimeMs = Math.max(16000, chunkText.length * 280);
      watchdogTimer = setTimeout(() => {
        advanceNext();
      }, maxChunkTimeMs);

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.vocalAmplitude = 0.85;
        if (onChunkStart) onChunkStart(chunkText, currentIndex - 1, chunks.length);
      };

      utterance.onboundary = () => {
        this.vocalAmplitude = 0.85 + Math.random() * 0.15;
      };

      utterance.onend = () => {
        advanceNext();
      };

      utterance.onerror = (err) => {
        console.warn('[AudioEngine] Warning en chunk utterance:', err);
        advanceNext();
      };

      window.speechSynthesis.speak(utterance);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    };

    playNext();
  }

  stopSpeech() {
    this.stopSpeechKeepAlive();
    this.activeUtterances.clear();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.vocalAmplitude = 0;
  }

  // ==========================================
  // MÚSICA DE FONDO SUAVE PARA ECHAR LOS CUENTOS (STAND-UP LOUNGE & JAZZ CAFÉ)
  // ==========================================
  startComedyLoungeMusic(preset = 'lounge') {
    this.initContext();
    if (preset === 'off') {
      this.stopComedyLoungeMusic();
      return;
    }
    this.bgMusicPreset = preset || 'lounge';
    if (this.bgMusicPlaying) return;
    this.bgMusicPlaying = true;
    this.bgMusicStep = 0;

    const stepInterval = (60 / this.bgBpm / 4) * 1000; // semicorcheas a 82 BPM (~183ms)

    this.bgMusicTimer = setInterval(() => {
      this.playComedyMusicStep(this.bgMusicStep);
      this.bgMusicStep = (this.bgMusicStep + 1) % 128; // ciclo de 8 compases
    }, stepInterval);
  }

  stopComedyLoungeMusic() {
    this.bgMusicPlaying = false;
    if (this.bgMusicTimer) {
      clearInterval(this.bgMusicTimer);
      this.bgMusicTimer = null;
    }
  }

  setBgMusicVolume(vol) {
    this.bgMusicVolume = Math.max(0, Math.min(1, vol));
    if (this.bgMusicGain && this.ctx) {
      const actualGain = this.isSpeaking ? (this.bgMusicVolume * 0.18) : this.bgMusicVolume;
      this.bgMusicGain.gain.setValueAtTime(actualGain, this.ctx.currentTime);
    }
  }

  setBgMusicPreset(preset) {
    this.bgMusicPreset = preset;
    if (preset === 'off') {
      this.stopComedyLoungeMusic();
    } else if (!this.bgMusicPlaying) {
      this.startComedyLoungeMusic(preset);
    }
  }

  playComedyMusicStep(step) {
    if (!this.ctx || !this.bgMusicGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;
    const bar = Math.floor(step / 16);
    const beatStep = step % 16;

    // Armonía Stand-up Lounge (8 compases cálidos y agradables):
    // Cmaj9 -> Am9 -> Dm9 -> G13 -> Em7 -> A7b9 -> Dm9 -> G7#5
    const jazzChords = [
      [261.63, 329.63, 392.00, 493.88, 587.33], // Cmaj9: C4, E4, G4, B4, D5
      [220.00, 261.63, 329.63, 392.00, 493.88], // Am9:   A3, C4, E4, G4, B4
      [293.66, 349.23, 440.00, 523.25, 659.25], // Dm9:   D4, F4, A4, C5, E5
      [196.00, 349.23, 493.88, 659.25, 880.00], // G13:   G3, F4, B4, E5, A5
      [164.81, 329.63, 392.00, 493.88, 587.33], // Em7:   E3, E4, G4, B4, D5
      [220.00, 349.23, 440.00, 554.37, 783.99], // A7b9:  A3, F4, A4, C#5, G5
      [293.66, 349.23, 440.00, 523.25, 659.25], // Dm9:   D4, F4, A4, C5, E5
      [196.00, 349.23, 493.88, 622.25, 783.99]  // G7#5:  G3, F4, B4, D#5, G5
    ];

    const currentChord = jazzChords[bar % jazzChords.length];

    // 1. MODO: STAND-UP JAZZ LOUNGE (Predeterminado - Acústico y muy suave)
    if (this.bgMusicPreset === 'lounge') {
      // Comping de piano Rhodes en beats 1, 2.5 y 4
      if (beatStep === 0) {
        this.playWarmRhodesChord(currentChord, now, 0.9, 0.22);
      } else if (beatStep === 6) {
        this.playWarmRhodesChord(currentChord, now, 0.5, 0.14);
      } else if (beatStep === 12) {
        this.playWarmRhodesChord(currentChord, now, 0.6, 0.16);
      }

      // Walking Bass acústico suave (sin retumbe)
      const bassNotes = [
        [65.41, 98.00, 82.41, 98.00],    // C2, G2, E2, G2
        [110.00, 82.41, 65.41, 82.41],   // A2, E2, C2, E2
        [73.42, 110.00, 87.31, 110.00],  // D2, A2, F2, A2
        [98.00, 73.42, 87.31, 123.47],   // G2, D2, F2, B2
        [82.41, 123.47, 98.00, 123.47],  // E2, B2, G2, B2
        [110.00, 82.41, 98.00, 138.59],  // A2, E2, G2, C#3
        [73.42, 110.00, 65.41, 73.42],   // D2, A2, C2, D2
        [98.00, 123.47, 155.56, 98.00]   // G2, B2, D#3, G2
      ];
      if (beatStep % 4 === 0) {
        const beatIndex = Math.floor(beatStep / 4);
        const freq = bassNotes[bar % bassNotes.length][beatIndex];
        this.playSoftUprightBass(freq, now, 0.38, 0.22);
      }

      // Escobilla / Shaker jazzero suave con swing (sin golpes fuertes)
      if (beatStep % 2 === 0) {
        const isAccent = (beatStep === 4 || beatStep === 12);
        this.playSoftBrushShaker(now, 0.06, isAccent ? 0.04 : 0.02);
      }

      // Chasquido sutil de madera en beats 2 y 4
      if (beatStep === 4 || beatStep === 12) {
        this.playSoftWoodTick(now, 0.03);
      }

    } else if (this.bgMusicPreset === 'bossa') {
      // 2. MODO: BOSSA CAFÉ (Guitarra suave y ritmo sincopado relajado)
      if (beatStep === 0 || beatStep === 3 || beatStep === 6 || beatStep === 10 || beatStep === 14) {
        this.playWarmRhodesChord(currentChord, now, 0.55, 0.18, true);
      }
      if (beatStep === 0 || beatStep === 8) {
        const roots = [65.41, 110.00, 73.42, 98.00, 82.41, 110.00, 73.42, 98.00];
        const rootBass = roots[bar % 8];
        const freq = beatStep === 0 ? rootBass : rootBass * 1.5;
        this.playSoftUprightBass(freq, now, 0.42, 0.20);
      }
      if (beatStep % 2 === 0) {
        this.playSoftBrushShaker(now, 0.05, 0.025);
      }

    } else if (this.bgMusicPreset === 'piano') {
      // 3. MODO: PIANO ÍNTIMO (Solo acordes sostenidos de piano dulce, sin percusión)
      if (beatStep === 0) {
        this.playWarmRhodesChord(currentChord, now, 1.9, 0.25);
      } else if (beatStep === 8) {
        this.playWarmRhodesChord(currentChord.slice(1), now, 1.2, 0.16);
      }
    } else if (this.bgMusicPreset === 'merengue') {
      // 4. MODO: MERENGUE TÍPICO / RIPIAO (Güira rápida, tambora y acordeón dominicano)
      this.playSoftBrushShaker(now, 0.04, (beatStep % 4 === 2 || beatStep % 4 === 0) ? 0.06 : 0.03);
      if (beatStep % 4 === 2) {
        this.playSoftWoodTick(now, 0.06);
      } else if (beatStep % 4 === 0) {
        this.playSoftUprightBass(98.00, now, 0.12, 0.26);
      }
      const merengueRoots = [65.41, 73.42, 98.00, 65.41];
      const mBass = merengueRoots[bar % merengueRoots.length];
      if (beatStep === 2 || beatStep === 6 || beatStep === 10 || beatStep === 14) {
        this.playSoftUprightBass(mBass, now, 0.16, 0.24);
      }
      if (beatStep === 0 || beatStep === 3 || beatStep === 6 || beatStep === 8 || beatStep === 11 || beatStep === 14) {
        this.playWarmRhodesChord(currentChord.slice(0, 3), now, 0.18, 0.18, false);
      }
    }
  }

  playWarmRhodesChord(freqArray, time, duration = 0.8, volume = 0.2, isGuitarTone = false) {
    if (!this.ctx || !this.bgMusicGain) return;
    freqArray.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = isGuitarTone ? 'triangle' : (idx % 2 === 0 ? 'sine' : 'triangle');
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isGuitarTone ? 1300 : 920, time);
      filter.Q.setValueAtTime(0.8, time);

      const noteVol = (volume / freqArray.length) * (1.1 - idx * 0.08);
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(noteVol, time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgMusicGain);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    });
  }

  playSoftUprightBass(freq, time, duration = 0.35, volume = 0.22) {
    if (!this.ctx || !this.bgMusicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgMusicGain);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  playSoftBrushShaker(time, duration = 0.06, volume = 0.03) {
    if (!this.ctx || !this.bgMusicGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(5400, time);
    filter.Q.setValueAtTime(1.8, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgMusicGain);

    source.start(time);
    source.stop(time + duration);
  }

  playSoftWoodTick(time, volume = 0.03) {
    if (!this.ctx || !this.bgMusicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, time);
    osc.frequency.exponentialRampToValueAtTime(300, time + 0.025);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.Q.setValueAtTime(3.0, time);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgMusicGain);

    osc.start(time);
    osc.stop(time + 0.03);
  }

  // ==========================================
  // MODO B: CANCIÓN IMPORTADA O PISTA INSTRUMENTAL
  // ==========================================
  playTrackBlob(blob, onEnd = null) {
    this.stopDiscoBeat();
    this.stopSpeech();
    this.stopImportedSong();
    this.initContext();

    const url = URL.createObjectURL(blob);
    this.audioElement = new Audio(url);
    this.audioElement.crossOrigin = 'anonymous';

    try {
      this.audioSourceNode = this.ctx.createMediaElementSource(this.audioElement);
      this.audioSourceNode.connect(this.musicGain);
    } catch (e) {
      console.warn('[AudioEngine] Error conectando MediaElementSource:', e);
    }

    this.isPlayingImported = true;
    this.audioElement.currentTime = 0;
    const playPromise = this.audioElement.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        console.warn('[AudioEngine] Autoplay bloqueado por el navegador (requiere interacción):', e);
        const unlockBtn = document.getElementById('btn-unlock-audio');
        if (unlockBtn) unlockBtn.classList.remove('hidden');
      });
    }

    this.audioElement.onended = () => {
      this.isPlayingImported = false;
      if (onEnd) onEnd();
    };
  }

  loadAudioFile(file, onLoaded) {
    this.initContext();
    if (this.audioElement) {
      this.audioElement.pause();
    }

    const url = URL.createObjectURL(file);
    this.audioElement = new Audio(url);
    this.audioElement.crossOrigin = 'anonymous';

    try {
      if (this.audioSourceNode) {
        this.audioSourceNode.disconnect();
      }
      this.audioSourceNode = this.ctx.createMediaElementSource(this.audioElement);
      this.audioSourceNode.connect(this.musicGain);
    } catch (e) {
      console.warn('[AudioEngine] Error conectando elemento de audio:', e);
    }

    this.audioElement.onloadedmetadata = () => {
      if (onLoaded) onLoaded(this.audioElement.duration);
    };

    this.audioElement.onended = () => {
      this.isPlayingImported = false;
    };
  }

  playImportedSong(onEnd) {
    this.initContext();
    if (this.audioElement) {
      this.isPlayingImported = true;
      this.audioElement.currentTime = 0;
      this.audioElement.play().catch(e => console.warn('Autoplay bloqueado', e));
      if (onEnd) {
        this.audioElement.onended = () => {
          this.isPlayingImported = false;
          onEnd();
        };
      }
    } else {
      // Si no hay archivo cargado en Modo B, reproducir la base disco completa
      this.startDiscoBeat();
      setTimeout(() => {
        if (onEnd) onEnd();
      }, 15000);
    }
  }

  stopImportedSong() {
    this.isPlayingImported = false;
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement.src = '';
      this.audioElement = null;
    }
    if (this.audioSourceNode) {
      try {
        this.audioSourceNode.disconnect();
      } catch (e) {}
      this.audioSourceNode = null;
    }
  }

  // ==========================================
  // EFECTOS DE SONIDO PROCEDURALES (SFX)
  // ==========================================
  playSquish() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Sonido cómico de tomate estrellándose (wet cartoon squish)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.12);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  playPainOuch() {
    this.initContext();
    if (!this.ctx) return;
    this.playSquish();
    const now = this.ctx.currentTime;
    // Quejido cómico de dolor cartoon ("¡OUCH / AGH!")
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.25);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.linearRampToValueAtTime(450, now + 0.25);
    filter.Q.setValueAtTime(3.5, now);

    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.26);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  playWhooshRocket() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Silbido cómico de cohete despegando
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.8);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.85);
  }

  playAirhorn() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Claxon de concierto DJ (Airhorn de 3 ráfagas)
    const tones = [0, 0.11, 0.22];
    tones.forEach((delay) => {
      const t = now + delay;
      [466.16, 470.0, 587.33].forEach((f) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.09);
      });
    });
  }

  playCoinChime() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Campanilla mágica de regalo TikTok
    [987.77, 1318.51].forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.08);
      gain.gain.setValueAtTime(0.35, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  }

  playCheer() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.05);
      gain.gain.setValueAtTime(0.25, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.45);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.45);
    });
  }

  /**
   * Reproduce 5 segundos de aplausos masivos, vítores y silbidos del público
   */
  playCrowdApplause(durationSeconds = 5.0) {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const dur = Math.max(1.0, durationSeconds);

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      const pink = (lastOut + (0.02 * white)) / 1.02;
      lastOut = pink;
      const burst = Math.random() < 0.09 ? (Math.random() * 1.8) : 0.65;
      data[i] = pink * burst;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1400, now);
    bandpass.Q.setValueAtTime(1.2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.48, now + 0.35);
    gain.gain.setValueAtTime(0.48, now + dur - 0.9);
    gain.gain.linearRampToValueAtTime(0.001, now + dur);

    noiseSource.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.sfxGain);

    noiseSource.start(now);
    noiseSource.stop(now + dur);

    // Silbidos del público durante la ovación
    const whistleTimes = [0.35, 1.25, 2.2, 3.1];
    whistleTimes.forEach(tOffset => {
      if (tOffset + 0.55 < dur) {
        const wOsc = this.ctx.createOscillator();
        const wGain = this.ctx.createGain();
        wOsc.type = 'sine';
        const startFreq = 1600 + Math.random() * 600;
        wOsc.frequency.setValueAtTime(startFreq, now + tOffset);
        wOsc.frequency.linearRampToValueAtTime(startFreq + 550, now + tOffset + 0.25);
        wOsc.frequency.linearRampToValueAtTime(startFreq + 100, now + tOffset + 0.55);

        wGain.gain.setValueAtTime(0.001, now + tOffset);
        wGain.gain.linearRampToValueAtTime(0.12, now + tOffset + 0.1);
        wGain.gain.linearRampToValueAtTime(0.001, now + tOffset + 0.55);

        wOsc.connect(wGain);
        wGain.connect(this.sfxGain);
        wOsc.start(now + tOffset);
        wOsc.stop(now + tOffset + 0.55);
      }
    });

    this.playCheer();
  }

  /**
   * Reproduce un archivo de audio como efecto de sonido secundario (ej. pista de aplausos)
   */
  playSfxBlob(blob, maxDurationMs = 5000) {
    this.initContext();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';

    try {
      const source = this.ctx.createMediaElementSource(audio);
      source.connect(this.sfxGain);
    } catch (e) {}

    audio.currentTime = 0;
    audio.play().catch(() => {});

    setTimeout(() => {
      audio.pause();
      audio.src = '';
    }, maxDurationMs);
  }

  playComicalFall() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.35);

    setTimeout(() => {
      if (!this.ctx) return;
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thud.frequency.setValueAtTime(100, this.ctx.currentTime);
      thud.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.22);
      thudGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      thudGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
      thud.connect(thudGain);
      thudGain.connect(this.sfxGain);
      thud.start();
      thud.stop(this.ctx.currentTime + 0.22);
    }, 320);
  }

  playRecordScratch() {
    this.initContext();
    if (!this.ctx) return;
    this.playNoiseHat(this.ctx.currentTime, 0.22, 0.6);
  }

  // ==========================================
  // EFECTOS DE STAND-UP COMEDY (HUMOR EN VIVO)
  // ==========================================

  /**
   * Redoble cómico de batería con remate de platillo: "¡Ba-dum-tss! 🥁"
   */
  playRimshot() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. "Ba" - Golpe sordo de bombo
    const kickOsc = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(160, now);
    kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.11);
    kickGain.gain.setValueAtTime(0.75, now);
    kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);
    kickOsc.connect(kickGain);
    kickGain.connect(this.sfxGain);
    kickOsc.start(now);
    kickOsc.stop(now + 0.11);

    // 2. "Dum" - Golpe seco de caja con rimshot
    const snareTime = now + 0.14;
    const snareOsc = this.ctx.createOscillator();
    const snareGain = this.ctx.createGain();
    snareOsc.type = 'triangle';
    snareOsc.frequency.setValueAtTime(260, snareTime);
    snareOsc.frequency.exponentialRampToValueAtTime(110, snareTime + 0.13);
    snareGain.gain.setValueAtTime(0.7, snareTime);
    snareGain.gain.exponentialRampToValueAtTime(0.01, snareTime + 0.13);
    snareOsc.connect(snareGain);
    snareGain.connect(this.sfxGain);
    snareOsc.start(snareTime);
    snareOsc.stop(snareTime + 0.13);

    this.playNoiseHat(snareTime, 0.12, 0.45);

    // 3. "Tsss!" - Platillo crash abierto y brillante
    const crashTime = now + 0.30;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.85);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.24));
    }
    const crashSource = this.ctx.createBufferSource();
    crashSource.buffer = buffer;

    const crashFilter = this.ctx.createBiquadFilter();
    crashFilter.type = 'highpass';
    crashFilter.frequency.setValueAtTime(5000, crashTime);

    const crashGain = this.ctx.createGain();
    crashGain.gain.setValueAtTime(0.65, crashTime);
    crashGain.gain.exponentialRampToValueAtTime(0.001, crashTime + 0.85);

    crashSource.connect(crashFilter);
    crashFilter.connect(crashGain);
    crashGain.connect(this.sfxGain);
    crashSource.start(crashTime);
    crashSource.stop(crashTime + 0.85);
  }

  /**
   * Carcajadas y risas grabadas del público estilo sitcom 😂
   */
  playSitcomLaughs(durationSeconds = 3.5) {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const dur = Math.max(1.5, durationSeconds);

    const laughPitches = [340, 420, 290, 480];
    laughPitches.forEach((baseFreq, pIdx) => {
      const pOffset = pIdx * 0.14;
      const count = 7;
      for (let i = 0; i < count; i++) {
        const hTime = now + pOffset + i * 0.15;
        if (hTime + 0.14 < now + dur) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';

          const pitch = baseFreq + Math.sin(i * 1.5) * 45;
          osc.frequency.setValueAtTime(pitch, hTime);
          osc.frequency.linearRampToValueAtTime(pitch - 35, hTime + 0.12);

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(750 + (i % 3) * 200, hTime);
          filter.Q.setValueAtTime(2.5, hTime);

          gain.gain.setValueAtTime(0.001, hTime);
          gain.gain.linearRampToValueAtTime(0.18, hTime + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, hTime + 0.12);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.sfxGain);

          osc.start(hTime);
          osc.stop(hTime + 0.13);
        }
      }
    });
  }

  /**
   * Abucheo cómico del público: "¡Boooo! 👎"
   */
  playComicalBoo() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const booNotes = [140, 148, 132];
    booNotes.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.08);
      osc.frequency.exponentialRampToValueAtTime(f * 0.72, now + 1.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(380, now);
      filter.Q.setValueAtTime(2.0, now);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.28, now + idx * 0.08 + 0.3);
      gain.gain.setValueAtTime(0.28, now + 1.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.08);
      osc.stop(now + 1.8);
    });
  }

  getVoiceSettings() {
    let pitch = 1.0;
    let rate = 1.02;
    let voiceURI = null;
    try {
      if (typeof localStorage !== 'undefined') {
        const p = localStorage.getItem('garabato_voice_pitch');
        const r = localStorage.getItem('garabato_voice_rate');
        const v = localStorage.getItem('garabato_voice_uri');
        if (p) pitch = parseFloat(p) || 1.0;
        if (r) rate = parseFloat(r) || 1.02;
        if (v) voiceURI = v;
      }
    } catch (e) {}
    return { pitch, rate, voiceURI };
  }

  setVoiceSettings(cfg) {
    if (!cfg) return;
    try {
      if (typeof localStorage !== 'undefined') {
        if (cfg.pitch !== undefined) localStorage.setItem('garabato_voice_pitch', cfg.pitch);
        if (cfg.rate !== undefined) localStorage.setItem('garabato_voice_rate', cfg.rate);
        if (cfg.voiceURI !== undefined) localStorage.setItem('garabato_voice_uri', cfg.voiceURI);
      }
    } catch (e) {}
  }

  /**
   * Obtiene la mejor voz profesional humana en español disponible en el navegador.
   * Prioridad:
   * 1. Voz guardada por el usuario en Admin
   * 2. Voces Colombianas / Latinoamericanas Naturales (Salome, Jorge, Gonzalo, Dalia, etc.)
   * 3. Voces de Google en español latino (Google español de Estados Unidos)
   * 4. Cualquier voz Natural/Online en español
   * 5. Voces masculinas/expresivas de Windows (Raul, Pablo, Sabina - descartando Helena)
   */
  getBestSpanishVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    if (!this.speechVoices || this.speechVoices.length === 0) {
      try {
        this.speechVoices = window.speechSynthesis.getVoices();
      } catch (e) {}
    }
    if (!this.speechVoices || this.speechVoices.length === 0) return null;

    const { voiceURI } = this.getVoiceSettings();
    if (voiceURI) {
      const match = this.speechVoices.find(v => v.voiceURI === voiceURI || v.name === voiceURI);
      if (match) return match;
    }

    // 1. Voces Colombianas / Latinoamericanas Naturales
    const latinNatural = this.speechVoices.find(v => {
      const name = (v.name || '').toLowerCase();
      const lang = (v.lang || '').toLowerCase();
      if (!lang.startsWith('es')) return false;
      const isNatural = name.includes('natural') || name.includes('online') || name.includes('neural');
      const isLatin = lang.includes('co') || lang.includes('mx') || lang.includes('419') || lang.includes('us') ||
                      name.includes('salome') || name.includes('jorge') || name.includes('dalia') || name.includes('gonzalo') || name.includes('camila') || name.includes('tomas');
      return isNatural && isLatin;
    });
    if (latinNatural) return latinNatural;

    // 2. Voces de Google en español latinoamericano (Google español de Estados Unidos)
    const googleLatin = this.speechVoices.find(v => {
      const name = (v.name || '').toLowerCase();
      const lang = (v.lang || '').toLowerCase();
      return lang.startsWith('es') && name.includes('google') && (lang.includes('us') || lang.includes('419') || lang.includes('mx') || name.includes('estados unidos'));
    });
    if (googleLatin) return googleLatin;

    // 3. Cualquier Google español
    const anyGoogle = this.speechVoices.find(v => {
      const name = (v.name || '').toLowerCase();
      const lang = (v.lang || '').toLowerCase();
      return lang.startsWith('es') && name.includes('google');
    });
    if (anyGoogle) return anyGoogle;

    // 4. Cualquier voz natural/online en español
    const anyNatural = this.speechVoices.find(v => {
      const name = (v.name || '').toLowerCase();
      const lang = (v.lang || '').toLowerCase();
      return lang.startsWith('es') && (name.includes('natural') || name.includes('online') || name.includes('neural'));
    });
    if (anyNatural) return anyNatural;

    // 5. Voces expresivas de Windows (Raul, Pablo, Sabina - descartando Helena)
    const expressiveWindows = this.speechVoices.find(v => {
      const name = (v.name || '').toLowerCase();
      const lang = (v.lang || '').toLowerCase();
      return lang.startsWith('es') && (name.includes('raul') || name.includes('pablo') || name.includes('sabina'));
    });
    if (expressiveWindows) return expressiveWindows;

    // 6. Cualquier voz en español que NO sea Helena
    const nonHelena = this.speechVoices.find(v => {
      const name = (v.name || '').toLowerCase();
      const lang = (v.lang || '').toLowerCase();
      return lang.startsWith('es') && !name.includes('helena');
    });
    if (nonHelena) return nonHelena;

    // 7. Cualquier voz en español
    const anyEs = this.speechVoices.find(v => v.lang && v.lang.toLowerCase().startsWith('es'));
    if (anyEs) return anyEs;

    return this.speechVoices[0] || null;
  }

  /**
   * Cuenta un chiste con cadencia profesional y timing cómico (pausa antes del remate).
   * Soporta historias largas sin límite de tiempo (utiliza chunking + keepalive anti-congelamiento).
   */
  speakJokeProfessional(setupText, punchlineText, options = {}, onEndCallback = null) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEndCallback) onEndCallback();
      return;
    }

    try {
      this.stopSpeech();

      const voiceCfg = this.getVoiceSettings();
      const voice = options.voice || this.getBestSpanishVoice();
      const pitch = options.pitch !== undefined ? options.pitch : voiceCfg.pitch;
      const rate = options.rate !== undefined ? options.rate : voiceCfg.rate;

      // Dividir historias largas en oraciones naturales de máximo 110 caracteres
      const setupChunks = this.splitTextIntoChunks(setupText, 110);
      const punchChunks = punchlineText ? this.splitTextIntoChunks(punchlineText, 110) : [];

      const setupOptions = { voice, pitch, rate };

      // 1. Narrar todo el planteamiento fragmento a fragmento
      this.speakChunksSequence(setupChunks, setupOptions, (chunk, idx, total) => {
        if (options.onSetupChunk) options.onSetupChunk(chunk, idx, total);
      }, () => {
        // Pausa cómica dramática antes del remate
        setTimeout(() => {
          if (punchChunks.length === 0) {
            this.playRimshot();
            this.playSitcomLaughs(3.5);
            if (onEndCallback) onEndCallback();
            return;
          }

          // 2. Remate cómico con cadencia cómplice y misma voz natural
          const punchOptions = {
            voice,
            pitch,
            rate: rate * 1.02
          };

          this.speakChunksSequence(punchChunks, punchOptions, (chunk, idx, total) => {
            if (options.onPunchChunk) options.onPunchChunk(chunk, idx, total);
          }, () => {
            // ¡Ba-dum-tss! + Risas del público al rematar el chiste
            this.playRimshot();
            this.playSitcomLaughs(3.5);
            if (onEndCallback) onEndCallback();
          });
        }, 550);
      });
    } catch (e) {
      console.warn('[AudioEngine] Error en speakJokeProfessional:', e);
      if (onEndCallback) onEndCallback();
    }
  }

  // ==========================================
  // EFECTOS DRAMÁTICOS DEL ACTOR (LLANTO, RABIETA, EJERCICIO, ESTATUA)
  // ==========================================

  /**
   * Llanto dramático cómico (violín melancólico + sollozos sintetizados)
   */
  playCryingDrama(duration = 4.0) {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Ondas oscilantes simulando sollozos cómicos (buaaa-buaaa)
    for (let i = 0; i < 5; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + i * 0.7;

      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.55);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.65);
    }
  }

  /**
   * Rabieta cómica (pisotones graves + silbato de vapor furioso)
   */
  playTantrumRage(duration = 3.5) {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Pisotones
    for (let i = 0; i < 6; i++) {
      const t = now + i * 0.35;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.18);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    }

    // Silbato agudo de tetera furiosa
    const whistle = this.ctx.createOscillator();
    const wGain = this.ctx.createGain();
    whistle.type = 'triangle';
    whistle.frequency.setValueAtTime(900, now + 0.5);
    whistle.frequency.linearRampToValueAtTime(1600, now + 2.2);
    wGain.gain.setValueAtTime(0.001, now + 0.5);
    wGain.gain.linearRampToValueAtTime(0.2, now + 1.0);
    wGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
    whistle.connect(wGain);
    wGain.connect(this.sfxGain);
    whistle.start(now + 0.5);
    whistle.stop(now + 2.5);
  }

  /**
   * Sonido de congelamiento / estatua (Campanas de hielo / freeze)
   */
  playFreezeChime() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.08;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 1.3);
    });
  }

  /**
   * Voz actoral dramática para peticiones del público e historias largas enviadas por chat/interno.
   * Utiliza división en fragmentos para que oraciones largas no se corten en Chrome.
   */
  speakActorLine(text, options = {}, onEndCallback = null) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEndCallback) onEndCallback();
      return;
    }

    try {
      this.stopSpeech();
      // Eliminar cualquier símbolo '@' para que la voz nunca pronuncie "arroba"
      const spokenText = String(text || '').replace(/@/g, '').trim();
      const chunks = this.splitTextIntoChunks(spokenText, 130);
      
      const lineOptions = {
        voice: options.voice || this.getBestSpanishVoice(),
        pitch: options.pitch || 1.1,
        rate: options.rate || 1.05
      };

      this.speakChunksSequence(chunks, lineOptions, (chunk, idx, total) => {
        if (options.onChunk) options.onChunk(chunk, idx, total);
      }, () => {
        if (onEndCallback) onEndCallback();
      });
    } catch (e) {
      if (onEndCallback) onEndCallback();
    }
  }

  // ==========================================
  // ACTUALIZACIÓN DE ENERGÍA Y ANÁLISIS POR FRAME
  // ==========================================
  update() {
    // Auto-Ducking: Bajar volumen suavemente de la música de fondo cuando habla el comediante
    if (this.autoDuckingEnabled && this.bgMusicGain && this.ctx && this.bgMusicPlaying) {
      const targetVol = this.isSpeaking ? (this.bgMusicVolume * 0.18) : this.bgMusicVolume;
      this.bgMusicGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.12);
    }

    if (this.isSpeaking) {
      this.vocalAmplitude = Math.max(0, this.vocalAmplitude - 0.04);
    } else if (this.isPlayingBeat) {
      this.vocalAmplitude = Math.max(0, this.vocalAmplitude - 0.05);
    }

    if (!this.analyser || !this.dataArray) {
      return this.audioLevels;
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;

    const count = this.dataArray.length;
    const bEnd = Math.max(1, Math.floor(count * 0.25));
    const mEnd = Math.max(bEnd + 1, Math.floor(count * 0.65));

    for (let i = 0; i < bEnd; i++) bassSum += this.dataArray[i];
    for (let i = bEnd; i < mEnd; i++) midSum += this.dataArray[i];
    for (let i = mEnd; i < count; i++) trebleSum += this.dataArray[i];

    this.audioLevels.bass = (bassSum / (bEnd * 255));
    this.audioLevels.mid = (midSum / ((mEnd - bEnd) * 255));
    this.audioLevels.treble = (trebleSum / ((count - mEnd) * 255));
    this.audioLevels.overall = (this.audioLevels.bass * 0.5 + this.audioLevels.mid * 0.3 + this.audioLevels.treble * 0.2);

    return this.audioLevels;
  }
}

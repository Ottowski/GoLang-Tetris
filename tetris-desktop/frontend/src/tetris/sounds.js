// Sound Manager using Web Audio API
export class SoundManager {
    constructor() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.connect(this.audioCtx.destination);

            // Load saved settings in volume/sound settings
            const savedVolume = localStorage.getItem('volume');
            const savedEnabled = localStorage.getItem('soundEnabled');

            this.masterGain.gain.value = savedVolume !== null ? Number(savedVolume) : 0.1;
            this.enabled = savedEnabled !== null ? savedEnabled === 'true' : true;

        } catch (e) {
            console.warn('Audio context initialization failed:', e);
            this.enabled = false;
            this.audioCtx = null;
            this.masterGain = null;
        }
    }

    /**
     * Play a single tone
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {string} waveType - 'sine', 'square', 'sawtooth', 'triangle'
     * @param {number} volume - Volume 0-1
     */
    playTone(frequency, duration = 0.1, waveType = 'sine', volume = 0.1) {
        if (!this.enabled || !this.audioCtx) return;

        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.frequency.value = frequency;
            osc.type = waveType;

            // Fade in and out
            gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

            osc.start(this.audioCtx.currentTime);
            osc.stop(this.audioCtx.currentTime + duration);
        } catch (e) {
            console.warn('Audio playback failed:', e);
        }
    }

    /**
     * Play multiple tones in sequence
     * @param {Array} tones - Array of {frequency, duration, waveType}
     */
    playSequence(tones) {
        let currentTime = 0;
        tones.forEach((tone) => {
            setTimeout(() => {
                this.playTone(tone.frequency, tone.duration || 0.1, tone.waveType || 'sine');
            }, currentTime * 1000);
            currentTime += tone.duration || 0.1;
        });
    }

    /**
     * Play block placement sound
     */
    playBlockPlace() {
        this.playTone(400, 0.05);
    }

    /**
     * Play line clear sound (ascending arpeggio)
     */
    playLineClear() {
        this.playSequence([
            { frequency: 600, duration: 0.1, waveType: 'sine' },
            { frequency: 800, duration: 0.1, waveType: 'square' },
        ]);
    }

    /**
     * Play game over sound (descending tones)
     */
    playGameOver() {
        this.playSequence([
            { frequency: 200, duration: 0.3, waveType: 'sine' },
            { frequency: 150, duration: 0.3, waveType: 'sine' },
        ]);
    }

    /**
     * Toggle sound on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', this.enabled);
        return this.enabled;
    }

    /**
     * Set master volume
     * @param {number} level - Volume 0-1
     */
    setVolume(level) {
        const v = Math.max(0, Math.min(1, level));
        this.masterGain.gain.value = v;
        localStorage.setItem('volume', v);
    }

    /**
     * Get current master volume
     * @returns {number}
     */
    getVolume() {
        return this.masterGain.gain.value;
    }
}

// Export singleton instance
export const soundManager = new SoundManager();
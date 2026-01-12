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
            const savedMusicEnabled = localStorage.getItem('musicEnabled');
            const savedMusicVolume = localStorage.getItem('musicVolume');

            this.masterGain.gain.value = savedVolume !== null ? Number(savedVolume) : 0.3;
            this.enabled = savedEnabled !== null ? savedEnabled === 'true' : true;
            this.musicEnabled = savedMusicEnabled !== null ? savedMusicEnabled === 'true' : true;
            this.musicVolume = savedMusicVolume !== null ? Number(savedMusicVolume) : 0.5;
            
            // Music volume multiplier to keep it quieter than sound effects
            this.musicVolumeMultiplier = 0.15;

            // Background music setup
            this.bgMusic = null;
            // Index of current music track
            this.currentMusicIndex = Math.floor(Math.random() * 3); // Start with random track
            this.musicTracks = [
                'music/chiptune-war-dance-217916.mp3',
                'music/level-iii-294428.mp3',
                'music/run-and-catch-x27em-full-version-retro-platform-game-music-442980.mp3'
            ];

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
    playTone(frequency, duration = 0.1, waveType = 'sine', volume = 0.3) {
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
        this.playTone(400, 0.05, 'sine', 0.4);
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
        this.updateMusicVolume(); // Update background music volume
    }

    /**
     * Get current master volume
     * @returns {number}
     */
    getVolume() {
        return this.masterGain.gain.value;
    }

    /**
     * Start playing background music
     */
    startBackgroundMusic() {
        if (!this.musicEnabled || this.bgMusic) {
            return;
        }

        this.bgMusic = new Audio(this.musicTracks[this.currentMusicIndex]);
        this.bgMusic.volume = this.musicVolume * this.musicVolumeMultiplier;
        this.bgMusic.loop = false;

        // When current track ends, play next track randomly
        this.bgMusic.addEventListener('ended', () => {
            // Select a different random track
            this.currentMusicIndex = Math.floor(Math.random() * this.musicTracks.length);
            this.stopBackgroundMusic();
            this.startBackgroundMusic();
        });

        this.bgMusic.play().catch(err => {
            console.warn('Background music playback failed:', err);
        });
    }

    /**
     * Stop background music
     */
    stopBackgroundMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
            this.bgMusic = null;
        }
    }

    /**
     * Pause background music
     */
    pauseBackgroundMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
        }
    }

    /**
     * Resume background music
     */
    resumeBackgroundMusic() {
        if (this.bgMusic && this.musicEnabled) {
            this.bgMusic.play().catch(err => {
                console.warn('Background music resume failed:', err);
            });
        }
    }

    /**
     * Toggle background music on/off
     */
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('musicEnabled', this.musicEnabled);
        
        if (this.musicEnabled) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
        
        return this.musicEnabled;
    }

    /**
     * Set music volume
     * @param {number} level - Volume 0-1
     */
    setMusicVolume(level) {
        const v = Math.max(0, Math.min(1, level));
        this.musicVolume = v;
        localStorage.setItem('musicVolume', v);
        if (this.bgMusic) {
            this.bgMusic.volume = v * this.musicVolumeMultiplier;
        }
    }

    /**
     * Get current music volume
     * @returns {number}
     */
    getMusicVolume() {
        return this.musicVolume;
    }

    /**
     * Update background music volume when master volume changes
     */
    updateMusicVolume() {
        if (this.bgMusic) {
            this.bgMusic.volume = this.musicVolume * this.musicVolumeMultiplier;
        }
    }
}

// Export singleton instance
export const soundManager = new SoundManager();
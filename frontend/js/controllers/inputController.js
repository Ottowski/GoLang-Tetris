export class InputController {
    constructor() {
        this.gameController = null;
        this.modalController = null;
        this.controlsEnabled = true;
    }

    // Initialize input listeners
    init() {
        document.addEventListener('keydown', (ev) => {
            this.handleKeyDown(ev);
        });
    }

    handleKeyDown(ev) {
        const tag = ev.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea') {
            // Allow keyboard input when in input text fields
            return;
        }

        // Block controls when modals are open
        if (this.modalController.isAnyModalOpen()) {
            return;
        }

        let messageControl = null;

        // Handle paused state - only allow unpausing
        if (this.gameController.isGamePaused()) {
            if (ev.key === 'p' || ev.key === 'P') {
                messageControl = { type: 'pause/resume' };
            } else {
                return; // Block everything but the pause key
            }
        } else {
            // Handle movement and rotation
            messageControl = this.getMovementControl(ev);
        }

        if (!messageControl) return;

        ev.preventDefault(); // Only block the default handled keys
        this.gameController.sendControlMessage(messageControl);
    }

    getMovementControl(ev) {
        // Arrow keys
        if (ev.key === 'ArrowLeft') return { type: 'move', dir: 'left' };
        if (ev.key === 'ArrowRight') return { type: 'move', dir: 'right' };
        if (ev.key === 'ArrowDown') return { type: 'move', dir: 'down' };
        if (ev.key === 'ArrowUp') return { type: 'rotate' };

        // WASD keys
        if (ev.key === 'a' || ev.key === 'A') return { type: 'move', dir: 'left' };
        if (ev.key === 'd' || ev.key === 'D') return { type: 'move', dir: 'right' };
        if (ev.key === 's' || ev.key === 'S') return { type: 'move', dir: 'down' };
        if (ev.key === 'w' || ev.key === 'W') return { type: 'rotate' };

        // Space to drop
        if (ev.code === 'Space') return { type: 'drop' };

        // Pausing game
        if (ev.key === 'p' || ev.key === 'P') return { type: 'pause/resume' };

        return null;
    }

    // Enable or disable controls
    setControlsEnabled(enabled) {
        this.controlsEnabled = enabled;
    }
}
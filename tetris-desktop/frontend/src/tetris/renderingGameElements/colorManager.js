// Manages color assignments for different Tetris piece types
export class ColorManager {
    // Returns the color associated with a given piece value
    static colorFor(v) {
        switch (v) {
            case 1: return '#00f0f0'; // I-piece (cyan)
            case 2: return '#f0f000'; // O-piece (yellow)
            case 3: return '#a000f0'; // T-piece (purple)
            case 4: return '#00f000'; // S-piece (green)
            case 5: return '#f00000'; // Z-piece (red)
            case 6: return '#0000f0'; // J-piece (blue)
            case 7: return '#f08000'; // L-piece (orange)
            case 8: return '#ff69b4'; // Special piece (hot pink)
            case 9: return '#00f000'; // Additional green variant
            case 10: return '#f0f000'; // Additional yellow variant
            case 11: return '#0000f0'; // Additional blue variant
            case 12: return '#f00000'; // Additional red variant
            default: return '#666'; // Default gray for unknown pieces
        }
    }
}
// Manages color assignments for different Tetris piece types
export class ColorManager {
    // Returns the color associated with a given piece value
    static colorFor(v) {
        switch (v) {
            case 1: return '#00d4d4'; // I-piece (bright cyan)
            case 2: return '#f0c000'; // O-piece (golden yellow)
            case 3: return '#b030f0'; // T-piece (vibrant purple)
            case 4: return '#00d400'; // S-piece (bright green)
            case 5: return '#f03030'; // Z-piece (bright red)
            case 6: return '#3050f0'; // J-piece (bright blue)
            case 7: return '#f08820'; // L-piece (vibrant orange)
            case 8: return '#ff69b4'; // Special piece (hot pink)
            case 9: return '#00d400'; // Additional green variant
            case 10: return '#f0c000'; // Additional yellow variant
            case 11: return '#3050f0'; // Additional blue variant
            case 12: return '#f03030'; // Additional red variant
            default: return '#666'; // Default gray for unknown pieces
        }
    }
}
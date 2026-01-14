const canvas = document.getElementById('tetrixCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');

const animBlockSize = 38;  // block size
const fallSpeed = 5;        // fall speed
const slotSpacing = 175;    // much wider slots, blocks don't collide

// check if tetrix animation is enabled in settings
function isTetrixEnabled() {
    return localStorage.getItem('tetrixEnabled') !== '0';
}

let blockBag = [];

// shuffle blocks
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// get next block index from bag
function getNextBlockIndex() {
    if (blockBag.length === 0) {
        blockBag = [...Array(TETRIS_BLOCKS.length).keys()];
        shuffle(blockBag);
    }
    return blockBag.pop();
}

const TETRIS_BLOCKS = [
    [[1,1,1,1]],           // I
    [[1,1],[1,1]],         // O
    [[0,1,0],[1,1,1]],     // T
    [[1,0,0],[1,1,1]],     // L
    [[0,0,1],[1,1,1]],     // J
    [[1,1,0],[0,1,1]],     // S
    [[0,1,1],[1,1,0]],     // Z
    [[1,1,1]],             // i 
    [[0,1],[0,1],[1,1]],   // l
    [[1,1,1],[1,0,1]],     // C
    [[1,0,0],[0,1,0],[0,0,1]],  // \
    [[1,0,1],[0,1,0]],     // Y
];

const COLORS = [
    '#00d4d4', '#f0c000', '#b030f0',
    '#00d400', '#f03030', '#3050f0',
    '#f08820', '#ff69b4', '#7fffd4',
    '#ffa500', '#adff2f', '#ff4500'
];


// initialize drops
let drops = [];
for (let x = 0; x < canvas.width; x += slotSpacing) {
    let idx = getNextBlockIndex();
    drops.push({
        x,
        y: Math.random() * -canvas.height,
        block: TETRIS_BLOCKS[idx],
        color: COLORS[idx]
    });
}

// draw drops
function drawTetrix() {

    //  boolean to turn off tetrix canvas
    if (!isTetrixEnabled()) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawTetrix);
        return;
    }
    
    // clear canvas with fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; // fade-out background for tail effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    // Iterate through each drop
    for (let drop of drops) {
        for (let row = 0; row < drop.block.length; row++) {
            for (let col = 0; col < drop.block[row].length; col++) {
                if (drop.block[row][col]) {
                    drawEnhancedBlock(
                        ctx,
                        drop.x + col * animBlockSize,
                        drop.y + row * animBlockSize,
                        animBlockSize,
                        drop.color
                    );
                }
            }
        }

        // update drop position
        drop.y += fallSpeed;

        // reset drop if it goes off screen
        if (drop.y > canvas.height) {
            let idx = Math.floor(Math.random() * TETRIS_BLOCKS.length);
            drop.block = TETRIS_BLOCKS[idx];
            drop.color = COLORS[idx];
            drop.y = -drop.block.length * animBlockSize;
        }
    }

    requestAnimationFrame(drawTetrix);
}

drawTetrix();// Draw a single block with enhanced 3D graphics
function drawEnhancedBlock(ctx, px, py, cellSize, color) {
    const size = cellSize - 2;

    // Draw outer shadow for depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(px + 1, py + 1, size, size);

    // Draw main block background
    ctx.fillStyle = color;
    ctx.fillRect(px, py, size, size);

    // Create gradient for 3D effect
    const gradient = ctx.createLinearGradient(px, py, px + size, py + size);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(px, py, size, size);

    // Draw highlight on top-left for shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(px + 2, py + 2, size * 0.4, 2);
    ctx.fillRect(px + 2, py + 2, 2, size * 0.4);

    // Draw darker bottom-right edge for depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(px + size - 3, py + 3, 3, size - 3);
    ctx.fillRect(px + 3, py + size - 3, size - 3, 3);

    // Draw border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);

    // Inner border for extra detail
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 1.5, py + 1.5, size - 3, size - 3);
}


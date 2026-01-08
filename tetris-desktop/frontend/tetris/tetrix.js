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
    '#00f0f0', '#f0f000', '#a000f0',
    '#00f000', '#f00000', '#0000f0',
    '#f08000', '#ff69b4', '#7fffd4',
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
                    ctx.fillStyle = drop.color;
                    ctx.fillRect(
                        drop.x + col * animBlockSize,
                        drop.y + row * animBlockSize,
                        animBlockSize,
                        animBlockSize
                    );
                    ctx.strokeStyle = '#000';
                    ctx.strokeRect(
                        drop.x + col * animBlockSize,
                        drop.y + row * animBlockSize,
                        animBlockSize,
                        animBlockSize
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

drawTetrix();
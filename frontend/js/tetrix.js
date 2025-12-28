const canvas = document.getElementById('tetrixCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');

const animBlockSize = 36;  // block size
const fallSpeed = 4;        // fall speed
const slotSpacing = 150;    // much wider slots, blocks don't collide

// check if tetrix animation is enabled
function isTetrixEnabled() {
    return localStorage.getItem('tetrixEnabled') !== '0';
}


const TETRIS_BLOCKS = [
    [[1,1,1,1]],           // I
    [[1,1],[1,1]],         // O
    [[0,1,0],[1,1,1]],     // T
    [[1,0,0],[1,1,1]],     // L
    [[0,0,1],[1,1,1]],     // J
    [[1,1,0],[0,1,1]],     // S
    [[0,1,1],[1,1,0]],     // Z
];

const COLORS = ['#00f0f0','#f0f000','#a000f0','#00f000','#f00000','#0000f0','#f08000'];

// initiera drops, en per "slot"
let drops = [];
for (let x = 0; x < canvas.width; x += slotSpacing) {
    let idx = Math.floor(Math.random() * TETRIS_BLOCKS.length);
    drops.push({
        x: x,
        y: Math.random() * -canvas.height,
        block: TETRIS_BLOCKS[idx],
        color: COLORS[idx]
    });
}

function drawTetrix() {

    //  boolean to turn off tetrix canvas
    if (!isTetrixEnabled()) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawTetrix);
        return;
    }

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

        drop.y += fallSpeed;

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

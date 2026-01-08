import { CanvasManager } from './renderingGameElements/canvasManager.js';
import { ColorManager } from './renderingGameElements/colorManager.js';
import { CollisionDetector } from './renderingGameElements/collisionDetector.js';
import { GhostPieceRenderer } from './renderingGameElements/ghostPieceRenderer.js';
import { PreviewRenderer } from './renderingGameElements/previewRenderer.js';
import { UIManager } from './renderingGameElements/uiManager.js';
import { Renderer } from './renderingGameElements/renderer.js';

// Initialize managers
const canvasManager = new CanvasManager();
const collisionDetector = new CollisionDetector(canvasManager);
const ghostPieceRenderer = new GhostPieceRenderer(canvasManager, collisionDetector);
const previewRenderer = new PreviewRenderer(canvasManager);
const uiManager = new UIManager();
const renderer = new Renderer(canvasManager, ghostPieceRenderer, previewRenderer, uiManager);

// Export legacy functions for backward compatibility
export function initCanvas(mainId = 'tetris', previewId = 'preview', size = 36) {
    canvasManager.initCanvas(mainId, previewId, size);
}

export function drawState(state) {
    renderer.drawState(state);
}

export function clear() {
    canvasManager.clear();
}

export function colorFor(v) {
    return ColorManager.colorFor(v);
}

export function getCellSize() {
    return canvasManager.getCellSize();
}

// For backward compatibility
export let cellSize = 36;
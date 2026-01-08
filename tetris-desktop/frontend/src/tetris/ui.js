import { GameController } from './controllers/gameController.js';
import { InputController } from './controllers/inputController.js';
import { ModalController } from './controllers/modalController.js';
import { fetchHighscores } from './highscore.js';

export default function initUI() {
    console.log('initUI called');

    // Initialize controllers
    const gameController = new GameController();
    const inputController = new InputController();
    const modalController = new ModalController(gameController, inputController);

    // Set up dependencies
    inputController.gameController = gameController;
    inputController.modalController = modalController;

    // Initialize each controller
    gameController.init();
    modalController.init();
    inputController.init();

    // Load initial highscores
    fetchHighscores();
}
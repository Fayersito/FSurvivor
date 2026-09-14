// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        // Elementos UI
        const hpBar = document.getElementById('hp-bar');
        const xpBar = document.getElementById('xp-bar');
        const levelTxt = document.getElementById('level-txt');
        const timeTxt = document.getElementById('time-txt');
        const killsTxt = document.getElementById('kills-txt');
        const coinsTxt = document.getElementById('coins-txt');
        const upgradeModal = document.getElementById('upgrade-modal');
        const cardsContainer = document.getElementById('cards-container');
        const startHint = document.getElementById('start-hint');
        const powerupIndicator = document.getElementById('powerup-indicator');

        const rouletteModal = document.getElementById('roulette-modal');
        const rouletteStrip = document.getElementById('roulette-strip');
        const rouletteResult = document.getElementById('roulette-result');
        const rouletteResultTitle = document.getElementById('roulette-result-title');
        const rouletteResultDesc = document.getElementById('roulette-result-desc');

        const upgraderModal = document.getElementById('upgrader-modal');
        const upgraderCoinsTxt = document.getElementById('upgrader-coins');
        const upgraderCardsContainer = document.getElementById('upgrader-cards-container');

        // Elementos de las pantallas de menú (fuera de la partida)
        const menuMetaCoinsTxt = document.getElementById('menu-meta-coins');
        const menuSelectedCharTxt = document.getElementById('menu-selected-char');
        const charSelectGrid = document.getElementById('char-select-grid');
        const shopGrid = document.getElementById('shop-grid');
        const shopMetaCoinsTxt = document.getElementById('shop-meta-coins');
        const rankingBody = document.getElementById('ranking-body');
        const rsBreakdown = document.getElementById('rs-breakdown');
        const newRecordContainer = document.getElementById('new-record-container');
        const gameUiWrapper = document.getElementById('game-ui-wrapper');
        const puMetaCoinsTxt = document.getElementById('pu-meta-coins');
        const puGrid = document.getElementById('pu-grid');
        const achievementsGrid = document.getElementById('achievements-grid');

// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // Variables Globales
        let keys = {};
        let player, enemies, bullets, gems, powerups, whips, coinsOnMap, structures, floatingTexts, enemyProjectiles;
        let boomerangs, lightningTotems; // habilidades desbloqueables (ver js/skills.js)
        let itemsOnMap; // objetos/tomos en el suelo (ver js/items.js)
        let kills, level, xp, xpNextLevel, coins;
        let gameTime, gameTimerInterval, spawnInterval, chestRespawnInterval;
        let isGameOver = false, isPaused = false;
        let chestsOpened = 0, upgradesPurchased = 0, difficultyModifier = 0, coinDropBonus = 0;
        let nearbyStructure = null;
        let gotLegendaryReward = false; // para el logro "Golpe de Suerte"
        let bossesDefeated = 0;         // para el logro "Cazajefes"

        // Límite de enemigos vivos a la vez: sin este tope, en partidas muy
        // largas (15-20 min) el array podría crecer sin control y notarse
        // bajón de FPS. El spawner (js/main.js) deja de generar enemigos
        // por encima de este número.
        const MAX_LIVING_ENEMIES = 150;

        // Costes base de la economía (escalan con la partida, ver computeCost)
        const CHEST_BASE_COST = 40;
        const UPGRADER_BASE_COST = 25;

        // Coste dinámico: sube según cofres abiertos, mejoras compradas,
        // enemigos asesinados y tiempo transcurrido, para una dificultad
        // económica justa pero cada vez más desafiante.
        function computeCost(base) {
            const chestFactor = 1 + chestsOpened * 0.30;
            const purchaseFactor = 1 + upgradesPurchased * 0.18;
            const killFactor = 1 + kills * 0.003;
            const timeFactor = 1 + (gameTime / 60) * 0.10;
            return Math.round(base * chestFactor * purchaseFactor * killFactor * timeFactor);
        }

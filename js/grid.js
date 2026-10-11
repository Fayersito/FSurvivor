// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // ===============  REJILLA ESPACIAL (COLISIONES)  =============
        // ==========================================================
        // En vez de comparar cada bala contra TODOS los enemigos (coste
        // O(balas × enemigos) cada fotograma), se agrupan los enemigos en
        // celdas de GRID_CELL_SIZE píxeles. Cada bala solo comprueba los
        // enemigos de su celda y las 8 adyacentes. Se reconstruye una vez
        // por fotograma en gameLoop (js/main.js), antes de procesar balas.
        const GRID_CELL_SIZE = 100;

        function buildEnemyGrid() {
            const grid = new Map();
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                const cx = Math.floor(enemy.x / GRID_CELL_SIZE);
                const cy = Math.floor(enemy.y / GRID_CELL_SIZE);
                const key = cx + '_' + cy;
                if (!grid.has(key)) grid.set(key, []);
                grid.get(key).push(i);
            }
            return grid;
        }

        function getNearbyEnemyIndices(grid, x, y) {
            const cx = Math.floor(x / GRID_CELL_SIZE);
            const cy = Math.floor(y / GRID_CELL_SIZE);
            const result = [];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const key = (cx + dx) + '_' + (cy + dy);
                    if (grid.has(key)) result.push(...grid.get(key));
                }
            }
            return result;
        }

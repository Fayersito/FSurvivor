// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

        // ==========================================================
        // =================  MUNDO Y CÁMARA  =========================
        // ==========================================================
        const WORLD_WIDTH = 4000;
        const WORLD_HEIGHT = 3000;
        let camera = { x: 0, y: 0 };

        function updateCamera() {
            camera.x = clamp(player.x - canvas.width / 2, 0, WORLD_WIDTH - canvas.width);
            camera.y = clamp(player.y - canvas.height / 2, 0, WORLD_HEIGHT - canvas.height);
        }

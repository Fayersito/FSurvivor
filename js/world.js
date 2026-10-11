// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

        // ==========================================================
        // =================  MUNDO Y CÁMARA  =========================
        // ==========================================================
        // El mundo se aumentó respecto a la versión "en caja" (800x600)
        // para que siga habiendo margen de cámara de sobra incluso en
        // pantallas muy anchas ahora que el juego va a pantalla completa.
        const WORLD_WIDTH = 8000;
        const WORLD_HEIGHT = 5000;
        let camera = { x: 0, y: 0 };

        function updateCamera() {
            camera.x = clamp(player.x - canvas.width / 2, 0, WORLD_WIDTH - canvas.width);
            camera.y = clamp(player.y - canvas.height / 2, 0, WORLD_HEIGHT - canvas.height);
        }

        // El juego va a pantalla completa: la resolución interna del canvas
        // se ajusta a la ventana real (no solo su tamaño CSS), para que no
        // se vea borroso ni deforme los sprites. Se recalcula al redimensionar
        // o rotar la pantalla; todo el resto del código ya usa canvas.width/
        // canvas.height dinámicamente, así que no hace falta tocar nada más.
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', resizeCanvas);


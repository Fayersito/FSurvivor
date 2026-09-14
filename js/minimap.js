// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // =========================  MINIMAPA  ==========================
        // ==========================================================
        const MINIMAP_WIDTH = 130;
        const MINIMAP_HEIGHT = 97.5; // mantiene la proporción 4:3 del mundo (4000x3000)
        const MINIMAP_MARGIN = 10;
        const MINIMAP_SCALE = MINIMAP_WIDTH / WORLD_WIDTH;

        function drawMinimap() {
            const mx = MINIMAP_MARGIN;
            // En móvil se sube por encima del joystick táctil para no taparlo
            const touchOffset = document.body.classList.contains('touch-device') ? 115 : 0;
            const my = canvas.height - MINIMAP_HEIGHT - MINIMAP_MARGIN - touchOffset;

            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(mx, my, MINIMAP_WIDTH, MINIMAP_HEIGHT);
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(mx, my, MINIMAP_WIDTH, MINIMAP_HEIGHT);

            // Estructuras del mapa
            structures.forEach(s => {
                const px = mx + s.x * MINIMAP_SCALE;
                const py = my + s.y * MINIMAP_SCALE;
                ctx.fillStyle = s.type === 'chest' ? '#f1c40f' : s.type === 'totem' ? '#9b59b6' : '#3498db';
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            });

            // Jefe, si está vivo
            if (boss) {
                const px = mx + boss.x * MINIMAP_SCALE;
                const py = my + boss.y * MINIMAP_SCALE;
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Jugador
            const ppx = mx + player.x * MINIMAP_SCALE;
            const ppy = my + player.y * MINIMAP_SCALE;
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(ppx, ppy, 3, 0, Math.PI * 2);
            ctx.fill();

            // Rectángulo con la zona visible actual (cámara)
            const camX = mx + camera.x * MINIMAP_SCALE;
            const camY = my + camera.y * MINIMAP_SCALE;
            const camW = canvas.width * MINIMAP_SCALE;
            const camH = canvas.height * MINIMAP_SCALE;
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.strokeRect(camX, camY, camW, camH);

            ctx.restore();
        }

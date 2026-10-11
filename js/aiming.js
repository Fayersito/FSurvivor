// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // ==================  PUNTERÍA (RATÓN)  ========================
        // ==========================================================
        // Todas las armas y habilidades apuntan hacia player.aimAngle.
        // Prioridad para calcularlo cada fotograma (computeAimAngle,
        // llamado desde gameLoop en js/main.js):
        //   1) posición del ratón sobre el canvas (si se ha movido alguna vez)
        //   2) dirección del joystick táctil, si está siendo usado
        //   3) última dirección de movimiento (teclado), si el jugador se mueve
        //   4) si nada de lo anterior aplica, se mantiene el ángulo anterior
        let mouseScreenX = 0;
        let mouseScreenY = 0;
        let hasMouseInput = false;

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            mouseScreenX = (e.clientX - rect.left) * scaleX;
            mouseScreenY = (e.clientY - rect.top) * scaleY;
            hasMouseInput = true;
        });

        function computeAimAngle() {
            if (!player) return;

            if (hasMouseInput) {
                const mouseWorldX = camera.x + mouseScreenX;
                const mouseWorldY = camera.y + mouseScreenY;
                player.aimAngle = Math.atan2(mouseWorldY - player.y, mouseWorldX - player.x);
            } else if (Math.hypot(joystickVector.x, joystickVector.y) > 0.15) {
                player.aimAngle = Math.atan2(joystickVector.y, joystickVector.x);
            } else if (player.moving) {
                player.aimAngle = player.lastMoveAngle;
            }
            // En cualquier otro caso se conserva el último aimAngle calculado.
        }

        // Flecha que rodea al jugador indicando hacia dónde apunta (el
        // cursor, el joystick, o la última dirección de movimiento).
        function drawAimIndicator() {
            const sx = player.x - camera.x, sy = player.y - camera.y;
            const rInner = player.radius + 14;
            const rOuter = rInner + 12;
            const angle = player.aimAngle;

            const tipX = sx + Math.cos(angle) * rOuter;
            const tipY = sy + Math.sin(angle) * rOuter;
            const baseCenterX = sx + Math.cos(angle) * rInner;
            const baseCenterY = sy + Math.sin(angle) * rInner;
            const perpX = Math.cos(angle + Math.PI / 2) * 6;
            const perpY = Math.sin(angle + Math.PI / 2) * 6;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(baseCenterX + perpX, baseCenterY + perpY);
            ctx.lineTo(baseCenterX - perpX, baseCenterY - perpY);
            ctx.closePath();
            ctx.fillStyle = 'rgba(241, 196, 15, 0.85)';
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 1;
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

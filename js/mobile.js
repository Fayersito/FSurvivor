// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // ===============  CONTROLES MÓVILES (JOYSTICK)  ==============
        // ==========================================================
        if (('ontouchstart' in window) || navigator.maxTouchPoints > 0) {
            document.body.classList.add('touch-device');
        }

        let joystickVector = { x: 0, y: 0 };
        const joystickBase = document.getElementById('joystick-base');
        const joystickKnob = document.getElementById('joystick-knob');
        const interactBtnMobile = document.getElementById('interact-btn-mobile');
        let joystickActive = false, joystickTouchId = null, joystickCenter = { x: 0, y: 0 };
        const JOYSTICK_RADIUS = 42;

        function joystickStart(e) {
            const touch = e.changedTouches[0];
            joystickActive = true;
            joystickTouchId = touch.identifier;
            const rect = joystickBase.getBoundingClientRect();
            joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            updateJoystick(touch.clientX, touch.clientY);
            e.preventDefault();
        }

        function joystickMove(e) {
            if (!joystickActive) return;
            for (const touch of e.changedTouches) {
                if (touch.identifier === joystickTouchId) {
                    updateJoystick(touch.clientX, touch.clientY);
                    e.preventDefault();
                }
            }
        }

        function joystickEnd(e) {
            for (const touch of e.changedTouches) {
                if (touch.identifier === joystickTouchId) {
                    joystickActive = false;
                    joystickVector = { x: 0, y: 0 };
                    joystickKnob.style.transform = 'translate(0px, 0px)';
                }
            }
        }

        function updateJoystick(clientX, clientY) {
            let dx = clientX - joystickCenter.x;
            let dy = clientY - joystickCenter.y;
            const dist = Math.hypot(dx, dy);
            if (dist > JOYSTICK_RADIUS) { dx = (dx / dist) * JOYSTICK_RADIUS; dy = (dy / dist) * JOYSTICK_RADIUS; }
            joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
            const nx = dx / JOYSTICK_RADIUS, ny = dy / JOYSTICK_RADIUS;
            joystickVector = { x: Math.hypot(nx, ny) < 0.15 ? 0 : nx, y: Math.hypot(nx, ny) < 0.15 ? 0 : ny };
        }

        joystickBase.addEventListener('touchstart', joystickStart, { passive: false });
        joystickBase.addEventListener('touchmove', joystickMove, { passive: false });
        joystickBase.addEventListener('touchend', joystickEnd);
        joystickBase.addEventListener('touchcancel', joystickEnd);

        interactBtnMobile.addEventListener('touchstart', e => {
            e.preventDefault();
            handleInteract();
        }, { passive: false });

        window.addEventListener('touchstart', tryStartMusic, { once: true });

        // Vibración táctil (si el dispositivo la soporta) para dar feedback
        // físico al recibir daño, subir de nivel, etc. No hace nada en
        // dispositivos sin navigator.vibrate (la mayoría de PC/iOS).
        function vibrate(pattern) {
            if (navigator.vibrate) navigator.vibrate(pattern);
        }

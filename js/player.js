// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // Escuchar Teclado
        window.addEventListener('keydown', e => {
            keys[e.key.toLowerCase()] = true;
            if (e.key.toLowerCase() === 'e' && !e.repeat) handleInteract();
        });
        window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

        // ==========================================================
        // =====================  JUGADOR  ============================
        // ==========================================================
        class Player {
            constructor(characterId) {
                this.characterId = characterId;
                this.x = WORLD_WIDTH / 2;
                this.y = WORLD_HEIGHT / 2;
                this.radius = 14;
                this.baseSpeed = 2.5;
                this.maxHp = 100;
                this.hp = 100;
                
                // Timers de armas
                this.lastWandShoot = 0;
                this.lastWhipShoot = 0;
                this.lastBowShoot = 0;
                this.lastHitSound = 0;
                this.lastBoomerangThrow = 0;
                this.lastTotemSummon = 0;

                // Bonificaciones permanentes obtenidas de cofres / tótems
                this.bonusDamageMult = 0;
                this.bonusSpeedMult = 0;
                this.bonusXpMult = 0;

                // Power-ups conseguidos durante la partida (multidisparo, área)
                this.extraProjectiles = 0;
                this.areaDamage = false;

                // Bonificaciones de las Mejoras Permanentes de la Tienda
                // (se rellenan en init() vía applyPermanentUpgrades())
                this.permanentMagnetBonus = 0;
                this.coinGainMult = 1;

                // Robo de vida (infusión pasiva "Robo de Vida" + Tomo de
                // Vampirismo), ver onWeaponHit() en js/statuseffects.js
                this.lifestealBonus = 0;

                // ============ SISTEMA DE OBJETOS / SLOTS (js/items.js) ============
                // player.items: { idDeObjeto: nivelDeStack }. maxItemSlots lo
                // fija init() (js/main.js) según las Mejoras Permanentes.
                this.items = {};
                this.maxItemSlots = 5;
                this.luckStacks = 0;           // Tomo de la Suerte
                this.elementalStacks = 0;      // Tomo Elemental
                this.elementalProcBonus = 0;   // += 0.05 por nivel del Tomo Elemental
                this.frenzyStacks = 0;         // Reliquia de Frenesí Sangriento
                this.frenzyExpiresAt = 0;
                this.lastChronosTrigger = 0;   // Tomo de Chronos (detiene el tiempo)

                // Apuntado: hacia dónde ataca el personaje (ver js/aiming.js).
                // computeAimAngle() lo actualiza cada fotograma con prioridad
                // ratón > joystick > última dirección de movimiento.
                this.aimAngle = 0;
                this.lastMoveAngle = 0;

                // Sprite / animación (el volteo horizontal ahora lo marca
                // el apuntado, no la dirección en la que caminas)
                this.animFrame = 0;
                this.animTimer = 0;
                this.moving = false;
            }

            get speed() {
                let mult = 1 + this.bonusSpeedMult;
                // Frenesí Sangriento: cada racha de asesinatos acelera un poco
                if ((this.items.item_bloodfrenzy || 0) > 0 && Date.now() < this.frenzyExpiresAt) {
                    mult *= 1 + this.frenzyStacks * 0.03;
                }
                return (this.baseSpeed + (UPGRADES.speed.level * 0.5)) * mult;
            }

            get damageMult() {
                let mult = (1 + (UPGRADES.damage.level * 0.2)) * (1 + this.bonusDamageMult);

                // Reliquia del Berserker: cuanta menos vida te queda, más pegas
                const berserkerStacks = this.items.item_berserker || 0;
                if (berserkerStacks > 0) {
                    const missingFrac = 1 - (this.hp / this.maxHp);
                    mult *= 1 + missingFrac * 0.5 * berserkerStacks;
                }

                // Frenesí Sangriento: cada racha de asesinatos también pega más fuerte
                if ((this.items.item_bloodfrenzy || 0) > 0 && Date.now() < this.frenzyExpiresAt) {
                    mult *= 1 + this.frenzyStacks * 0.05;
                }

                return mult;
            }

            get cooldownMult() { return Math.max(0.3, 1 - (UPGRADES.cooldown.level * 0.12)); }
            get magnetRadius() { return 70 + (UPGRADES.magnet.level * 45) + this.permanentMagnetBonus; }

            draw() {
                const spriteKey = CHARACTERS[this.characterId].spriteKey;
                // El sprite mira hacia el lado al que se está apuntando/atacando
                const flip = Math.cos(this.aimAngle) < 0;
                drawSprite(spriteKey, this.animFrame, this.x, this.y, this.radius * 3, flip);

                // Dibujar Aura Avena si la posee
                if (UPGRADES.garlic.level > 0) {
                    const radius = 40 + (UPGRADES.garlic.level * 10);
                    const sx = this.x - camera.x, sy = this.y - camera.y;
                    ctx.beginPath();
                    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(241, 196, 15, 0.15)';
                    ctx.strokeStyle = 'rgba(241, 196, 15, 0.4)';
                    ctx.lineWidth = 2;
                    ctx.fill();
                    ctx.stroke();
                    ctx.closePath();
                }
            }

            move() {
                let dx = 0, dy = 0;
                if (keys['w'] || keys['arrowup']) dy -= 1;
                if (keys['s'] || keys['arrowdown']) dy += 1;
                if (keys['a'] || keys['arrowleft']) dx -= 1;
                if (keys['d'] || keys['arrowright']) dx += 1;

                // Joystick táctil (móvil), se combina con el teclado
                dx += joystickVector.x;
                dy += joystickVector.y;

                this.moving = Math.hypot(dx, dy) > 0.05;

                if (this.moving) {
                    const len = Math.hypot(dx, dy);
                    dx /= len; dy /= len;

                    this.x = clamp(this.x + dx * this.speed, this.radius, WORLD_WIDTH - this.radius);
                    this.y = clamp(this.y + dy * this.speed, this.radius, WORLD_HEIGHT - this.radius);

                    this.lastMoveAngle = Math.atan2(dy, dx);

                    this.animTimer++;
                    if (this.animTimer > 8) {
                        this.animFrame = 1 - this.animFrame;
                        this.animTimer = 0;
                    }
                } else {
                    this.animFrame = 0;
                    this.animTimer = 0;
                }
            }
        }

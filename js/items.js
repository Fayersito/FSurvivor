// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // ===================  ITEMS / GEMAS  ========================
        // ==========================================================
        class Gem {
            constructor(x, y, spriteKey = 'gem_small', value = 10) {
                this.x = x;
                this.y = y;
                this.spriteKey = spriteKey;
                this.radius = spriteKey === 'gem_large' ? 7 : 4;
                this.value = value;
            }

            draw() {
                drawSprite(this.spriteKey, 0, this.x, this.y, this.radius * 3.5, false);
            }
        }

        class Coin {
            constructor(x, y, value = 5) {
                this.x = x;
                this.y = y;
                this.radius = 5;
                this.value = value;
            }

            draw() {
                drawSprite('coin', 0, this.x, this.y, this.radius * 3.2, false);
            }
        }

        class Powerup {
            constructor(x, y, spriteKey) {
                this.x = x;
                this.y = y;
                this.spriteKey = spriteKey;
                this.radius = 9;
            }

            draw() {
                drawSprite(this.spriteKey, 0, this.x, this.y, this.radius * 3.5, false);
            }

            apply() {
                if (this.spriteKey === 'potion_heal') {
                    player.hp = Math.min(player.maxHp, player.hp + 30);
                    soundManager.play('potion_heal');
                } else if (this.spriteKey === 'magnet_powerup') {
                    gems.forEach(g => { g.x = player.x; g.y = player.y; });
                    coinsOnMap.forEach(c => { c.x = player.x; c.y = player.y; });
                    soundManager.play('magnet_powerup');
                } else if (this.spriteKey === 'powerup_multishot') {
                    // Mejora la skill base: un proyectil/flecha adicional en abanico
                    player.extraProjectiles++;
                    soundManager.play('skill_powerup');
                    showFloatingText(this.x, this.y, '¡Proyectil adicional!', '#3498db');
                } else if (this.spriteKey === 'powerup_area') {
                    // Añade una skill nueva: los impactos hacen daño en área
                    player.areaDamage = true;
                    soundManager.play('skill_powerup');
                    showFloatingText(this.x, this.y, '¡Daño en área!', '#e67e22');
                }
                updateUI();
            }
        }

        // Decide qué suelta un enemigo al morir (además de la moneda, ver gameLoop)
        function dropLoot(enemy) {
            const roll = Math.random();
            if (roll < 0.015) return { type: 'powerup', obj: new Powerup(enemy.x, enemy.y, 'potion_heal') };
            if (roll < 0.028) return { type: 'powerup', obj: new Powerup(enemy.x, enemy.y, 'magnet_powerup') };
            if (roll < 0.038) return { type: 'powerup', obj: new Powerup(enemy.x, enemy.y, 'powerup_multishot') };
            if (roll < 0.048) return { type: 'powerup', obj: new Powerup(enemy.x, enemy.y, 'powerup_area') };
            if (enemy.isElite) return { type: 'gem', obj: new Gem(enemy.x, enemy.y, 'gem_large', Math.round(enemy.type.xp * (1 + player.bonusXpMult))) };
            return { type: 'gem', obj: new Gem(enemy.x, enemy.y, 'gem_small', Math.round(enemy.type.xp * (1 + player.bonusXpMult))) };
        }

// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        class Bullet {
            constructor(x, y, targetX, targetY, damage, color = '#3498db', pierce = 0) {
                this.x = x;
                this.y = y;
                this.radius = 5;
                this.color = color;
                this.speed = 7;
                this.damage = damage;
                this.pierce = pierce; // nº de enemigos que puede atravesar además del primero

                const angle = Math.atan2(targetY - y, targetX - x);
                this.vx = Math.cos(angle) * this.speed;
                this.vy = Math.sin(angle) * this.speed;
            }

            draw() {
                const sx = this.x - camera.x, sy = this.y - camera.y;
                ctx.beginPath();
                ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.closePath();
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
            }
        }

        // Diferencia angular normalizada a [-PI, PI]. La usa la detección
        // de impacto del espadazo (¿está el enemigo dentro del arco?).
        function angleDiff(a, b) {
            let d = a - b;
            while (d > Math.PI) d -= Math.PI * 2;
            while (d < -Math.PI) d += Math.PI * 2;
            return d;
        }

        // Espadazo cuerpo a cuerpo dirigido: un arco/cuña centrada en el
        // ángulo de apuntado del jugador (player.aimAngle, ver js/aiming.js),
        // no ya un golpe fijo a ambos lados.
        class SwordSlash {
            constructor(x, y, angle, damage, range, halfAngle) {
                this.x = x;
                this.y = y;
                this.angle = angle;
                this.damage = damage;
                this.range = range;
                this.halfAngle = halfAngle;
                this.duration = 10; // Frames que dura en pantalla
                this.burning = false; // lo activa el Espadazo evolucionado
            }

            draw() {
                const sx = this.x - camera.x, sy = this.y - camera.y;
                ctx.save();
                ctx.fillStyle = 'rgba(230, 126, 34, 0.55)';
                ctx.strokeStyle = 'rgba(255, 200, 120, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.arc(sx, sy, this.range, this.angle - this.halfAngle, this.angle + this.halfAngle);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }

        function attackSystem() {
            const now = Date.now();

            // 1. Varita Mágica — golpe lejano de un solo proyectil (Mago),
            //    disparado hacia donde apunta el cursor. Con el power-up
            //    de multidisparo, dispara varios en abanico alrededor de esa
            //    misma dirección. Evolucionada ("Vara Arcana"): proyectil
            //    más grande que atraviesa enemigos.
            if (UPGRADES.wand.level > 0) {
                const evolved = UPGRADES.wand.evolved;
                const cooldown = (1000 - (UPGRADES.wand.level * 120)) * player.cooldownMult;
                if (now - player.lastWandShoot > cooldown) {
                    const count = 1 + player.extraProjectiles;
                    const baseAngle = player.aimAngle;
                    const spread = count > 1 ? 0.35 : 0;
                    let damage = (12 + (UPGRADES.wand.level * 5)) * player.damageMult;
                    if (evolved) damage *= 1.6;
                    for (let i = 0; i < count; i++) {
                        const t = count === 1 ? 0 : (i / (count - 1)) - 0.5;
                        const angle = baseAngle + t * spread;
                        const bullet = new Bullet(player.x, player.y, player.x + Math.cos(angle) * 100, player.y + Math.sin(angle) * 100, damage, '#3498db', evolved ? 3 : 0);
                        if (evolved) bullet.radius = 8;
                        bullets.push(bullet);
                    }
                    player.lastWandShoot = now;
                    soundManager.play('wand_shoot');
                }
            }

            // 2. Espadazo — golpe cuerpo a cuerpo en arco hacia el cursor
            //    (Caballero). Evolucionado ("Espada Sagrada"): arco más
            //    ancho, más alcance, más daño y quema al golpear.
            if (UPGRADES.whip.level > 0) {
                const evolved = UPGRADES.whip.evolved;
                const cooldown = 700 * player.cooldownMult;
                if (now - player.lastWhipShoot > cooldown) {
                    let damage = (25 + (UPGRADES.whip.level * 10)) * player.damageMult;
                    if (evolved) damage *= 1.3;
                    const range = 78 + (UPGRADES.whip.level * 8) + (evolved ? 22 : 0);
                    const halfAngle = evolved ? 0.85 : 0.6;

                    const slash = new SwordSlash(player.x, player.y, player.aimAngle, damage, range, halfAngle);
                    if (evolved) slash.burning = true;
                    whips.push(slash);

                    player.lastWhipShoot = now;
                    soundManager.play('whip_attack');
                }
            }

            // 3. Arco Múltiple — varias flechas débiles en abanico hacia el
            //    cursor (Arquero), más numerosas pero de menor daño que el
            //    proyectil del Mago. Evolucionado ("Lluvia de Flechas"):
            //    dispara con mucha más frecuencia.
            if (UPGRADES.bow.level > 0) {
                const evolved = UPGRADES.bow.evolved;
                const cooldown = (900 - (UPGRADES.bow.level * 80)) * player.cooldownMult * (evolved ? 0.6 : 1);
                if (now - player.lastBowShoot > cooldown) {
                    const arrowCount = 3 + UPGRADES.bow.level + player.extraProjectiles;
                    const baseAngle = player.aimAngle;
                    const spread = 0.6;
                    const damage = (6 + (UPGRADES.bow.level * 2)) * player.damageMult;
                    for (let i = 0; i < arrowCount; i++) {
                        const t = arrowCount === 1 ? 0 : (i / (arrowCount - 1)) - 0.5;
                        const angle = baseAngle + t * spread;
                        bullets.push(new Bullet(player.x, player.y, player.x + Math.cos(angle) * 100, player.y + Math.sin(angle) * 100, damage, '#2ecc71'));
                    }
                    player.lastBowShoot = now;
                    soundManager.play('bow_shoot');
                }
            }

            // 4. Aura Avena — daño continuo ALREDEDOR del jugador (Chad).
            //    Es un área radial, no una skill dirigida: no depende del
            //    cursor, igual que antes. Evolucionada ("Aura Divina"): más
            //    grande y cura al golpear.
            if (UPGRADES.garlic.level > 0) {
                const evolved = UPGRADES.garlic.evolved;
                const auraRadius = 40 + (UPGRADES.garlic.level * 10) + (evolved ? 25 : 0);
                const auraDamage = (0.3 + (UPGRADES.garlic.level * 0.2)) * player.damageMult;

                enemies.forEach(enemy => {
                    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
                    if (dist < auraRadius + enemy.radius) {
                        enemy.hp -= auraDamage;
                        if (evolved) player.hp = Math.min(player.maxHp, player.hp + 0.01);
                    }
                });

                // El aura también alcanza al Jefe, si está vivo
                if (boss) {
                    const distBoss = Math.hypot(boss.x - player.x, boss.y - player.y);
                    if (distBoss < auraRadius + boss.radius) {
                        boss.hp -= auraDamage;
                        if (evolved) player.hp = Math.min(player.maxHp, player.hp + 0.01);
                    }
                }
            }

            // 5. Habilidades adicionales desbloqueables (Bumerán, Tótems de
            //    Tormenta) — cualquier personaje puede tenerlas, ver js/skills.js
            skillsAttackSystem();
        }

        // Comprueba si alguna arma cumple su condición de evolución (nivel
        // máximo del arma + nivel máximo de una pasiva concreta). Se llama
        // desde updateUI() (js/ui.js) tras cualquier cambio de nivel.
        function checkWeaponEvolutions() {
            Object.keys(WEAPON_EVOLUTIONS).forEach(weaponKey => {
                const upgrade = UPGRADES[weaponKey];
                if (upgrade.evolved) return;
                const evo = WEAPON_EVOLUTIONS[weaponKey];
                if (upgrade.level >= upgrade.maxLvl && UPGRADES[evo.requiresPassive].level >= UPGRADES[evo.requiresPassive].maxLvl) {
                    upgrade.evolved = true;
                    showFloatingText(player.x, player.y - 30, `¡${evo.evolvedName}!`, '#f39c12');
                    soundManager.play('level_up');
                }
            });
        }

        // Ya no se usa para el apuntado (que ahora es hacia el cursor,
        // ver js/aiming.js), pero se deja disponible por si en el futuro
        // hace falta un indicador de "enemigo más cercano" o similar.
        function getClosestEnemy() {
            let closest = null;
            let minDist = Infinity;
            enemies.forEach(enemy => {
                const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
                if (dist < minDist) {
                    minDist = dist;
                    closest = enemy;
                }
            });
            return minDist < 450 ? closest : null;
        }

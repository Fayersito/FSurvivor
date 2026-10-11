// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // ============  HABILIDADES DESBLOQUEABLES ADICIONALES  =======
        // ==========================================================
        // A diferencia de wand/whip/bow/garlic (la skill de inicio de cada
        // personaje), estas dos las puede desbloquear y subir de nivel
        // CUALQUIER personaje al subir de nivel o en el mejorador. Ambas
        // usan onWeaponHit() (js/statuseffects.js) en cada golpe, así que
        // también pueden proc-ear las infusiones elementales y el robo
        // de vida — construir en torno a ellas es una build válida por
        // sí sola, sin depender del arma de personaje.

        // --- BUMERÁN ---
        // Sale disparado hacia el cursor, golpea de ida, y al llegar a su
        // alcance máximo da la vuelta y golpea de nuevo en el camino de
        // vuelta (una vez por enemigo en cada tramo, no todos los fotogramas).
        class Boomerang {
            constructor(x, y, angle, damage, range, radius, speed) {
                this.x = x;
                this.y = y;
                this.angle = angle;
                this.damage = damage;
                this.range = range;
                this.radius = radius;
                this.speed = speed;
                this.traveled = 0;
                this.phase = 'out'; // 'out' -> 'back'
                this.rotation = 0;
                this.hitThisPass = new Set(); // evita golpear al mismo objetivo varias veces en un tramo
            }

            update() {
                this.rotation += 0.35;
                if (this.phase === 'out') {
                    this.x += Math.cos(this.angle) * this.speed;
                    this.y += Math.sin(this.angle) * this.speed;
                    this.traveled += this.speed;
                    if (this.traveled >= this.range) {
                        this.phase = 'back';
                        this.hitThisPass = new Set(); // el tramo de vuelta puede volver a golpear a todos
                    }
                } else {
                    const backAngle = Math.atan2(player.y - this.y, player.x - this.x);
                    this.x += Math.cos(backAngle) * this.speed;
                    this.y += Math.sin(backAngle) * this.speed;
                }
            }

            isDone() {
                return this.phase === 'back' && Math.hypot(this.x - player.x, this.y - player.y) < player.radius + this.radius;
            }

            draw() {
                const sx = this.x - camera.x, sy = this.y - camera.y;
                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(this.rotation);
                ctx.fillStyle = '#d35400';
                ctx.strokeStyle = '#7d3c00';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-this.radius, -this.radius * 0.35);
                ctx.lineTo(this.radius, -this.radius * 0.35);
                ctx.lineTo(0, this.radius);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }

        // --- TÓTEM DE TORMENTA ---
        // Estructura temporal (no confundir con los tótems de dificultad
        // del mapa, js/structures.js) que descarga rayos periódicamente
        // sobre todos los enemigos dentro de su alcance mientras dura.
        class LightningTotem {
            constructor(x, y, damage, range, durationMs, zapCooldown) {
                this.x = x;
                this.y = y;
                this.damage = damage;
                this.range = range;
                this.expiresAt = Date.now() + durationMs;
                this.zapCooldown = zapCooldown;
                this.lastZap = 0;
            }

            isExpired() { return Date.now() > this.expiresAt; }

            tryZap() {
                const now = Date.now();
                if (now - this.lastZap < this.zapCooldown) return;
                this.lastZap = now;

                let hitSomething = false;
                enemies.forEach(enemy => {
                    const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (dist < this.range + enemy.radius) {
                        enemy.hp -= this.damage;
                        showFloatingText(enemy.x, enemy.y - enemy.radius - 6, `⚡-${Math.round(this.damage)}`, '#f4d03f');
                        onWeaponHit(enemy, this.damage);
                        hitSomething = true;
                    }
                });

                if (boss) {
                    const distBoss = Math.hypot(boss.x - this.x, boss.y - this.y);
                    if (distBoss < this.range + boss.radius) {
                        boss.hp -= this.damage;
                        showFloatingText(boss.x, boss.y - boss.radius - 6, `⚡-${Math.round(this.damage)}`, '#f4d03f');
                        onWeaponHit(boss, this.damage);
                        hitSomething = true;
                    }
                }

                if (hitSomething) soundManager.play('totem_zap');
            }

            draw() {
                const sx = this.x - camera.x, sy = this.y - camera.y;
                ctx.save();
                ctx.strokeStyle = 'rgba(244, 208, 63, 0.25)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(sx, sy, this.range, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
                drawSprite('lightning_totem', 0, this.x, this.y, 42, false);
            }
        }

        // Lanza el ataque de ambas habilidades si están desbloqueadas
        // (nivel > 0). Se llama desde attackSystem() (js/weapons.js).
        function skillsAttackSystem() {
            const now = Date.now();

            // Bumerán: más nivel = más bumeranes a la vez y más grandes/dañinos
            if (UPGRADES.boomerang.level > 0) {
                const lvl = UPGRADES.boomerang.level;
                const cooldown = 1400 * player.cooldownMult;
                if (now - player.lastBoomerangThrow > cooldown) {
                    const count = lvl; // 1 a 5 bumeranes simultáneos
                    const damage = (10 + lvl * 6) * player.damageMult;
                    const radius = 14 + lvl * 2;
                    const range = 240 + lvl * 25;
                    const speed = 6.5;
                    const spread = count > 1 ? 0.55 : 0;
                    const baseAngle = player.aimAngle;

                    for (let i = 0; i < count; i++) {
                        const t = count === 1 ? 0 : (i / (count - 1)) - 0.5;
                        const angle = baseAngle + t * spread;
                        boomerangs.push(new Boomerang(player.x, player.y, angle, damage, range, radius, speed));
                    }
                    player.lastBoomerangThrow = now;
                    soundManager.play('boomerang_throw');
                }
            }

            // Tótems de Tormenta: más nivel = más tótems por invocación,
            // más duración, más daño y más alcance
            if (UPGRADES.totemStorm.level > 0) {
                const lvl = UPGRADES.totemStorm.level;
                const summonCooldown = 6000 * player.cooldownMult;
                if (now - player.lastTotemSummon > summonCooldown) {
                    const count = 1 + Math.floor((lvl - 1) / 2); // lvl 1-2:1, 3-4:2, 5:3
                    const damage = (4 + lvl * 2.5) * player.damageMult;
                    const range = 95 + lvl * 18;
                    const durationMs = 4000 + lvl * 1600;

                    for (let i = 0; i < count; i++) {
                        const offsetAngle = Math.random() * Math.PI * 2;
                        const offsetDist = 60 + Math.random() * 80;
                        const tx = player.x + Math.cos(offsetAngle) * offsetDist;
                        const ty = player.y + Math.sin(offsetAngle) * offsetDist;
                        lightningTotems.push(new LightningTotem(tx, ty, damage, range, durationMs, 700));
                    }
                    player.lastTotemSummon = now;
                    soundManager.play('totem_activate');
                    showFloatingText(player.x, player.y - 30, `⚡ Tótems invocados (${count})`, '#f4d03f');
                }
            }
        }

        // Actualiza, dibuja y resuelve la colisión de bumeranes y tótems.
        // Se llama cada fotograma desde gameLoop() (js/main.js).
        function updateAndDrawSkills() {
            for (let i = boomerangs.length - 1; i >= 0; i--) {
                const b = boomerangs[i];
                b.update();
                b.draw();

                enemies.forEach(enemy => {
                    if (b.hitThisPass.has(enemy)) return;
                    const dist = Math.hypot(enemy.x - b.x, enemy.y - b.y);
                    if (dist < enemy.radius + b.radius) {
                        enemy.hp -= b.damage;
                        showFloatingText(enemy.x, enemy.y - enemy.radius, `-${Math.round(b.damage)}`, '#ffffff');
                        onWeaponHit(enemy, b.damage);
                        b.hitThisPass.add(enemy);
                    }
                });
                if (boss && !b.hitThisPass.has(boss)) {
                    const distBoss = Math.hypot(boss.x - b.x, boss.y - b.y);
                    if (distBoss < boss.radius + b.radius) {
                        boss.hp -= b.damage;
                        showFloatingText(boss.x, boss.y - boss.radius, `-${Math.round(b.damage)}`, '#ffffff');
                        onWeaponHit(boss, b.damage);
                        b.hitThisPass.add(boss);
                    }
                }

                if (b.isDone()) boomerangs.splice(i, 1);
            }

            for (let i = lightningTotems.length - 1; i >= 0; i--) {
                const t = lightningTotems[i];
                t.draw();
                t.tryZap();
                if (t.isExpired()) lightningTotems.splice(i, 1);
            }
        }

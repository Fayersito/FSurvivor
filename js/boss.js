// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // ==========================  JEFE  ============================
        // ==========================================================
        // Solo puede haber un Jefe vivo a la vez. El primero aparece a
        // los 2 minutos de partida y, a partir de ahí, uno nuevo cada 3
        // minutos si no queda ninguno vivo. Ataca con una ráfaga circular
        // de proyectiles cada pocos segundos, además de daño de contacto.
        const BOSS_FIRST_SPAWN_TIME = 120;
        const BOSS_SPAWN_INTERVAL = 180;

        let boss = null;
        let lastBossSpawnTime = -Infinity;

        class Boss {
            constructor() {
                const margin = 120;
                const viewLeft = camera.x - margin;
                const viewRight = camera.x + canvas.width + margin;
                const viewTop = camera.y - margin;
                const viewBottom = camera.y + canvas.height + margin;

                if (Math.random() < 0.5) {
                    this.x = Math.random() < 0.5 ? viewLeft : viewRight;
                    this.y = viewTop + Math.random() * (viewBottom - viewTop);
                } else {
                    this.x = viewLeft + Math.random() * (viewRight - viewLeft);
                    this.y = Math.random() < 0.5 ? viewTop : viewBottom;
                }
                this.x = clamp(this.x, 0, WORLD_WIDTH);
                this.y = clamp(this.y, 0, WORLD_HEIGHT);

                const scale = 1 + (gameTime / 300);
                this.radius = 34;
                this.maxHp = Math.floor(500 * scale * (1 + difficultyModifier));
                this.hp = this.maxHp;
                this.speed = 0.55 * (1 + difficultyModifier * 0.3);
                this.touchDamage = 8 * scale;
                this.hitCooldown = 1000;
                this.lastPlayerHit = 0;

                this.lastBurst = Date.now();
                this.burstCooldown = 4000;

                this.facingLeft = false;
                this.animFrame = 0;
                this.animTimer = 0;
            }

            update() {
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
                this.facingLeft = Math.cos(angle) < 0;

                this.animTimer++;
                if (this.animTimer > 12) { this.animFrame = 1 - this.animFrame; this.animTimer = 0; }

                const now = Date.now();
                if (now - this.lastBurst > this.burstCooldown) {
                    this.lastBurst = now;
                    this.burstAttack();
                }
            }

            burstAttack() {
                const count = 10;
                const damage = 6 + (gameTime / 60);
                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * Math.PI * 2;
                    enemyProjectiles.push(new EnemyProjectile(
                        this.x, this.y,
                        this.x + Math.cos(angle) * 100, this.y + Math.sin(angle) * 100,
                        damage, 3.5, '#e74c3c'
                    ));
                }
                soundManager.play('enemy_ranged_shoot');
            }

            draw() {
                const size = this.radius * 3.2;
                drawSprite('boss', this.animFrame, this.x, this.y, size, this.facingLeft);

                // Barra de vida grande, fija en la parte superior de la pantalla
                const barW = canvas.width * 0.6, barH = 14;
                const bx = (canvas.width - barW) / 2, by = 14;
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(bx - 2, by - 2, barW + 4, barH + 4);
                ctx.fillStyle = '#c0392b';
                ctx.fillRect(bx, by, barW * Math.max(0, this.hp / this.maxHp), barH);
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 2;
                ctx.strokeRect(bx, by, barW, barH);
                ctx.fillStyle = '#f1c40f';
                ctx.font = 'bold 12px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('JEFE', canvas.width / 2, by + barH + 14);
            }
        }

        function trySpawnBoss() {
            if (boss) return;
            if (gameTime < BOSS_FIRST_SPAWN_TIME) return;
            if (gameTime - lastBossSpawnTime < BOSS_SPAWN_INTERVAL) return;

            boss = new Boss();
            lastBossSpawnTime = gameTime;
            soundManager.play('boss_spawn');
            showFloatingText(boss.x, boss.y, '¡JEFE!', '#e74c3c');
        }

// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // =====================  ENEMIGOS  ===========================
        // ==========================================================
        // "touchDamage" es ahora el daño de UN golpe (no por fotograma):
        // cada enemigo solo puede golpear al jugador una vez cada
        // "hitCooldown" milisegundos, en vez de dañar continuamente
        // mientras se solapan (ver Enemy.lastPlayerHit más abajo).
        const ENEMY_TYPES = [
            { key: 'enemy_zombie',   baseHp: 10, baseSpeed: 0.9, touchDamage: 4,  hitCooldown: 800,  radius: 11, weight: 5,   minTime: 0,   xp: 10 },
            { key: 'enemy_bat',      baseHp: 6,  baseSpeed: 1.7, touchDamage: 3,  hitCooldown: 500,  radius: 9,  weight: 4,   minTime: 15,  xp: 10 },
            { key: 'enemy_skeleton', baseHp: 16, baseSpeed: 0.7, touchDamage: 6,  hitCooldown: 900,  radius: 12, weight: 3,   minTime: 60,  xp: 10 },
            { key: 'enemy_slime',    baseHp: 24, baseSpeed: 0.55,touchDamage: 6,  hitCooldown: 1000, radius: 13, weight: 2,   minTime: 90,  xp: 10 },
            { key: 'enemy_ranged',   baseHp: 14, baseSpeed: 0.75,touchDamage: 3,  hitCooldown: 700,  radius: 11, weight: 0.5, minTime: 45,  xp: 14,
              ranged: true, preferredRange: 220, shootCooldown: 1900, projectileDamage: 4 },
            { key: 'enemy_elite',    baseHp: 90, baseSpeed: 0.8, touchDamage: 10, hitCooldown: 1000, radius: 18, weight: 0.4, minTime: 120, xp: 50 }
        ];

        function pickEnemyType() {
            const available = ENEMY_TYPES.filter(t => gameTime >= t.minTime);
            const totalWeight = available.reduce((s, t) => s + t.weight, 0);
            let r = Math.random() * totalWeight;
            for (const t of available) {
                if (r < t.weight) return t;
                r -= t.weight;
            }
            return available[0];
        }

        // Proyectil disparado por enemigos a distancia y por el Jefe.
        class EnemyProjectile {
            constructor(x, y, targetX, targetY, damage, speed = 4.5, color = '#9b59b6') {
                this.x = x;
                this.y = y;
                this.radius = 6;
                this.damage = damage;
                this.color = color;
                const angle = Math.atan2(targetY - y, targetX - x);
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
            }

            update() { this.x += this.vx; this.y += this.vy; }

            draw() {
                const sx = this.x - camera.x, sy = this.y - camera.y;
                ctx.beginPath();
                ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.closePath();
            }
        }

        function enemyTryShoot(enemy) {
            const now = Date.now();
            if (now - enemy.lastShot < enemy.shootCooldown) return;
            enemy.lastShot = now;
            enemyProjectiles.push(new EnemyProjectile(enemy.x, enemy.y, player.x, player.y, enemy.projectileDamage));
            soundManager.play('enemy_ranged_shoot');
        }

        class Enemy {
            constructor() {
                const type = pickEnemyType();
                this.type = type;
                this.isElite = type.key === 'enemy_elite';
                this.isRanged = !!type.ranged;

                // Aparece justo fuera del área visible actual (en coordenadas del mundo)
                const margin = 60;
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

                // Dificultad escalable según tiempo + modificadores de tótems
                const difficultyFactor = (1 + (gameTime / 60)) * (1 + difficultyModifier);

                this.radius = type.radius;
                this.speed = (type.baseSpeed + Math.random() * 0.3) * Math.min(2, 1 + (gameTime / 300)) * (1 + difficultyModifier * 0.5);
                this.maxHp = Math.floor(type.baseHp * difficultyFactor);
                this.hp = this.maxHp;
                this.touchDamage = type.touchDamage * difficultyFactor;
                this.hitCooldown = type.hitCooldown;
                this.lastPlayerHit = 0;

                // Datos específicos de los enemigos a distancia
                this.preferredRange = type.preferredRange || 0;
                this.shootCooldown = type.shootCooldown || 2000;
                this.projectileDamage = (type.projectileDamage || 0) * difficultyFactor;
                this.lastShot = Date.now() - Math.random() * this.shootCooldown; // escalona los disparos

                // Quemadura (efecto del Látigo evolucionado, ver js/weapons.js)
                this.burnUntil = 0;
                this.burnDamage = 0;

                this.facingLeft = false;
                this.animFrame = Math.random() < 0.5 ? 0 : 1;
                this.animTimer = Math.floor(Math.random() * 10);
            }

            draw() {
                const size = this.radius * (this.isElite ? 3.4 : 3);
                drawSprite(this.type.key, this.animFrame, this.x, this.y, size, this.facingLeft);

                // Barra de vida para los enemigos de élite
                if (this.isElite) {
                    const sx = this.x - camera.x, sy = this.y - camera.y;
                    const barW = 40;
                    ctx.fillStyle = 'rgba(0,0,0,0.6)';
                    ctx.fillRect(sx - barW / 2, sy - size / 2 - 12, barW, 5);
                    ctx.fillStyle = '#e74c3c';
                    ctx.fillRect(sx - barW / 2, sy - size / 2 - 12, barW * Math.max(0, this.hp / this.maxHp), 5);
                }

                // Tinte naranja mientras está quemándose (Espadazo evolucionado)
                if (this.burnUntil && Date.now() < this.burnUntil) {
                    const sx = this.x - camera.x, sy = this.y - camera.y;
                    ctx.beginPath();
                    ctx.arc(sx, sy, size / 2 + 2, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(230, 126, 34, 0.8)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // Anillos de color por cada infusión elemental activa
                drawStatusIndicators(this, this.x, this.y, size);
            }

            update() {
                const speedMult = statusSpeedMultiplier(this); // la congelación ralentiza mucho

                if (this.isRanged) {
                    // Mantiene las distancias: se acerca si está muy lejos,
                    // retrocede si está muy cerca, y dispara periódicamente.
                    const dist = Math.hypot(player.x - this.x, player.y - this.y);
                    const angle = Math.atan2(player.y - this.y, player.x - this.x);
                    if (dist > this.preferredRange * 1.15) {
                        this.x += Math.cos(angle) * this.speed * speedMult;
                        this.y += Math.sin(angle) * this.speed * speedMult;
                    } else if (dist < this.preferredRange * 0.7) {
                        this.x -= Math.cos(angle) * this.speed * 0.8 * speedMult;
                        this.y -= Math.sin(angle) * this.speed * 0.8 * speedMult;
                    }
                    this.facingLeft = player.x < this.x;
                    enemyTryShoot(this);
                } else {
                    const angle = Math.atan2(player.y - this.y, player.x - this.x);
                    const dx = Math.cos(angle), dy = Math.sin(angle);
                    this.x += dx * this.speed * speedMult;
                    this.y += dy * this.speed * speedMult;
                    if (dx !== 0) this.facingLeft = dx < 0;
                }

                // Daño de quemadura por fotograma mientras dura el efecto
                // (Espadazo evolucionado; distinto de la infusión de Llama,
                // que usa tickStatusEffects justo debajo)
                if (this.burnUntil && Date.now() < this.burnUntil) {
                    this.hp -= this.burnDamage;
                }

                // Daño continuo de las infusiones elementales (quemadura,
                // veneno, sangrado) — ver js/statuseffects.js
                tickStatusEffects(this);

                this.animTimer++;
                if (this.animTimer > 10) {
                    this.animFrame = 1 - this.animFrame;
                    this.animTimer = 0;
                }
            }
        }

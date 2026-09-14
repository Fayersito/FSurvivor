// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        function init() {
            const character = CHARACTERS[saveData.selectedCharacter];

            player = new Player(character.id);
            enemies = [];
            bullets = [];
            enemyProjectiles = [];
            gems = [];
            powerups = [];
            coinsOnMap = [];
            whips = [];
            floatingTexts = [];
            kills = 0;
            level = 1;
            xp = 0;
            xpNextLevel = 25;
            coins = 0;
            gameTime = 0;
            isGameOver = false;
            isPaused = false;
            chestsOpened = 0;
            upgradesPurchased = 0;
            difficultyModifier = 0;
            coinDropBonus = 0;
            nearbyStructure = null;
            gotLegendaryReward = false;
            bossesDefeated = 0;
            boss = null;
            lastBossSpawnTime = -Infinity;

            camera.x = clamp(player.x - canvas.width / 2, 0, WORLD_WIDTH - canvas.width);
            camera.y = clamp(player.y - canvas.height / 2, 0, WORLD_HEIGHT - canvas.height);

            generateStructures();

            // Resetear Upgrades (incluida la evolución) y dar al jugador
            // la skill inicial de su personaje
            Object.keys(UPGRADES).forEach(key => {
                UPGRADES[key].level = 0;
                if ('evolved' in UPGRADES[key]) UPGRADES[key].evolved = false;
            });
            UPGRADES[character.startWeapon].level = 1;

            // Mejoras permanentes compradas en la Tienda (aplican siempre)
            applyPermanentUpgrades();

            upgradeModal.style.display = 'none';
            rouletteModal.style.display = 'none';
            upgraderModal.style.display = 'none';
            
            updateUI();

            // Reloj de partida
            clearInterval(gameTimerInterval);
            gameTimerInterval = setInterval(() => {
                if (!isGameOver && !isPaused) {
                    gameTime++;
                    formatTime();
                }
            }, 1000);

            // Generación progresiva de enemigos
            clearInterval(spawnInterval);
            spawnInterval = setInterval(() => {
                if (!isGameOver && !isPaused) {
                    // Aparecen más enemigos conforme pasa el tiempo y según los tótems activados
                    const baseCount = Math.min(15, 1 + Math.floor(gameTime / 20));
                    const count = Math.min(22, Math.ceil(baseCount * (1 + difficultyModifier)));
                    for(let i = 0; i < count; i++) {
                        enemies.push(new Enemy());
                    }
                }
            }, 1200);

            // Reaparición periódica de cofres para que la economía no se agote
            clearInterval(chestRespawnInterval);
            chestRespawnInterval = setInterval(() => {
                if (!isGameOver && !isPaused) {
                    const chestCount = structures.filter(s => s.type === 'chest').length;
                    if (chestCount < 6) structures.push(makeStructure('chest'));
                }
            }, 20000);

            gameLoop();
        }

        function formatTime() {
            const mins = Math.floor(gameTime / 60).toString().padStart(2, '0');
            const secs = (gameTime % 60).toString().padStart(2, '0');
            timeTxt.innerText = `${mins}:${secs}`;
        }

        function checkLevelUp() {
            if (xp >= xpNextLevel) {
                xp -= xpNextLevel;
                level++;
                xpNextLevel = Math.floor(xpNextLevel * 1.4);
                
                isPaused = true;
                soundManager.play('level_up');
                showUpgradeModal();
            }
        }

        function gameLoop() {
            if (isGameOver || isPaused) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Mover jugador, actualizar cámara y dibujar fondo
            player.move();
            updateCamera();
            drawBackground();

            // 1b. Estructuras del mapa (cofres, tótems, mejorador)
            updateAndDrawStructures();

            player.draw();

            // 1c. Intenta que aparezca un Jefe (no hace nada si ya hay uno vivo o no toca)
            trySpawnBoss();

            // 2. Procesar Ataques y Ráfagas
            attackSystem();

            // Dibujar y procesar Látigos (también golpean al Jefe; aplican
            // quemadura si el arma está evolucionada — ver js/weapons.js)
            for (let i = whips.length - 1; i >= 0; i--) {
                const whip = whips[i];
                whip.draw();
                whip.duration--;

                const posX = whip.direction === 1 ? whip.x : whip.x - whip.width;
                enemies.forEach(enemy => {
                    if (enemy.x > posX && enemy.x < posX + whip.width &&
                        enemy.y > whip.y - whip.height && enemy.y < whip.y + whip.height) {
                        enemy.hp -= whip.damage;
                        showFloatingText(enemy.x, enemy.y - enemy.radius, `-${Math.round(whip.damage)}`, '#ffffff');
                        if (whip.burning) {
                            enemy.burnUntil = Date.now() + 3000;
                            enemy.burnDamage = whip.damage * 0.03;
                        }
                    }
                });
                if (boss && boss.x > posX && boss.x < posX + whip.width &&
                    boss.y > whip.y - whip.height && boss.y < whip.y + whip.height) {
                    boss.hp -= whip.damage;
                    showFloatingText(boss.x, boss.y - boss.radius, `-${Math.round(whip.damage)}`, '#ffffff');
                }

                if (whip.duration <= 0) whips.splice(i, 1);
            }

            // 3. Proyectiles del jugador (Varita / Arco): movimiento, dibujo,
            //    colisión con enemigos (con daño flotante) y con el Jefe.
            for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
                const bullet = bullets[bIdx];
                bullet.update();
                bullet.draw();

                let consumed = false;

                for (let eIdx = 0; eIdx < enemies.length; eIdx++) {
                    const enemy = enemies[eIdx];
                    const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
                    if (dist < enemy.radius + bullet.radius) {
                        enemy.hp -= bullet.damage;
                        showFloatingText(enemy.x, enemy.y - enemy.radius, `-${Math.round(bullet.damage)}`, '#ffffff');

                        // Power-up de daño en área: salpica a enemigos cercanos al impacto
                        if (player.areaDamage) {
                            enemies.forEach(other => {
                                if (other !== enemy) {
                                    const d2 = Math.hypot(other.x - bullet.x, other.y - bullet.y);
                                    if (d2 < 55) other.hp -= bullet.damage * 0.5;
                                }
                            });
                        }

                        soundManager.play('enemy_hit');

                        // La Vara Arcana evolucionada atraviesa varios enemigos (pierce)
                        if (bullet.pierce > 0) bullet.pierce--; else consumed = true;
                        break;
                    }
                }

                if (!consumed && boss) {
                    const distBoss = Math.hypot(boss.x - bullet.x, boss.y - bullet.y);
                    if (distBoss < boss.radius + bullet.radius) {
                        boss.hp -= bullet.damage;
                        showFloatingText(boss.x, boss.y - boss.radius, `-${Math.round(bullet.damage)}`, '#ffffff');
                        soundManager.play('enemy_hit');
                        if (bullet.pierce > 0) bullet.pierce--; else consumed = true;
                    }
                }

                const distFromPlayer = Math.hypot(bullet.x - player.x, bullet.y - player.y);
                if (consumed || distFromPlayer > 900 || bullet.x < 0 || bullet.x > WORLD_WIDTH || bullet.y < 0 || bullet.y > WORLD_HEIGHT) {
                    bullets.splice(bIdx, 1);
                }
            }

            // 3b. Proyectiles enemigos (enemigos a distancia y ráfaga del Jefe)
            for (let epIdx = enemyProjectiles.length - 1; epIdx >= 0; epIdx--) {
                const proj = enemyProjectiles[epIdx];
                proj.update();
                proj.draw();

                const distFromPlayer = Math.hypot(proj.x - player.x, proj.y - player.y);
                if (distFromPlayer < player.radius + proj.radius) {
                    player.hp -= proj.damage;
                    enemyProjectiles.splice(epIdx, 1);
                    updateUI();

                    const now = Date.now();
                    if (now - player.lastHitSound > 300) {
                        soundManager.play('player_hit');
                        player.lastHitSound = now;
                    }
                    if (player.hp <= 0) { endGame(); return; }
                    continue;
                }

                if (proj.x < -50 || proj.x > WORLD_WIDTH + 50 || proj.y < -50 || proj.y > WORLD_HEIGHT + 50) {
                    enemyProjectiles.splice(epIdx, 1);
                }
            }

            // 4. Gemas de Experiencia
            for (let gIdx = gems.length - 1; gIdx >= 0; gIdx--) {
                const gem = gems[gIdx];
                gem.draw();
                
                const dist = Math.hypot(gem.x - player.x, gem.y - player.y);
                if (dist < player.magnetRadius) {
                    gem.x += (player.x - gem.x) * 0.12;
                    gem.y += (player.y - gem.y) * 0.12;
                }

                if (dist < player.radius + gem.radius) {
                    xp += gem.value;
                    gems.splice(gIdx, 1);
                    soundManager.play('gem_pickup');
                    checkLevelUp();
                    updateUI();
                }
            }

            // 4b. Monedas
            for (let cIdx = coinsOnMap.length - 1; cIdx >= 0; cIdx--) {
                const coin = coinsOnMap[cIdx];
                coin.draw();

                const dist = Math.hypot(coin.x - player.x, coin.y - player.y);
                if (dist < player.magnetRadius) {
                    coin.x += (player.x - coin.x) * 0.12;
                    coin.y += (player.y - coin.y) * 0.12;
                }

                if (dist < player.radius + coin.radius) {
                    coins += coin.value;
                    coinsOnMap.splice(cIdx, 1);
                    soundManager.play('coin_pickup');
                    updateUI();
                }
            }

            // 4c. Objetos especiales (poción, imán, multidisparo, área)
            for (let pIdx = powerups.length - 1; pIdx >= 0; pIdx--) {
                const pu = powerups[pIdx];
                pu.draw();
                const dist = Math.hypot(pu.x - player.x, pu.y - player.y);
                if (dist < player.radius + pu.radius) {
                    pu.apply();
                    powerups.splice(pIdx, 1);
                }
            }

            // 5. Gestión de Enemigos (la colisión con balas ya se resolvió arriba)
            for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
                const enemy = enemies[eIdx];
                enemy.update();
                enemy.draw();

                // Muerte de Enemigo
                if (enemy.hp <= 0) {
                    enemies.splice(eIdx, 1);
                    kills++;

                    const loot = dropLoot(enemy);
                    if (loot.type === 'gem') gems.push(loot.obj);
                    else powerups.push(loot.obj);

                    // Drop de monedas independiente del botín principal
                    if (Math.random() < 0.5) {
                        const baseValue = enemy.isElite ? 15 : Math.ceil(3 + gameTime / 40);
                        const coinValue = Math.round(baseValue * (1 + coinDropBonus));
                        coinsOnMap.push(new Coin(enemy.x, enemy.y, coinValue));
                    }

                    soundManager.play('enemy_death');
                    updateUI();
                    continue;
                }

                // Colisión Enemigo - Jugador (con cooldown propio de cada enemigo,
                // para que el golpe no sea continuo mientras se solapan)
                const distPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y);
                if (distPlayer < player.radius + enemy.radius) {
                    const now = Date.now();
                    if (now - enemy.lastPlayerHit > enemy.hitCooldown) {
                        enemy.lastPlayerHit = now;
                        player.hp -= enemy.touchDamage;
                        updateUI();

                        if (now - player.lastHitSound > 300) {
                            soundManager.play('player_hit');
                            player.lastHitSound = now;
                        }

                        if (player.hp <= 0) {
                            endGame();
                            return;
                        }
                    }
                }
            }

            // 5b. El Jefe: movimiento, dibujo, muerte y contacto con el jugador
            if (boss) {
                boss.update();
                boss.draw();

                if (boss.hp <= 0) {
                    bossesDefeated++;
                    coinsOnMap.push(new Coin(boss.x, boss.y, 200));
                    gems.push(new Gem(boss.x, boss.y, 'gem_large', Math.round(150 * (1 + player.bonusXpMult))));
                    showFloatingText(boss.x, boss.y, '¡Jefe derrotado!', '#f39c12');
                    soundManager.play('boss_death');
                    boss = null;
                } else {
                    const distBoss = Math.hypot(boss.x - player.x, boss.y - player.y);
                    if (distBoss < player.radius + boss.radius) {
                        const now = Date.now();
                        if (now - boss.lastPlayerHit > boss.hitCooldown) {
                            boss.lastPlayerHit = now;
                            player.hp -= boss.touchDamage;
                            updateUI();
                            if (now - player.lastHitSound > 300) {
                                soundManager.play('player_hit');
                                player.lastHitSound = now;
                            }
                            if (player.hp <= 0) { endGame(); return; }
                        }
                    }
                }
            }

            // 6. Minimapa y textos flotantes de feedback (números de daño, avisos)
            drawMinimap();
            updateAndDrawFloatingTexts();

            requestAnimationFrame(gameLoop);
        }

        // --- FIN DE PARTIDA: análisis, Moneda Meta, logros y vuelta al menú ---
        function endGame() {
            isGameOver = true;
            soundManager.stopMusic();
            soundManager.play('game_over');

            const stats = {
                time: gameTime, kills, level, coins, chestsOpened,
                bossesDefeated, gotLegendaryReward,
                evolvedWeapon: Object.values(UPGRADES).some(u => u.evolved),
                character: player.characterId
            };
            const reward = computeMetaReward(stats);

            let newRecord = false;
            if (stats.time > saveData.bestStats.maxTime) { saveData.bestStats.maxTime = stats.time; newRecord = true; }
            if (stats.kills > saveData.bestStats.maxKills) { saveData.bestStats.maxKills = stats.kills; newRecord = true; }
            if (stats.level > saveData.bestStats.maxLevel) { saveData.bestStats.maxLevel = stats.level; newRecord = true; }

            saveData.metaCoins += reward.total;

            // Logros conseguidos por primera vez en esta partida (ya suman
            // su propia recompensa a saveData.metaCoins, ver js/achievements.js)
            const newAchievements = checkAchievements(stats);
            if (newAchievements.length > 0) soundManager.play('achievement_unlocked');

            saveData.leaderboard.push({
                character: stats.character, time: stats.time, kills: stats.kills,
                level: stats.level, coins: stats.coins, metaEarned: reward.total, date: Date.now()
            });
            saveData.leaderboard.sort((a, b) => (b.time * 2 + b.kills * 5 + b.level * 100) - (a.time * 2 + a.kills * 5 + a.level * 100));
            saveData.leaderboard = saveData.leaderboard.slice(0, 10);

            persistSave();
            renderRunSummary(stats, reward, newRecord, newAchievements);
            showScreen('run-summary');
        }

        // ==========================================================
        // ========================  ARRANQUE  =========================
        // ==========================================================
        // El juego arranca mostrando el menú principal, no la partida.
        // La partida solo empieza al pulsar "JUGAR" (ver startGameFromMenu
        // en js/menu.js), y al perder se vuelve aquí automáticamente.
        loadSave();
        renderMenu();
        showScreen('menu');

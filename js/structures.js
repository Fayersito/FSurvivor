// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // Tótems de dificultad estilo "megabonk": suben la dificultad
        // global de la partida a cambio de un beneficio permanente.
        const TOTEM_TYPES = [
            {
                id: 'totem_rage', name: 'Tótem de Furia',
                desc: 'Enemigos más fuertes a cambio de +25% de daño propio',
                difficulty: 0.15,
                benefit: () => { player.bonusDamageMult += 0.25; }
            },
            {
                id: 'totem_swarm', name: 'Tótem del Enjambre',
                desc: 'Más enemigos a cambio de +30% de monedas recogidas',
                difficulty: 0.20,
                benefit: () => { coinDropBonus += 0.30; }
            },
            {
                id: 'totem_haste', name: 'Tótem de Prisa',
                desc: 'Enemigos más rápidos a cambio de +20% de velocidad propia',
                difficulty: 0.15,
                benefit: () => { player.bonusSpeedMult += 0.20; }
            },
            {
                id: 'totem_greed', name: 'Tótem de la Codicia',
                desc: 'Enemigos más resistentes a cambio de +20% de XP ganada',
                difficulty: 0.18,
                benefit: () => { player.bonusXpMult += 0.20; }
            }
        ];

        // ==========================================================
        // ============  ESTRUCTURAS DEL MAPA (Cofres, etc.) ===========
        // ==========================================================
        function makeStructure(type, extra) {
            const margin = 150;
            let x, y, tries = 0;
            do {
                x = margin + Math.random() * (WORLD_WIDTH - margin * 2);
                y = margin + Math.random() * (WORLD_HEIGHT - margin * 2);
                tries++;
            } while (Math.hypot(x - WORLD_WIDTH / 2, y - WORLD_HEIGHT / 2) < 250 && tries < 20);

            return { type, x, y, radius: 22, used: false, data: extra };
        }

        function generateStructures() {
            structures = [];
            for (let i = 0; i < 8; i++) structures.push(makeStructure('chest'));
            TOTEM_TYPES.forEach(t => structures.push(makeStructure('totem', t)));
            structures.push(makeStructure('upgrader'));
            structures.push(makeStructure('upgrader'));
        }

        function updateAndDrawStructures() {
            nearbyStructure = null;
            let minDist = Infinity;

            structures.forEach(s => {
                drawSprite(s.type, 0, s.x, s.y, 46, false);

                const dist = Math.hypot(s.x - player.x, s.y - player.y);
                if (dist < 60 && dist < minDist) {
                    minDist = dist;
                    nearbyStructure = s;
                }
            });

            if (nearbyStructure) drawInteractPrompt(nearbyStructure);
        }

        function drawInteractPrompt(s) {
            const sx = s.x - camera.x, sy = s.y - camera.y - 42;
            let label = '';
            if (s.type === 'chest') label = `[E] Abrir cofre (${computeCost(CHEST_BASE_COST)} 🪙)`;
            else if (s.type === 'totem') label = `[E] ${s.data.name} (+${Math.round(s.data.difficulty * 100)}% dificultad)`;
            else if (s.type === 'upgrader') label = '[E] Mejorar equipo';

            ctx.save();
            ctx.font = 'bold 13px "Courier New", monospace';
            ctx.textAlign = 'center';
            const textWidth = ctx.measureText(label).width;
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.fillRect(sx - textWidth / 2 - 6, sy - 14, textWidth + 12, 20);
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(label, sx, sy);
            ctx.restore();
        }

        function handleInteract() {
            if (isGameOver || isPaused || !nearbyStructure) return;
            if (nearbyStructure.type === 'chest') tryOpenChest(nearbyStructure);
            else if (nearbyStructure.type === 'totem') tryActivateTotem(nearbyStructure);
            else if (nearbyStructure.type === 'upgrader') openUpgraderMenu();
        }

        // --- Texto flotante de feedback (monedas insuficientes, tótem activado...) ---
        function showFloatingText(worldX, worldY, text, color) {
            floatingTexts.push({ x: worldX, y: worldY, text, color, life: 60 });
        }

        function updateAndDrawFloatingTexts() {
            for (let i = floatingTexts.length - 1; i >= 0; i--) {
                const f = floatingTexts[i];
                const sx = f.x - camera.x, sy = f.y - camera.y - (60 - f.life) * 0.6;
                ctx.save();
                ctx.globalAlpha = Math.max(0, Math.min(1, f.life / 20));
                ctx.font = 'bold 14px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.fillStyle = f.color;
                ctx.fillText(f.text, sx, sy);
                ctx.restore();
                f.life--;
                if (f.life <= 0) floatingTexts.splice(i, 1);
            }
        }

        // --- Cofres ---
        function tryOpenChest(chest) {
            const cost = computeCost(CHEST_BASE_COST);
            if (coins < cost) {
                showFloatingText(chest.x, chest.y, 'Monedas insuficientes', '#e74c3c');
                soundManager.play('insufficient_funds');
                return;
            }
            coins -= cost;
            chestsOpened++;
            structures = structures.filter(s => s !== chest);
            updateUI();
            soundManager.play('chest_open');
            startRoulette();
        }

        // --- Tótems ---
        function tryActivateTotem(totem) {
            if (totem.used) return;
            totem.used = true;
            difficultyModifier += totem.data.difficulty;
            totem.data.benefit();
            structures = structures.filter(s => s !== totem);
            soundManager.play('totem_activate');
            showFloatingText(totem.x, totem.y, `${totem.data.name} activado`, '#9b59b6');
            updateUI();
        }

        // --- Mejorador de objetos ---
        function openUpgraderMenu() {
            isPaused = true;
            renderUpgraderCards();
            upgraderModal.style.display = 'flex';
        }

        function renderUpgraderCards() {
            upgraderCoinsTxt.innerText = coins;
            upgraderCardsContainer.innerHTML = '';
            Object.keys(UPGRADES).forEach(key => {
                const item = UPGRADES[key];
                const displayName = item.evolved ? WEAPON_EVOLUTIONS[key].evolvedName : item.name;
                const maxed = item.level >= item.maxLvl;
                const cost = computeCost(UPGRADER_BASE_COST) * (item.level + 1);

                const card = document.createElement('div');
                card.className = 'card';
                if (maxed) {
                    card.style.opacity = 0.5;
                } else {
                    card.style.cursor = 'pointer';
                    card.onclick = () => buyUpgrade(key, cost);
                }
                card.innerHTML = `
                    <h3>${displayName}</h3>
                    <p>${item.desc}</p>
                    <div class="lvl">Nivel ${item.level} ${maxed ? '(MÁXIMO)' : '-> ' + (item.level + 1)}</div>
                    ${maxed ? '' : `<div class="lvl" style="color:${coins >= cost ? '#2ecc71' : '#e74c3c'}">${cost} 🪙</div>`}
                `;
                upgraderCardsContainer.appendChild(card);
            });
        }

        function buyUpgrade(key, cost) {
            if (coins < cost) {
                soundManager.play('insufficient_funds');
                return;
            }
            coins -= cost;
            UPGRADES[key].level++;
            upgradesPurchased++;
            if (key === 'maxHp') { player.maxHp += 25; player.hp = Math.min(player.hp + 25, player.maxHp); }
            soundManager.play('upgrade_purchase');
            updateUI();
            renderUpgraderCards();
        }

        function closeUpgraderMenu() {
            upgraderModal.style.display = 'none';
            isPaused = false;
            requestAnimationFrame(gameLoop);
        }

// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        function showUpgradeModal() {
            cardsContainer.innerHTML = '';
            
            // Filtrar ítems que no hayan alcanzado nivel máximo
            const availableUpgrades = Object.keys(UPGRADES).filter(key => UPGRADES[key].level < UPGRADES[key].maxLvl);
            
            if (availableUpgrades.length === 0) {
                isPaused = false; // Sin opciones
                requestAnimationFrame(gameLoop);
                return;
            }

            // Seleccionar 3 aleatorios
            const shuffled = availableUpgrades.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 3);

            selected.forEach(key => {
                const item = UPGRADES[key];
                const displayName = item.evolved ? WEAPON_EVOLUTIONS[key].evolvedName : item.name;
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>${displayName}</h3>
                    <p>${item.desc}</p>
                    <div class="lvl">Nivel Actual: ${item.level} -> ${item.level + 1}</div>
                `;
                card.onclick = () => selectUpgrade(key);
                cardsContainer.appendChild(card);
            });

            upgradeModal.style.display = 'flex';
        }

        function selectUpgrade(key) {
            UPGRADES[key].level++;
            
            // Efecto directo al seleccionar Max HP
            if (key === 'maxHp') {
                player.maxHp += 25;
                player.hp = Math.min(player.hp + 25, player.maxHp);
            }

            upgradeModal.style.display = 'none';
            isPaused = false;
            updateUI();
            requestAnimationFrame(gameLoop);
        }

        function updateUI() {
            checkWeaponEvolutions();

            hpBar.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
            xpBar.style.width = `${Math.min(100, (xp / xpNextLevel) * 100)}%`;
            levelTxt.innerText = level;
            killsTxt.innerText = kills;
            coinsTxt.innerText = coins;

            const activeList = [];
            if (player.extraProjectiles > 0) activeList.push(`🎯 Multidisparo x${player.extraProjectiles}`);
            if (player.areaDamage) activeList.push('💥 Daño en área');
            powerupIndicator.innerText = activeList.join('   ·   ');
        }

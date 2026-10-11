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

        // Fila de slots de objetos equipados (tomos / objetos especiales).
        // Los slots libres pero comprables se ven atenuados; los que aún
        // no están desbloqueados (por encima de player.maxItemSlots) ni
        // se dibujan, ya que hay que comprarlos en Mejoras Permanentes.
        function renderItemSlotsRow() {
            if (!itemSlotsRow) return;
            itemSlotsRow.innerHTML = '';
            const ownedIds = Object.keys(player.items);
            for (let i = 0; i < player.maxItemSlots; i++) {
                const slot = document.createElement('div');
                if (i < ownedIds.length) {
                    const id = ownedIds[i];
                    const def = ITEM_DEFS[id];
                    const stack = player.items[id];
                    const emoji = SPRITE_DEFS[id] ? SPRITE_DEFS[id].emoji : '❔';
                    slot.className = 'item-slot filled';
                    slot.title = `${def.name} — Nivel ${stack}/${def.maxStacks}`;
                    slot.innerText = emoji;
                    if (stack > 1) {
                        const badge = document.createElement('span');
                        badge.style.cssText = 'position:absolute;bottom:-2px;right:-2px;font-size:8px;background:#f1c40f;color:#000;border-radius:50%;width:12px;height:12px;display:flex;align-items:center;justify-content:center;';
                        badge.innerText = stack;
                        slot.style.position = 'relative';
                        slot.appendChild(badge);
                    }
                } else {
                    slot.className = 'item-slot empty-buyable';
                    slot.title = 'Slot vacío';
                }
                itemSlotsRow.appendChild(slot);
            }
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

            renderItemSlotsRow();
        }

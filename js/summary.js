// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // ===============  ANÁLISIS DE FIN DE PARTIDA  ================
        // ==========================================================
        // Convierte las estadísticas de la partida en Moneda Meta,
        // la divisa persistente que se gasta en la Tienda del menú.
        function computeMetaReward(stats) {
            const fromCoins = Math.floor(stats.coins * 0.15);
            const fromTime = Math.floor(stats.time / 8);
            const fromKills = Math.floor(stats.kills * 0.6);
            const fromLevel = stats.level * 4;
            const fromChests = stats.chestsOpened * 3;
            return {
                fromCoins, fromTime, fromKills, fromLevel, fromChests,
                total: fromCoins + fromTime + fromKills + fromLevel + fromChests
            };
        }

        function renderRunSummary(stats, reward, newRecord, newAchievements) {
            document.getElementById('rs-time').innerText = formatMMSS(stats.time);
            document.getElementById('rs-level').innerText = stats.level;
            document.getElementById('rs-kills').innerText = stats.kills;
            document.getElementById('rs-coins').innerText = stats.coins;

            newRecordContainer.innerHTML = newRecord ? `<div class="new-record-badge">🏅 ¡Nuevo récord personal!</div>` : '';

            rsBreakdown.innerHTML = `
                <div><span>Por monedas conseguidas (15%)</span><span>+${reward.fromCoins} 🪙</span></div>
                <div><span>Por tiempo sobrevivido</span><span>+${reward.fromTime} 🪙</span></div>
                <div><span>Por enemigos derrotados</span><span>+${reward.fromKills} 🪙</span></div>
                <div><span>Por nivel alcanzado</span><span>+${reward.fromLevel} 🪙</span></div>
                <div><span>Por cofres abiertos</span><span>+${reward.fromChests} 🪙</span></div>
                <div class="total"><span>TOTAL GANADO</span><span>+${reward.total} 🪙✨</span></div>
            `;

            // Logros conseguidos por primera vez en esta partida
            const achievementsContainer = document.getElementById('rs-achievements-container');
            if (newAchievements && newAchievements.length > 0) {
                achievementsContainer.innerHTML = `
                    <h3 style="font-size:14px; color:#ecf0f1;">🏅 Nuevos logros conseguidos</h3>
                    <div class="summary-breakdown">
                        ${newAchievements.map(a => `<div><span>${a.name}</span><span>+${a.reward} 🪙✨</span></div>`).join('')}
                    </div>
                `;
            } else {
                achievementsContainer.innerHTML = '';
            }

            // Build final: armas y pasivas que llevaba el jugador al morir
            // (muestra el nombre evolucionado si el arma llegó a evolucionar)
            const buildContainer = document.getElementById('rs-build');
            buildContainer.innerHTML = '';
            Object.keys(UPGRADES).forEach(key => {
                const item = UPGRADES[key];
                if (item.level > 0) {
                    const displayName = item.evolved ? WEAPON_EVOLUTIONS[key].evolvedName : item.name;
                    const div = document.createElement('div');
                    div.className = 'build-item';
                    div.innerHTML = `${displayName}${item.evolved ? ' ✨' : ''} <span>Nvl ${item.level}</span>`;
                    buildContainer.appendChild(div);
                }
            });

            // Objetos/tomos equipados al morir, mismo bloque visual
            Object.keys(player.items).forEach(itemId => {
                const def = ITEM_DEFS[itemId];
                const div = document.createElement('div');
                div.className = 'build-item';
                div.innerHTML = `${def.name} <span>Nvl ${player.items[itemId]}</span>`;
                buildContainer.appendChild(div);
            });
        }

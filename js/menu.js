        // Parte del juego FSurvivor — módulo separado por mecánica.
        // Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // ===================  PANTALLAS / MENÚ  =====================
        // ==========================================================

        // Fondo opcional de las pantallas de menú (título, personajes, tienda,
        // ranking y resumen). Si "title.png" no existe en la carpeta del juego,
        // se mantiene el degradado definido en css/style.css como reserva.
        const TITLE_IMAGE = 'title.png';
        const titleImage = new Image();
        titleImage.onload = () => {
            document.querySelectorAll('.screen').forEach(el => {
                el.style.backgroundImage = `linear-gradient(rgba(10,10,16,0.72), rgba(10,10,16,0.88)), url('${TITLE_IMAGE}')`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
            });
        };
        titleImage.onerror = () => {
            console.warn(`[Sprites] No se encontró "${TITLE_IMAGE}". Se usará el fondo degradado de reserva.`);
        };
        titleImage.src = TITLE_IMAGE;

        function showScreen(name) {
            ['menu', 'characters', 'shop', 'permanent-upgrades', 'achievements', 'ranking', 'help', 'run-summary'].forEach(s => {
                document.getElementById('screen-' + s).style.display = (s === name) ? 'flex' : 'none';
            });
            gameUiWrapper.style.display = (name === 'game') ? 'block' : 'none';
        }

        // La ayuda se puede abrir tanto desde el menú como en mitad de una
        // partida (botón "❓" siempre visible). Si se abre jugando, pausa el
        // juego sin ocultar el canvas ni volver al menú al cerrarla — solo
        // restaura el estado de pausa que hubiera antes de abrirla.
        let helpOpenedFromGame = false;
        let pausedStateBeforeHelp = false;

        function openHelpScreen() {
            soundManager.play('menu_click');
            helpOpenedFromGame = (gameUiWrapper.style.display === 'block');
            if (helpOpenedFromGame) {
                pausedStateBeforeHelp = isPaused;
                isPaused = true;
            }
            document.getElementById('screen-help').style.display = 'flex';
        }

        function closeHelpScreen() {
            document.getElementById('screen-help').style.display = 'none';
            if (helpOpenedFromGame) {
                isPaused = pausedStateBeforeHelp;
                if (!isPaused) requestAnimationFrame(gameLoop);
            } else {
                showScreen('menu');
                renderMenu();
            }
        }

        function renderMenu() {
            menuMetaCoinsTxt.innerText = saveData.metaCoins;
            menuSelectedCharTxt.innerText = CHARACTERS[saveData.selectedCharacter].name;
        }

        // --- Selección de personaje ---
        function openCharacterScreen() {
            soundManager.play('menu_click');
            renderCharacterSelect();
            showScreen('characters');
        }

        function renderCharacterSelect() {
            charSelectGrid.innerHTML = '';
            Object.values(CHARACTERS).forEach(ch => {
                const unlocked = saveData.unlockedCharacters.includes(ch.id);
                const card = document.createElement('div');
                card.className = 'char-card' +
                    (ch.id === saveData.selectedCharacter ? ' selected' : '') +
                    (unlocked ? ' selectable' : ' locked-card');
                card.innerHTML = `
                    <div class="char-emoji">${ch.emoji}</div>
                    <h3>${ch.name}</h3>
                    <p>${ch.desc}</p>
                    ${unlocked ? '' : `<div class="char-status locked">🔒 Cómpralo en la Tienda</div>`}
                `;
                if (unlocked) {
                    card.onclick = () => {
                        saveData.selectedCharacter = ch.id;
                        persistSave();
                        soundManager.play('menu_click');
                        renderCharacterSelect();
                    };
                }
                charSelectGrid.appendChild(card);
            });
        }

        // --- Tienda: desbloquear personajes con Moneda Meta ---
        function openShopScreen() {
            soundManager.play('menu_click');
            renderShop();
            showScreen('shop');
        }

        function renderShop() {
            shopMetaCoinsTxt.innerText = saveData.metaCoins;
            shopGrid.innerHTML = '';
            Object.values(CHARACTERS).forEach(ch => {
                const unlocked = saveData.unlockedCharacters.includes(ch.id);
                const conditionMet = isUnlockConditionMet(ch);

                const card = document.createElement('div');
                card.className = 'char-card';

                let statusHtml = '';
                if (unlocked) {
                    statusHtml = `<div class="char-status unlocked">✅ Desbloqueado</div>`;
                } else {
                    statusHtml = `
                        <div class="char-status locked">🔒 ${ch.cost} 🪙</div>
                        <div class="char-status ${conditionMet ? 'ready' : 'notready'}">${ch.unlockCondition.label}</div>
                    `;
                }

                card.innerHTML = `
                    <div class="char-emoji">${ch.emoji}</div>
                    <h3>${ch.name}</h3>
                    <p>${ch.desc}</p>
                    ${statusHtml}
                `;

                if (!unlocked) {
                    const canBuy = conditionMet && saveData.metaCoins >= ch.cost;
                    const btn = document.createElement('button');
                    btn.innerText = 'Desbloquear';
                    btn.disabled = !canBuy;
                    btn.onclick = () => buyCharacter(ch.id);
                    card.appendChild(btn);
                }

                shopGrid.appendChild(card);
            });
        }

        function buyCharacter(id) {
            const ch = CHARACTERS[id];
            if (saveData.unlockedCharacters.includes(id)) return;
            if (!isUnlockConditionMet(ch)) return;
            if (saveData.metaCoins < ch.cost) { soundManager.play('insufficient_funds'); return; }

            saveData.metaCoins -= ch.cost;
            saveData.unlockedCharacters.push(id);
            persistSave();
            soundManager.play('character_unlock');
            renderShop();
        }

        // --- Ranking de mejores partidas ---
        function openRankingScreen() {
            soundManager.play('menu_click');
            renderRanking();
            showScreen('ranking');
        }

        function formatMMSS(totalSeconds) {
            const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
            const secs = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
            return `${mins}:${secs}`;
        }

        function renderRanking() {
            rankingBody.innerHTML = '';
            if (saveData.leaderboard.length === 0) {
                rankingBody.innerHTML = '<tr><td colspan="6">Aún no hay partidas registradas.</td></tr>';
                return;
            }
            saveData.leaderboard.forEach((entry, idx) => {
                const ch = CHARACTERS[entry.character];
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${idx + 1}</td>
                    <td>${ch ? ch.emoji + ' ' + ch.name : entry.character}</td>
                    <td>${formatMMSS(entry.time)}</td>
                    <td>${entry.level}</td>
                    <td>${entry.kills}</td>
                    <td>${entry.coins} 🪙</td>
                `;
                rankingBody.appendChild(tr);
            });
        }

        // --- Transiciones menú <-> partida ---
        function startGameFromMenu() {
            tryStartMusic();
            soundManager.play('menu_click');
            showScreen('game');
            init();
        }

        function backToMenuFromSummary() {
            showScreen('menu');
            renderMenu();
        }

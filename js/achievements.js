// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // ========================  LOGROS  ===========================
        // ==========================================================
        // Cada logro se comprueba UNA vez al final de cada partida
        // (checkAchievements, llamado desde endGame en js/main.js) contra
        // las estadísticas de esa partida. Al desbloquearse otorga Moneda
        // Meta de forma inmediata y queda registrado para siempre.
        const ACHIEVEMENTS = [
            { id: 'first_blood',  name: 'Primera Sangre',        desc: 'Consigue tu primer asesinato',              reward: 20,  check: s => s.kills >= 1 },
            { id: 'survivor_5',   name: 'Superviviente',         desc: 'Sobrevive 5 minutos en una partida',         reward: 40,  check: s => s.time >= 300 },
            { id: 'survivor_10',  name: 'Veterano',              desc: 'Sobrevive 10 minutos en una partida',        reward: 80,  check: s => s.time >= 600 },
            { id: 'kills_100',    name: 'Exterminador',          desc: 'Consigue 100 asesinatos en una partida',     reward: 50,  check: s => s.kills >= 100 },
            { id: 'kills_300',    name: 'Matanza',               desc: 'Consigue 300 asesinatos en una partida',     reward: 100, check: s => s.kills >= 300 },
            { id: 'level_10',     name: 'Poder Ascendente',      desc: 'Alcanza el nivel 10 en una partida',         reward: 40,  check: s => s.level >= 10 },
            { id: 'level_20',     name: 'Leyenda',               desc: 'Alcanza el nivel 20 en una partida',         reward: 90,  check: s => s.level >= 20 },
            { id: 'rich',         name: 'Cazatesoros',           desc: 'Consigue 500 monedas en una partida',        reward: 60,  check: s => s.coins >= 500 },
            { id: 'chest_master', name: 'Coleccionista',         desc: 'Abre 5 cofres en una partida',               reward: 50,  check: s => s.chestsOpened >= 5 },
            { id: 'legendary_pull', name: 'Golpe de Suerte',     desc: 'Consigue una recompensa Legendaria de un cofre', reward: 70, check: s => s.gotLegendaryReward },
            { id: 'boss_slayer',  name: 'Cazajefes',             desc: 'Derrota a un Jefe',                          reward: 120, check: s => s.bossesDefeated >= 1 },
            { id: 'evolved_weapon', name: 'Ascensión',           desc: 'Evoluciona un arma en una partida',          reward: 80,  check: s => s.evolvedWeapon },
            { id: 'all_characters', name: 'Coleccionista de Almas', desc: 'Desbloquea los 4 personajes',             reward: 150, check: () => Object.keys(CHARACTERS).every(id => saveData.unlockedCharacters.includes(id)) }
        ];

        // Devuelve la lista de logros recién desbloqueados en esta partida
        // (la Moneda Meta de la recompensa ya queda sumada a saveData).
        function checkAchievements(stats) {
            const newlyUnlocked = [];
            ACHIEVEMENTS.forEach(a => {
                if (saveData.achievements.includes(a.id)) return;
                if (a.check(stats)) {
                    saveData.achievements.push(a.id);
                    saveData.metaCoins += a.reward;
                    newlyUnlocked.push(a);
                }
            });
            return newlyUnlocked;
        }

        function openAchievementsScreen() {
            soundManager.play('menu_click');
            renderAchievements();
            showScreen('achievements');
        }

        function renderAchievements() {
            achievementsGrid.innerHTML = '';
            ACHIEVEMENTS.forEach(a => {
                const unlocked = saveData.achievements.includes(a.id);
                const card = document.createElement('div');
                card.className = 'char-card' + (unlocked ? '' : ' locked-card');
                card.innerHTML = `
                    <div class="char-emoji">${unlocked ? '🏆' : '🔒'}</div>
                    <h3>${a.name}</h3>
                    <p>${a.desc}</p>
                    <div class="char-status ${unlocked ? 'unlocked' : 'locked'}">${unlocked ? '✅ Conseguido' : `+${a.reward} 🪙✨`}</div>
                `;
                achievementsGrid.appendChild(card);
            });
        }

// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // ============  MEJORAS PERMANENTES (Moneda Meta)  ============
        // ==========================================================
        // A diferencia de UPGRADES (que se resetea cada partida), estas
        // se compran UNA vez con Moneda Meta y se aplican automáticamente
        // a TODAS las partidas futuras, con cualquier personaje.
        // saveData.permanentUpgrades guarda el nivel comprado de cada una
        // (0 o ausente = no comprada todavía).
        const PERMANENT_UPGRADES = {
            startDamage: { name: 'Entrenamiento',   desc: '+5% de daño inicial por nivel',            costBase: 60, maxLevel: 5 },
            startHp:     { name: 'Vitalidad',       desc: '+10 de vida máxima inicial por nivel',      costBase: 50, maxLevel: 5 },
            startMagnet: { name: 'Brújula',         desc: '+15 de radio de imán por nivel',            costBase: 40, maxLevel: 5 },
            startCoins:  { name: 'Bolsa Encantada', desc: '+10% de monedas obtenidas en partida por nivel', costBase: 70, maxLevel: 5 },
            itemSlots:   { name: 'Bolsa de Objetos', desc: '+1 slot de objetos (máx. 5 base + 7 = 12)', costBase: 500, maxLevel: 7, exponential: true }
        };

        function permanentUpgradeCost(id) {
            const def = PERMANENT_UPGRADES[id];
            const level = saveData.permanentUpgrades[id] || 0;
            // Los slots de objetos son deliberadamente carísimos y con coste
            // EXPONENCIAL (no lineal como el resto): cada slot extra cuesta
            // más del doble que el anterior, para forzar muchísimas horas
            // de partidas antes de llegar a los 12 slots.
            if (def.exponential) return Math.round(def.costBase * Math.pow(2.4, level));
            return def.costBase * (level + 1);
        }

        function buyPermanentUpgrade(id) {
            const def = PERMANENT_UPGRADES[id];
            const level = saveData.permanentUpgrades[id] || 0;
            if (level >= def.maxLevel) return;

            const cost = permanentUpgradeCost(id);
            if (saveData.metaCoins < cost) { soundManager.play('insufficient_funds'); return; }

            saveData.metaCoins -= cost;
            saveData.permanentUpgrades[id] = level + 1;
            persistSave();
            soundManager.play('upgrade_purchase');
            renderPermanentUpgrades();
        }

        // Aplica el efecto de todas las mejoras permanentes compradas al
        // jugador recién creado. Se llama desde init() (js/main.js), justo
        // después de crear al jugador.
        function applyPermanentUpgrades() {
            const lvlDamage = saveData.permanentUpgrades.startDamage || 0;
            const lvlHp = saveData.permanentUpgrades.startHp || 0;
            const lvlMagnet = saveData.permanentUpgrades.startMagnet || 0;
            const lvlCoins = saveData.permanentUpgrades.startCoins || 0;
            const lvlSlots = saveData.permanentUpgrades.itemSlots || 0;

            player.bonusDamageMult += lvlDamage * 0.05;
            player.maxHp += lvlHp * 10;
            player.hp = player.maxHp;
            player.permanentMagnetBonus = lvlMagnet * 15;
            player.coinGainMult = 1 + (lvlCoins * 0.10);
            player.maxItemSlots = 5 + lvlSlots; // 5 base, hasta 12 con los 7 niveles
        }

        function openPermanentUpgradesScreen() {
            soundManager.play('menu_click');
            renderPermanentUpgrades();
            showScreen('permanent-upgrades');
        }

        function renderPermanentUpgrades() {
            puMetaCoinsTxt.innerText = saveData.metaCoins;
            puGrid.innerHTML = '';

            Object.keys(PERMANENT_UPGRADES).forEach(id => {
                const def = PERMANENT_UPGRADES[id];
                const level = saveData.permanentUpgrades[id] || 0;
                const maxed = level >= def.maxLevel;
                const cost = permanentUpgradeCost(id);

                const card = document.createElement('div');
                card.className = 'char-card';
                card.innerHTML = `
                    <h3>${def.name}</h3>
                    <p>${def.desc}</p>
                    <div class="char-status ${maxed ? 'unlocked' : 'locked'}">Nivel ${level}/${def.maxLevel}</div>
                `;
                if (!maxed) {
                    const priceTag = document.createElement('div');
                    priceTag.className = 'char-status ' + (saveData.metaCoins >= cost ? 'ready' : 'notready');
                    priceTag.innerText = `${cost} 🪙✨`;
                    card.appendChild(priceTag);

                    const btn = document.createElement('button');
                    btn.innerText = 'Mejorar';
                    btn.disabled = saveData.metaCoins < cost;
                    btn.onclick = () => buyPermanentUpgrade(id);
                    card.appendChild(btn);
                }
                puGrid.appendChild(card);
            });
        }

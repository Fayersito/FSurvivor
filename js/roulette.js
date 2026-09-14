// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // Recompensas posibles al abrir un cofre (ruleta estilo "case opening")
        const CHEST_REWARDS = [
            { id: 'coins_small',  label: '+20 Monedas',        icon: '🪙', rarity: 'common',    weight: 28, apply: () => { coins += Math.round(20 * (1 + coinDropBonus)); } },
            { id: 'coins_medium', label: '+50 Monedas',        icon: '💰', rarity: 'common',    weight: 18, apply: () => { coins += Math.round(50 * (1 + coinDropBonus)); } },
            { id: 'gem_bundle',   label: '+40 de Experiencia', icon: '💎', rarity: 'rare',      weight: 15, apply: () => { xp += 40; checkLevelUp(); } },
            { id: 'heal_full',    label: 'Curación completa',  icon: '❤️', rarity: 'rare',      weight: 12, apply: () => { player.hp = player.maxHp; } },
            { id: 'weapon_upgrade', label: 'Mejora de arma aleatoria', icon: '⚔️', rarity: 'epic', weight: 12, apply: randomWeaponUpgrade },
            { id: 'max_hp_boost', label: '+15 Vida máxima',    icon: '🛡️', rarity: 'epic',      weight: 8,  apply: () => { player.maxHp += 15; player.hp = Math.min(player.maxHp, player.hp + 15); } },
            { id: 'multishot',    label: 'Proyectil adicional', icon: '🎯', rarity: 'epic',     weight: 7,  apply: () => { player.extraProjectiles++; } },
            { id: 'legendary_damage', label: '+10% Daño permanente', icon: '🔥', rarity: 'legendary', weight: 4, apply: () => { player.bonusDamageMult += 0.10; } },
            { id: 'legendary_speed', label: '+15% Velocidad permanente', icon: '⚡', rarity: 'legendary', weight: 3, apply: () => { player.bonusSpeedMult += 0.15; } }
        ];

        function randomWeaponUpgrade() {
            const candidates = Object.keys(UPGRADES).filter(k => UPGRADES[k].level < UPGRADES[k].maxLvl);
            if (candidates.length === 0) { coins += 30; return; } // si todo está al máximo, compensa con monedas
            const key = candidates[Math.floor(Math.random() * candidates.length)];
            UPGRADES[key].level++;
            if (key === 'maxHp') { player.maxHp += 25; player.hp = Math.min(player.hp + 25, player.maxHp); }
        }

        const ROULETTE_ITEM_WIDTH = 90;
        const ROULETTE_VIEWPORT_WIDTH = 420;

        function pickWeightedReward() {
            const totalWeight = CHEST_REWARDS.reduce((s, r) => s + r.weight, 0);
            let r = Math.random() * totalWeight;
            for (const reward of CHEST_REWARDS) {
                if (r < reward.weight) return reward;
                r -= reward.weight;
            }
            return CHEST_REWARDS[0];
        }

        function startRoulette() {
            isPaused = true;
            rouletteResult.style.display = 'none';
            rouletteModal.style.display = 'flex';

            const winningReward = pickWeightedReward();

            // Construir tira visual con relleno aleatorio + el premio real en un índice fijo
            const STRIP_LENGTH = 30;
            const TARGET_INDEX = 24;
            const items = [];
            for (let i = 0; i < STRIP_LENGTH; i++) {
                items.push(i === TARGET_INDEX ? winningReward : CHEST_REWARDS[Math.floor(Math.random() * CHEST_REWARDS.length)]);
            }

            rouletteStrip.innerHTML = '';
            rouletteStrip.style.transition = 'none';
            rouletteStrip.style.transform = 'translateX(0px)';
            items.forEach(reward => {
                const div = document.createElement('div');
                div.className = `roulette-item ${reward.rarity}`;
                div.innerText = reward.icon;
                rouletteStrip.appendChild(div);
            });

            const itemCenter = TARGET_INDEX * ROULETTE_ITEM_WIDTH + ROULETTE_ITEM_WIDTH / 2;
            const jitter = (Math.random() * 40) - 20;
            const finalTranslate = (ROULETTE_VIEWPORT_WIDTH / 2) - itemCenter + jitter;

            soundManager.play('roulette_spin');

            // Forzar reflow antes de animar para que la transición se aplique
            requestAnimationFrame(() => {
                rouletteStrip.style.transition = 'transform 3.2s cubic-bezier(0.12, 0.75, 0.15, 1)';
                rouletteStrip.style.transform = `translateX(${finalTranslate}px)`;
            });

            setTimeout(() => {
                winningReward.apply();
                showRouletteResult(winningReward);
                soundManager.play('roulette_win');
                updateUI();
            }, 3300);
        }

        function showRouletteResult(reward) {
            if (reward.rarity === 'legendary') gotLegendaryReward = true;

            rouletteResultTitle.innerText = `${reward.icon} ${reward.label}`;
            rouletteResultTitle.style.color =
                reward.rarity === 'legendary' ? '#f39c12' :
                reward.rarity === 'epic' ? '#9b59b6' :
                reward.rarity === 'rare' ? '#3498db' : '#2ecc71';
            const rarityNames = { common: 'Común', rare: 'Raro', epic: 'Épico', legendary: 'Legendario' };
            rouletteResultDesc.innerText = `Rareza: ${rarityNames[reward.rarity]}`;
            rouletteResult.style.display = 'block';
        }

        function closeRoulette() {
            rouletteModal.style.display = 'none';
            isPaused = false;
            requestAnimationFrame(gameLoop);
        }

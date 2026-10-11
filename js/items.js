// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // ===================  ITEMS / GEMAS  ========================
        // ==========================================================
        class Gem {
            constructor(x, y, spriteKey = 'gem_small', value = 10) {
                this.x = x;
                this.y = y;
                this.spriteKey = spriteKey;
                this.radius = spriteKey === 'gem_large' ? 7 : 4;
                this.value = value;
            }

            draw() {
                drawSprite(this.spriteKey, 0, this.x, this.y, this.radius * 3.5, false);
            }
        }

        class Coin {
            constructor(x, y, value = 5) {
                this.x = x;
                this.y = y;
                this.radius = 5;
                this.value = value;
            }

            draw() {
                drawSprite('coin', 0, this.x, this.y, this.radius * 3.2, false);
            }
        }

        class Powerup {
            constructor(x, y, spriteKey) {
                this.x = x;
                this.y = y;
                this.spriteKey = spriteKey;
                this.radius = 9;
            }

            draw() {
                drawSprite(this.spriteKey, 0, this.x, this.y, this.radius * 3.5, false);
            }

            apply() {
                if (this.spriteKey === 'potion_heal') {
                    player.hp = Math.min(player.maxHp, player.hp + 30);
                    soundManager.play('potion_heal');
                } else if (this.spriteKey === 'magnet_powerup') {
                    gems.forEach(g => { g.x = player.x; g.y = player.y; });
                    coinsOnMap.forEach(c => { c.x = player.x; c.y = player.y; });
                    soundManager.play('magnet_powerup');
                } else if (this.spriteKey === 'powerup_multishot') {
                    // Mejora la skill base: un proyectil/flecha adicional en abanico
                    player.extraProjectiles++;
                    soundManager.play('skill_powerup');
                    showFloatingText(this.x, this.y, '¡Proyectil adicional!', '#3498db');
                } else if (this.spriteKey === 'powerup_area') {
                    // Añade una skill nueva: los impactos hacen daño en área
                    player.areaDamage = true;
                    soundManager.play('skill_powerup');
                    showFloatingText(this.x, this.y, '¡Daño en área!', '#e67e22');
                } else if (this.spriteKey === 'powerup_freeze_field') {
                    // Instantáneo, NO ocupa slot: congela a todo lo que haya
                    // en un radio amplio alrededor del jugador nada más recogerlo.
                    const radius = 260;
                    let hitCount = 0;
                    enemies.forEach(enemy => {
                        if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < radius) {
                            applyStatus(enemy, 'freeze', 2500);
                            hitCount++;
                        }
                    });
                    if (boss && Math.hypot(boss.x - player.x, boss.y - player.y) < radius) {
                        applyStatus(boss, 'freeze', 1500); // el Jefe se resiste algo más
                    }
                    soundManager.play('freeze_field');
                    showFloatingText(this.x, this.y, `¡Campo de Hielo! (${hitCount} enemigos)`, '#5dade2');
                }
                updateUI();
            }
        }

        // ==========================================================
        // ===============  TOMOS Y OBJETOS ESPECIALES  ================
        // ==========================================================
        // A diferencia de Powerup (efecto instantáneo, no ocupa slot), un
        // ITEM se EQUIPA: ocupa uno de los slots de player.items y su
        // efecto dura toda la partida (o se activa periódicamente). Si ya
        // tienes ese objeto, recogerlo de nuevo sube su nivel de stack en
        // vez de gastar un slot nuevo. maxStacks limita cuánto puede
        // acumularse cada uno. "rarity" solo se usa para el peso al elegir
        // qué objeto suelta un enemigo (ver pickRandomItemId más abajo).
        const ITEM_DEFS = {
            tome_life:       { name: 'Tomo de Vida',        maxStacks: 5, rarity: 'common', color: '#e74c3c',
                                desc: '+20 de vida máxima por nivel (cura lo mismo al recogerlo)' },
            tome_strength:   { name: 'Tomo de Fuerza',      maxStacks: 5, rarity: 'common', color: '#e67e22',
                                desc: '+8% de daño con todas las armas por nivel' },
            tome_speed:      { name: 'Tomo de Velocidad',   maxStacks: 5, rarity: 'common', color: '#2ecc71',
                                desc: '+10% de velocidad de movimiento por nivel' },
            tome_vampirism:  { name: 'Tomo de Robo de Vida', maxStacks: 5, rarity: 'common', color: '#c0392b',
                                desc: '+2% de robo de vida por nivel, con cualquier ataque' },
            tome_luck:       { name: 'Tomo de la Suerte',   maxStacks: 5, rarity: 'common', color: '#f1c40f',
                                desc: '+5% de monedas y mejor probabilidad de objetos raros en cofres, por nivel' },
            tome_elemental:  { name: 'Tomo Elemental',      maxStacks: 5, rarity: 'uncommon', color: '#9b59b6',
                                desc: '+5% de probabilidad de proc elemental por nivel (incluso sin infusiones)' },
            tome_chronos:    { name: 'Tomo de Chronos',     maxStacks: 3, rarity: 'rare', color: '#5dade2',
                                desc: 'Detiene el tiempo para los enemigos cada cierto tiempo. Más nivel = más frecuente y dura más' },
            item_berserker:  { name: 'Reliquia del Berserker', maxStacks: 3, rarity: 'rare', color: '#c0392b',
                                desc: 'Cuanta menos vida te queda, más daño haces. Arriesgado pero devastador' },
            item_phoenix:    { name: 'Pluma de Fénix',      maxStacks: 3, rarity: 'legendary', color: '#f39c12',
                                desc: 'Al recibir un golpe mortal, revives con 50% de vida en vez de morir (una vez por carga)' },
            item_bloodfrenzy:{ name: 'Frenesí Sangriento',  maxStacks: 3, rarity: 'uncommon', color: '#922b21',
                                desc: 'Cada asesinato aumenta tu daño y velocidad brevemente. La racha se acumula matando seguido' },
            item_permafrost: { name: 'Núcleo de Permaescarcha', maxStacks: 3, rarity: 'rare', color: '#85c1e9',
                                desc: 'Al rematar a un enemigo congelado, propaga la congelación a los enemigos cercanos' }
        };

        // Objeto en el suelo. Al tocarlo, el jugador lo EQUIPA (o sube su
        // stack) mediante tryCollectItem(), no aplica un efecto instantáneo.
        class ItemPickup {
            constructor(x, y, itemId) {
                this.x = x;
                this.y = y;
                this.itemId = itemId;
                this.radius = 10;
            }

            draw() {
                drawSprite(this.itemId, 0, this.x, this.y, this.radius * 3.5, false);
            }
        }

        // Elige un id de objeto al azar, ponderado por rareza, para los
        // drops de enemigos (ver dropLoot) y la recompensa "objeto aleatorio"
        // de la ruleta de cofres (ver js/roulette.js).
        const ITEM_RARITY_WEIGHTS = { common: 10, uncommon: 5, rare: 2, legendary: 0.6 };
        function pickRandomItemId() {
            const ids = Object.keys(ITEM_DEFS);
            const totalWeight = ids.reduce((s, id) => s + ITEM_RARITY_WEIGHTS[ITEM_DEFS[id].rarity], 0);
            let r = Math.random() * totalWeight;
            for (const id of ids) {
                const w = ITEM_RARITY_WEIGHTS[ITEM_DEFS[id].rarity];
                if (r < w) return id;
                r -= w;
            }
            return ids[0];
        }

        // Aplica el efecto correspondiente a HABER SUBIDO a "newStack". Para
        // los tomos aditivos se suma solo el incremento de ESTE nivel (por
        // eso se llama una vez por cada subida, nunca recalculando desde 0).
        function applyItemStackEffect(itemId, newStack) {
            switch (itemId) {
                case 'tome_life':
                    player.maxHp += 20;
                    player.hp += 20;
                    break;
                case 'tome_strength':
                    player.bonusDamageMult += 0.08;
                    break;
                case 'tome_speed':
                    player.bonusSpeedMult += 0.10;
                    break;
                case 'tome_vampirism':
                    player.lifestealBonus += 0.02;
                    break;
                case 'tome_luck':
                    player.luckStacks = newStack;
                    break;
                case 'tome_elemental':
                    player.elementalStacks = newStack;
                    player.elementalProcBonus = newStack * 0.05;
                    break;
                // El resto (tome_chronos, item_berserker, item_phoenix,
                // item_bloodfrenzy, item_permafrost) no suman un delta fijo:
                // su efecto se lee directamente de player.items[itemId] en
                // itemsPeriodicSystem(), los getters de Player o el punto
                // donde ocurre el evento correspondiente (muerte, golpe...).
            }
        }

        // Intenta que el jugador recoja/equipe un objeto. Si ya lo tiene,
        // sube su stack (sin gastar slot nuevo) hasta su máximo. Si es un
        // objeto NUEVO y no quedan slots libres, se convierte en monedas de
        // consuelo en vez de perderse sin más.
        function tryCollectItem(itemId) {
            const def = ITEM_DEFS[itemId];
            const owned = player.items[itemId] || 0;

            if (owned > 0) {
                if (owned >= def.maxStacks) {
                    const bonus = 15;
                    coins += bonus;
                    showFloatingText(player.x, player.y - 24, `${def.name} al máximo (+${bonus} 🪙)`, '#f1c40f');
                    soundManager.play('item_slot_full');
                    updateUI();
                    return;
                }
                player.items[itemId] = owned + 1;
                applyItemStackEffect(itemId, player.items[itemId]);
                showFloatingText(player.x, player.y - 24, `${def.name} Nvl ${player.items[itemId]}`, def.color);
                soundManager.play('tome_pickup');
                updateUI();
                return;
            }

            const distinctOwned = Object.keys(player.items).length;
            if (distinctOwned >= player.maxItemSlots) {
                const bonus = 25;
                coins += bonus;
                showFloatingText(player.x, player.y - 24, `Slots llenos (+${bonus} 🪙)`, '#e74c3c');
                soundManager.play('item_slot_full');
                updateUI();
                return;
            }

            player.items[itemId] = 1;
            applyItemStackEffect(itemId, 1);
            showFloatingText(player.x, player.y - 24, `¡${def.name}!`, def.color);
            soundManager.play('tome_pickup');
            updateUI();
        }

        // Objetos ACTIVOS con temporizador propio (Tomo de Chronos). Se
        // llama cada fotograma desde gameLoop() (js/main.js).
        function itemsPeriodicSystem() {
            const chronosStacks = player.items.tome_chronos || 0;
            if (chronosStacks > 0) {
                const interval = 20000 - chronosStacks * 3000; // más nivel = más frecuente
                const now = Date.now();
                if (now - player.lastChronosTrigger > interval) {
                    player.lastChronosTrigger = now;
                    const stopDuration = 2000 + chronosStacks * 600;
                    enemies.forEach(enemy => applyStatus(enemy, 'freeze', stopDuration));
                    if (boss) applyStatus(boss, 'freeze', Math.round(stopDuration * 0.6));
                    soundManager.play('chronos_activate');
                    showFloatingText(player.x, player.y - 34, '⏳ ¡El tiempo se detiene!', '#5dade2');
                }
            }
        }

        // Pluma de Fénix: se llama justo ANTES de dar la partida por
        // perdida. Si el jugador tiene cargas, consume una y le salva la
        // vida en vez de terminar la partida.
        function tryPhoenixSave() {
            const charges = player.items.item_phoenix || 0;
            if (charges <= 0) return false;

            player.items.item_phoenix = charges - 1;
            if (player.items.item_phoenix <= 0) delete player.items.item_phoenix;

            player.hp = Math.round(player.maxHp * 0.5);
            soundManager.play('phoenix_revive');
            showFloatingText(player.x, player.y - 30, '🔥 ¡La Pluma de Fénix te revive!', '#f39c12');
            updateUI();
            return true;
        }

        // Frenesí Sangriento: se llama al matar a un enemigo o al Jefe.
        function registerKillForFrenzy() {
            if (!player.items.item_bloodfrenzy) return;
            const maxStacks = 4 + (player.items.item_bloodfrenzy * 2); // más nivel = más techo de racha
            player.frenzyStacks = Math.min(maxStacks, player.frenzyStacks + 1);
            player.frenzyExpiresAt = Date.now() + 3000;
        }

        // Decide qué suelta un enemigo al morir (además de la moneda, ver gameLoop)
        function dropLoot(enemy) {
            const roll = Math.random();
            if (roll < 0.012) return { type: 'powerup', obj: new Powerup(enemy.x, enemy.y, 'potion_heal') };
            if (roll < 0.022) return { type: 'powerup', obj: new Powerup(enemy.x, enemy.y, 'magnet_powerup') };
            if (roll < 0.030) return { type: 'powerup', obj: new Powerup(enemy.x, enemy.y, 'powerup_multishot') };
            if (roll < 0.038) return { type: 'powerup', obj: new Powerup(enemy.x, enemy.y, 'powerup_area') };
            if (roll < 0.044) return { type: 'powerup', obj: new Powerup(enemy.x, enemy.y, 'powerup_freeze_field') };
            if (roll < 0.062) return { type: 'item', obj: new ItemPickup(enemy.x, enemy.y, pickRandomItemId()) };
            if (enemy.isElite) return { type: 'gem', obj: new Gem(enemy.x, enemy.y, 'gem_large', Math.round(enemy.type.xp * (1 + player.bonusXpMult))) };
            return { type: 'gem', obj: new Gem(enemy.x, enemy.y, 'gem_small', Math.round(enemy.type.xp * (1 + player.bonusXpMult))) };
        }

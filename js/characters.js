// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // ===================  PERSONAJES  ===========================
        // ==========================================================
        // Cada personaje tiene un arma inicial única (su "skill" propia,
        // ver js/weapons.js), un coste en Moneda Meta y, opcionalmente,
        // una condición que hay que cumplir en una partida antes de
        // poder comprarlo en la Tienda.
        const CHARACTERS = {
            knight: {
                id: 'knight', name: 'Caballero', emoji: '🛡️', spriteKey: 'player_knight',
                startWeapon: 'whip', cost: 0, unlockCondition: null,
                desc: 'Golpe cercano con su espada a ambos lados.'
            },
            mage: {
                id: 'mage', name: 'Mago', emoji: '🧙', spriteKey: 'player_mage',
                startWeapon: 'wand', cost: 0, unlockCondition: null,
                desc: 'Dispara un único proyectil potente a larga distancia.'
            },
            chad: {
                id: 'chad', name: 'Chad', emoji: '💪', spriteKey: 'player_chad',
                startWeapon: 'garlic', cost: 150,
                unlockCondition: { type: 'survive_time', value: 300, label: 'Sobrevive 5:00 minutos en una partida' },
                desc: 'Genera un aura que daña continuamente a su alrededor.'
            },
            archer: {
                id: 'archer', name: 'Arquero', emoji: '🏹', spriteKey: 'player_archer',
                startWeapon: 'bow', cost: 250,
                unlockCondition: { type: 'kills', value: 150, label: 'Consigue 150 asesinatos en una partida' },
                desc: 'Dispara varias flechas débiles en abanico.'
            }
        };

        // Comprueba si el jugador ya ha cumplido la condición de desbloqueo
        // de un personaje, comparando contra sus mejores marcas guardadas.
        function isUnlockConditionMet(character) {
            if (!character.unlockCondition) return true;
            const c = character.unlockCondition;
            if (c.type === 'survive_time') return saveData.bestStats.maxTime >= c.value;
            if (c.type === 'kills') return saveData.bestStats.maxKills >= c.value;
            if (c.type === 'level') return saveData.bestStats.maxLevel >= c.value;
            return false;
        }

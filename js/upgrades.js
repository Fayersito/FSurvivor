// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // Base de datos de Items y Upgrades.
        // El nivel inicial de las armas de personaje NO se fija aquí: lo
        // determina el personaje elegido (ver js/characters.js
        // "startWeapon"), asignado en init() (js/main.js). El campo
        // "evolved" (false por defecto) lo activa checkWeaponEvolutions()
        // (js/weapons.js) cuando se cumplen las condiciones de
        // WEAPON_EVOLUTIONS más abajo. Todas las armas y habilidades
        // apuntan hacia el cursor del ratón (o el joystick/última dirección
        // de movimiento en móvil), ver js/aiming.js.
        const UPGRADES = {
            // Armas de personaje — cada una es la skill única de un personaje
            wand: { name: 'Varita Mágica', type: 'weapon', desc: 'Dispara un proyectil potente hacia el cursor (Mago)', level: 0, maxLvl: 5, evolved: false },
            garlic: { name: 'Aura Avena', type: 'weapon', desc: 'Crea una zona que daña continuamente a los enemigos (Chad)', level: 0, maxLvl: 5, evolved: false },
            whip: { name: 'Espadazo', type: 'weapon', desc: 'Espadazo en arco hacia donde apunta el cursor (Caballero)', level: 0, maxLvl: 5, evolved: false },
            bow: { name: 'Arco Múltiple', type: 'weapon', desc: 'Dispara varias flechas débiles en abanico hacia el cursor (Arquero)', level: 0, maxLvl: 5, evolved: false },

            // Habilidades adicionales — desbloqueables por CUALQUIER personaje,
            // no dependen de con quién empieces la partida (ver js/skills.js)
            boomerang: {
                name: 'Bumerán', type: 'weapon',
                desc: 'Lanza bumeranes que van y vuelven golpeando dos veces. Más nivel = más bumeranes y más grandes',
                level: 0, maxLvl: 5, evolved: false
            },
            totemStorm: {
                name: 'Tótems de Tormenta', type: 'weapon',
                desc: 'Invoca tótems temporales que descargan rayos sobre los enemigos cercanos. Más nivel = más tótems a la vez, más duración, más daño y alcance',
                level: 0, maxLvl: 5, evolved: false
            },

            // Infusiones elementales — pasivas que dan una probabilidad de
            // aplicar un efecto de estado a cualquier golpe (bala, espadazo,
            // bumerán, rayo de tótem...). Ver js/statuseffects.js.
            frostInfusion: { name: 'Escarcha', type: 'passive', desc: 'Probabilidad de congelar (ralentizar mucho) al golpear', level: 0, maxLvl: 5 },
            shockInfusion: { name: 'Descarga', type: 'passive', desc: 'Probabilidad de electrocutar al golpear (extra si el objetivo está mojado)', level: 0, maxLvl: 5 },
            fireInfusion:  { name: 'Llama', type: 'passive', desc: 'Probabilidad de quemar (daño continuo) al golpear', level: 0, maxLvl: 5 },
            poisonInfusion: { name: 'Veneno', type: 'passive', desc: 'Probabilidad de envenenar (daño continuo acumulable hasta x3) al golpear', level: 0, maxLvl: 5 },
            bleedInfusion: { name: 'Sangrado', type: 'passive', desc: 'Probabilidad de causar sangrado (daño continuo) al golpear', level: 0, maxLvl: 5 },
            lifeDrain:     { name: 'Robo de Vida', type: 'passive', desc: 'Recupera vida en base al daño infligido con cualquier ataque', level: 0, maxLvl: 5 },

            // Pasivas clásicas
            damage: { name: 'Espinaca', type: 'passive', desc: 'Aumenta el daño de todas las armas un 20%', level: 0, maxLvl: 5 },
            cooldown: { name: 'Reloj de Arena', type: 'passive', desc: 'Reduce el tiempo de recarga de los ataques', level: 0, maxLvl: 5 },
            speed: { name: 'Botas', type: 'passive', desc: 'Aumenta tu velocidad de movimiento', level: 0, maxLvl: 5 },
            magnet: { name: 'Imán', type: 'passive', desc: 'Aumenta el rango de atracción de objetos', level: 0, maxLvl: 5 },
            maxHp: { name: 'Armadura', type: 'passive', desc: 'Aumenta la salud máxima', level: 0, maxLvl: 5 }
        };

        // Evolución de armas: al llegar el arma Y la pasiva indicada a su
        // nivel máximo, el arma se transforma automáticamente (ver
        // checkWeaponEvolutions en js/weapons.js). Bumerán y Tótems de
        // Tormenta no son el arma de inicio de ningún personaje, así que
        // de momento no tienen evolución propia — su escalado ya viene
        // dado por sus 5 niveles (más unidades, tamaño, daño y duración).
        const WEAPON_EVOLUTIONS = {
            whip:   { requiresPassive: 'damage',   evolvedName: 'Espada Sagrada', evolvedDesc: 'Arco más amplio, más daño y quema al golpear' },
            wand:   { requiresPassive: 'cooldown', evolvedName: 'Vara Arcana',    evolvedDesc: 'Proyectil grande que atraviesa enemigos' },
            garlic: { requiresPassive: 'maxHp',     evolvedName: 'Aura Divina',    evolvedDesc: 'Aura más grande que también cura al golpear' },
            bow:    { requiresPassive: 'speed',     evolvedName: 'Lluvia de Flechas', evolvedDesc: 'Dispara con mucha más frecuencia' }
        };

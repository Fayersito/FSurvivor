// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // Base de datos de Items y Upgrades.
        // El nivel inicial de las armas NO se fija aquí: lo determina el
        // personaje elegido (ver js/characters.js "startWeapon"), asignado
        // en init() (js/main.js). El campo "evolved" (false por defecto)
        // lo activa checkWeaponEvolutions() (js/weapons.js) cuando se
        // cumplen las condiciones de WEAPON_EVOLUTIONS más abajo.
        const UPGRADES = {
            // Armas — cada una es la skill única de un personaje
            wand: { name: 'Varita Mágica', type: 'weapon', desc: 'Dispara un proyectil potente al enemigo más cercano (Mago)', level: 0, maxLvl: 5, evolved: false },
            garlic: { name: 'Aura Avena', type: 'weapon', desc: 'Crea una zona que daña continuamente a los enemigos (Chad)', level: 0, maxLvl: 5, evolved: false },
            whip: { name: 'Látigo', type: 'weapon', desc: 'Ataca cuerpo a cuerpo a ambos lados (Caballero)', level: 0, maxLvl: 5, evolved: false },
            bow: { name: 'Arco Múltiple', type: 'weapon', desc: 'Dispara varias flechas débiles en abanico (Arquero)', level: 0, maxLvl: 5, evolved: false },

            // Pasivas
            damage: { name: 'Espinaca', type: 'passive', desc: 'Aumenta el daño de todas las armas un 20%', level: 0, maxLvl: 5 },
            cooldown: { name: 'Reloj de Arena', type: 'passive', desc: 'Reduce el tiempo de recarga de los ataques', level: 0, maxLvl: 5 },
            speed: { name: 'Botas', type: 'passive', desc: 'Aumenta tu velocidad de movimiento', level: 0, maxLvl: 5 },
            magnet: { name: 'Imán', type: 'passive', desc: 'Aumenta el rango de atracción de objetos', level: 0, maxLvl: 5 },
            maxHp: { name: 'Armadura', type: 'passive', desc: 'Aumenta la salud máxima', level: 0, maxLvl: 5 }
        };

        // Evolución de armas: al llegar el arma Y la pasiva indicada a su
        // nivel máximo, el arma se transforma automáticamente (ver
        // checkWeaponEvolutions en js/weapons.js).
        const WEAPON_EVOLUTIONS = {
            whip:   { requiresPassive: 'damage',   evolvedName: 'Látigo Sagrado', evolvedDesc: 'Más ancho, más daño y quema al golpear' },
            wand:   { requiresPassive: 'cooldown', evolvedName: 'Vara Arcana',    evolvedDesc: 'Proyectil grande que atraviesa enemigos' },
            garlic: { requiresPassive: 'maxHp',     evolvedName: 'Aura Divina',    evolvedDesc: 'Aura más grande que también cura al golpear' },
            bow:    { requiresPassive: 'speed',     evolvedName: 'Lluvia de Flechas', evolvedDesc: 'Dispara con mucha más frecuencia' }
        };

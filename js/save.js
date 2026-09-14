// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // ============  GUARDADO PERSISTENTE (localStorage)  ==========
        // ==========================================================
        // Todo el progreso (Moneda Meta, personajes desbloqueados,
        // mejoras permanentes, logros y ranking) se guarda en el
        // navegador y persiste entre sesiones.
        const SAVE_KEY = 'fsurvivorSave_v1';
        let saveData = null;

        function defaultSaveData() {
            return {
                metaCoins: 0,
                unlockedCharacters: ['knight', 'mage'],
                selectedCharacter: 'knight',
                bestStats: { maxTime: 0, maxKills: 0, maxLevel: 0 },
                leaderboard: [],
                permanentUpgrades: {}, // { id: nivelComprado }
                achievements: []       // ids de logros ya conseguidos
            };
        }

        function loadSave() {
            try {
                const raw = localStorage.getItem(SAVE_KEY);
                if (raw) saveData = JSON.parse(raw);
            } catch (e) {
                console.warn('No se pudo leer el progreso guardado', e);
            }
            if (!saveData) saveData = defaultSaveData();

            // Compatibilidad hacia delante: si el guardado es de una versión
            // anterior sin alguno de estos campos, se rellena con su valor
            // por defecto sin perder el resto del progreso ya guardado.
            const defaults = defaultSaveData();
            Object.keys(defaults).forEach(key => {
                if (saveData[key] === undefined) saveData[key] = defaults[key];
            });
        }

        function persistSave() {
            try { localStorage.setItem(SAVE_KEY, JSON.stringify(saveData)); }
            catch (e) { console.warn('No se pudo guardar el progreso', e); }
        }

        function resetProgress() {
            if (!confirm('¿Seguro que quieres borrar todo tu progreso guardado (monedas, personajes, mejoras, logros y ranking)?')) return;
            try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
            loadSave();
            renderMenu();
        }

// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // ============  GUARDADO PERSISTENTE (localStorage)  ==========
        // ==========================================================
        // Todo el progreso (Moneda Meta, personajes desbloqueados,
        // mejoras permanentes, logros y ranking) se guarda en el
        // navegador y persiste entre sesiones.
        //
        // SAVE_VERSION identifica la forma actual de saveData. Si en el
        // futuro se añaden o cambian campos, se sube este número y se
        // añade una migración en migrateSaveData() para que el progreso
        // de quien ya jugó no se pierda al actualizar el juego.
        const SAVE_KEY = 'fsurvivorSave_v1';
        const SAVE_VERSION = 1;
        let saveData = null;

        function defaultSaveData() {
            return {
                version: SAVE_VERSION,
                metaCoins: 0,
                unlockedCharacters: ['knight', 'mage'],
                selectedCharacter: 'knight',
                bestStats: { maxTime: 0, maxKills: 0, maxLevel: 0 },
                leaderboard: [],
                permanentUpgrades: {}, // { id: nivelComprado }
                achievements: [],      // ids de logros ya conseguidos
                muted: false
            };
        }

        // Ajusta un saveData antiguo (sin "version" o con una versión menor)
        // a la forma actual, rellenando solo lo que falte, sin tocar el
        // progreso que sí existe. Cada "case" cae al siguiente a propósito,
        // para poder migrar de golpe desde una versión muy vieja.
        function migrateSaveData(data) {
            const fromVersion = data.version || 0;

            switch (fromVersion) {
                case 0:
                // Guardados de antes de existir "version": no tenían
                // permanentUpgrades ni achievements como campos garantizados.
                // (no hace falta "break": cae al relleno de defaults de abajo)
            }

            const defaults = defaultSaveData();
            Object.keys(defaults).forEach(key => {
                if (data[key] === undefined) data[key] = defaults[key];
            });
            data.version = SAVE_VERSION;
            return data;
        }

        function loadSave() {
            try {
                const raw = localStorage.getItem(SAVE_KEY);
                if (raw) saveData = JSON.parse(raw);
            } catch (e) {
                console.warn('No se pudo leer el progreso guardado', e);
            }

            if (!saveData) {
                saveData = defaultSaveData();
            } else if (saveData.version !== SAVE_VERSION) {
                saveData = migrateSaveData(saveData);
                persistSave();
            }
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

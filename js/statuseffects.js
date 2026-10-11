// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // ===============  EFECTOS DE ESTADO ELEMENTALES  =============
        // ==========================================================
        // Sistema centralizado de estados que puede aplicar cualquier
        // arma/habilidad (a través de onWeaponHit, más abajo) a cualquier
        // enemigo o al Jefe. Sinergias implementadas:
        //   - "Añicos": golpear a un enemigo CONGELADO hace daño extra
        //     y lo descongela (congelación + golpe = rotura).
        //   - "Mojado + Eléctrico": si el objetivo está MOJADO (efecto
        //     secundario de congelar, el hielo se derrite) y recibe una
        //     descarga, sufre daño eléctrico extra inmediato.
        //   - "Mojado + Helar": si el objetivo ya estaba MOJADO al volver
        //     a congelarlo, la congelación dura un 50% más.
        function ensureStatuses(entity) {
            if (!entity.statuses) {
                entity.statuses = {
                    burn:   { until: 0, dps: 0 },
                    poison: { until: 0, dps: 0, stacks: 0 },
                    freeze: { until: 0 },
                    shock:  { until: 0 },
                    bleed:  { until: 0, dps: 0 },
                    wet:    { until: 0 }
                };
            }
            return entity.statuses;
        }

        function hasStatus(entity, type) {
            const st = ensureStatuses(entity);
            return !!(st[type] && st[type].until > Date.now());
        }

        // Aplica (o refresca) un efecto de estado sobre un enemigo/Jefe.
        // "power" tiene un significado distinto según el tipo:
        //   burn/poison/bleed -> daño por fotograma mientras dura
        //   shock -> daño extra inmediato SOLO si el objetivo está mojado
        //   freeze -> no usa "power"
        function applyStatus(entity, type, durationMs, power = 0) {
            const st = ensureStatuses(entity);
            const now = Date.now();

            if (type === 'freeze') {
                const wasWet = hasStatus(entity, 'wet');
                const finalDuration = wasWet ? durationMs * 1.5 : durationMs; // sinergia: mojado + helar
                st.freeze.until = now + finalDuration;
                // Congelar moja (el hielo se derrite): la humedad dura algo más que la congelación
                st.wet.until = Math.max(st.wet.until, now + finalDuration + 2000);
            } else if (type === 'shock') {
                st.shock.until = now + durationMs;
                if (hasStatus(entity, 'wet')) { // sinergia: mojado + eléctrico
                    entity.hp -= power;
                    showFloatingText(entity.x, entity.y - (entity.radius || 20) - 10, `⚡-${Math.round(power)}`, '#f4d03f');
                }
            } else if (type === 'poison') {
                const wasActive = st.poison.until > now;
                st.poison.until = now + durationMs;
                st.poison.stacks = Math.min(3, (wasActive ? st.poison.stacks : 0) + 1);
                st.poison.dps = power;
            } else if (type === 'burn') {
                st.burn.until = now + durationMs;
                st.burn.dps = Math.max(st.burn.dps, power);
            } else if (type === 'bleed') {
                st.bleed.until = now + durationMs;
                st.bleed.dps = Math.max(st.bleed.dps, power);
            } else if (type === 'wet') {
                // Aplicable también de forma directa (p.ej. una futura
                // habilidad de agua), aunque hoy en día lo normal es que
                // llegue como efecto secundario de congelar (línea de arriba).
                st.wet.until = Math.max(st.wet.until, now + durationMs);
            }
        }

        // Aplica el daño continuo (quemadura/veneno/sangrado) de un
        // fotograma. Se llama desde el update() de Enemy y Boss.
        function tickStatusEffects(entity) {
            if (!entity.statuses) return;
            const now = Date.now();
            const st = entity.statuses;
            if (st.burn.until > now) entity.hp -= st.burn.dps;
            if (st.poison.until > now) entity.hp -= st.poison.dps * st.poison.stacks;
            if (st.bleed.until > now) entity.hp -= st.bleed.dps;
        }

        // La congelación ralentiza mucho el movimiento (no lo detiene del
        // todo, para que siga siendo interactivo). Se usa como multiplicador
        // de velocidad en Enemy.update()/Boss.update().
        function statusSpeedMultiplier(entity) {
            return hasStatus(entity, 'freeze') ? 0.15 : 1;
        }

        // Dibuja pequeños indicadores de color sobre un enemigo/Jefe según
        // sus efectos de estado activos. worldX/worldY en coordenadas de
        // mundo; size = tamaño en pantalla del sprite (para el radio del anillo).
        function drawStatusIndicators(entity, worldX, worldY, size) {
            if (!entity.statuses) return;
            const sx = worldX - camera.x, sy = worldY - camera.y;
            const ringR = size / 2 + 2;
            const now = Date.now();
            const active = [];
            if (entity.statuses.burn.until > now) active.push('#e67e22');
            if (entity.statuses.poison.until > now) active.push('#8e44ad');
            if (entity.statuses.freeze.until > now) active.push('#5dade2');
            if (entity.statuses.shock.until > now) active.push('#f4d03f');
            if (entity.statuses.bleed.until > now) active.push('#c0392b');
            if (active.length === 0) return;

            ctx.save();
            ctx.lineWidth = 2;
            active.forEach((color, i) => {
                ctx.beginPath();
                ctx.arc(sx, sy, ringR + i * 3, 0, Math.PI * 2);
                ctx.strokeStyle = color;
                ctx.stroke();
            });
            ctx.restore();
        }

        // ==========================================================
        // ==========  GANCHO CENTRAL DE IMPACTO (PROCS + ROBO DE VIDA) ==
        // ==========================================================
        // Se llama DESPUÉS de restar el daño base de un golpe (bala,
        // espadazo, bumerán, tótem...) sobre cualquier enemigo o el Jefe.
        // Aquí se resuelve la sinergia "Añicos", se sortea cada infusión
        // elemental activa y se aplica el robo de vida.
        function onWeaponHit(entity, damage) {
            ensureStatuses(entity);

            // Sinergia "Añicos": golpear algo congelado rompe el hielo con daño extra
            if (hasStatus(entity, 'freeze')) {
                const shatterDamage = damage * 0.8;
                entity.hp -= shatterDamage;
                entity.statuses.freeze.until = 0;
                showFloatingText(entity.x, entity.y - (entity.radius || 20) - 14, `💥 -${Math.round(shatterDamage)}`, '#5dade2');
            }

            // Infusiones elementales: probabilidad de proc según nivel
            if (UPGRADES.frostInfusion.level > 0 && Math.random() < 0.15 + UPGRADES.frostInfusion.level * 0.07) {
                applyStatus(entity, 'freeze', 900 + UPGRADES.frostInfusion.level * 250);
            }
            if (UPGRADES.fireInfusion.level > 0 && Math.random() < 0.15 + UPGRADES.fireInfusion.level * 0.07) {
                applyStatus(entity, 'burn', 3000, 0.15 + UPGRADES.fireInfusion.level * 0.08);
            }
            if (UPGRADES.poisonInfusion.level > 0 && Math.random() < 0.15 + UPGRADES.poisonInfusion.level * 0.07) {
                applyStatus(entity, 'poison', 4000, 0.10 + UPGRADES.poisonInfusion.level * 0.05);
            }
            if (UPGRADES.bleedInfusion.level > 0 && Math.random() < 0.15 + UPGRADES.bleedInfusion.level * 0.07) {
                applyStatus(entity, 'bleed', 3500, 0.12 + UPGRADES.bleedInfusion.level * 0.06);
            }
            if (UPGRADES.shockInfusion.level > 0 && Math.random() < 0.15 + UPGRADES.shockInfusion.level * 0.07) {
                applyStatus(entity, 'shock', 500, damage * (0.3 + UPGRADES.shockInfusion.level * 0.05));
            }

            // Robo de vida: infusión pasiva + bonus del Tomo de Vampirismo
            const lifestealFraction = (UPGRADES.lifeDrain.level > 0 ? (0.02 + UPGRADES.lifeDrain.level * 0.015) : 0) + (player.lifestealBonus || 0);
            if (lifestealFraction > 0) {
                player.hp = Math.min(player.maxHp, player.hp + damage * lifestealFraction);
            }
        }

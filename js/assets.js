// Parte del juego FSurvivor — módulo separado por mecánica.
// Todos los módulos comparten el mismo ámbito global (scripts clásicos, sin módulos ES).

        // ==========================================================
        // ===============  CONFIGURACIÓN DE ASSETS  ==================
        // ==========================================================
        // Todos los .png / .mp3 son OPCIONALES: si no existen en la
        // misma carpeta que este HTML, el juego usa automáticamente
        // un emoji (sprites) o un pitido chiptune (sonidos) de reserva.

        const BACKGROUND_IMAGE = 'background.png';

        const SPRITE_DEFS = {
            player_knight:   { frames: ['player_knight_1.png', 'player_knight_2.png'],     emoji: '🛡️' },
            player_mage:     { frames: ['player_mage_1.png', 'player_mage_2.png'],         emoji: '🧙' },
            player_chad:     { frames: ['player_chad_1.png', 'player_chad_2.png'],         emoji: '💪' },
            player_archer:   { frames: ['player_archer_1.png', 'player_archer_2.png'],     emoji: '🏹' },

            enemy_zombie:    { frames: ['enemy_zombie_1.png', 'enemy_zombie_2.png'],       emoji: '🧟' },
            enemy_bat:       { frames: ['enemy_bat_1.png', 'enemy_bat_2.png'],             emoji: '🦇' },
            enemy_skeleton:  { frames: ['enemy_skeleton_1.png', 'enemy_skeleton_2.png'],   emoji: '💀' },
            enemy_slime:     { frames: ['enemy_slime_1.png', 'enemy_slime_2.png'],         emoji: '🟢' },
            enemy_elite:     { frames: ['enemy_elite_1.png', 'enemy_elite_2.png'],         emoji: '👹' },
            enemy_ranged:    { frames: ['enemy_ranged_1.png', 'enemy_ranged_2.png'],       emoji: '🧙‍♀️' },
            boss:            { frames: ['boss_1.png', 'boss_2.png'],                       emoji: '👺' },

            gem_small:       { frames: ['gem_small.png'],                                  emoji: '💎' },
            gem_large:       { frames: ['gem_large.png'],                                  emoji: '🔷' },
            potion_heal:     { frames: ['potion_heal.png'],                                emoji: '❤️' },
            magnet_powerup:  { frames: ['magnet_powerup.png'],                             emoji: '🧲' },
            powerup_multishot: { frames: ['powerup_multishot.png'],                        emoji: '🎯' },
            powerup_area:    { frames: ['powerup_area.png'],                               emoji: '💥' },
            powerup_freeze_field: { frames: ['powerup_freeze_field.png'],                  emoji: '🧊' },
            coin:            { frames: ['coin.png'],                                       emoji: '🪙' },
            chest:           { frames: ['chest.png'],                                      emoji: '📦' },
            totem:           { frames: ['totem.png'],                                      emoji: '🗿' },
            upgrader:        { frames: ['upgrader.png'],                                   emoji: '🛠️' },

            boomerang:       { frames: ['boomerang.png'],                                  emoji: '🪃' },
            lightning_totem: { frames: ['lightning_totem.png'],                             emoji: '⚡' },

            tome_life:       { frames: ['tome_life.png'],                                  emoji: '📕' },
            tome_strength:   { frames: ['tome_strength.png'],                              emoji: '📗' },
            tome_luck:       { frames: ['tome_luck.png'],                                  emoji: '📘' },
            tome_vampirism:  { frames: ['tome_vampirism.png'],                             emoji: '📙' },
            tome_chronos:    { frames: ['tome_chronos.png'],                               emoji: '⏳' },
            tome_speed:      { frames: ['tome_speed.png'],                                 emoji: '📓' },
            tome_elemental:  { frames: ['tome_elemental.png'],                             emoji: '🔮' },

            item_berserker:  { frames: ['item_berserker.png'],                             emoji: '💢' },
            item_phoenix:    { frames: ['item_phoenix.png'],                               emoji: '🔥' },
            item_bloodfrenzy:{ frames: ['item_bloodfrenzy.png'],                           emoji: '🩸' },
            item_permafrost: { frames: ['item_permafrost.png'],                            emoji: '🧊' }
        };

        const SOUND_DEFS = {
            background_music:   { file: 'background.mp3',      loop: true, volume: 0.30, fallbackNotes: [261, 329, 392, 523] },
            gem_pickup:         { file: 'gem_pickup.mp3',       volume: 0.40, fallbackFreq: 880, fallbackDuration: 0.06 },
            level_up:           { file: 'level_up.mp3',         volume: 0.55, fallbackFreq: 660, fallbackDuration: 0.25 },
            potion_heal:        { file: 'potion_heal.mp3',      volume: 0.55, fallbackFreq: 523, fallbackDuration: 0.16 },
            magnet_powerup:     { file: 'magnet_powerup.mp3',   volume: 0.55, fallbackFreq: 784, fallbackDuration: 0.16 },
            skill_powerup:      { file: 'skill_powerup.mp3',    volume: 0.55, fallbackFreq: 900, fallbackDuration: 0.20 },
            enemy_hit:          { file: 'enemy_hit.mp3',        volume: 0.18, fallbackFreq: 220, fallbackDuration: 0.04 },
            enemy_death:        { file: 'enemy_death.mp3',      volume: 0.35, fallbackFreq: 150, fallbackDuration: 0.12 },
            player_hit:         { file: 'player_hit.mp3',       volume: 0.55, fallbackFreq: 130, fallbackDuration: 0.15 },
            game_over:          { file: 'game_over.mp3',        volume: 0.60, fallbackFreq: 100, fallbackDuration: 0.60 },
            whip_attack:        { file: 'whip_attack.mp3',      volume: 0.30, fallbackFreq: 300, fallbackDuration: 0.08 },
            wand_shoot:         { file: 'wand_shoot.mp3',       volume: 0.20, fallbackFreq: 700, fallbackDuration: 0.05 },
            bow_shoot:          { file: 'bow_shoot.mp3',        volume: 0.20, fallbackFreq: 850, fallbackDuration: 0.04 },
            coin_pickup:        { file: 'coin_pickup.mp3',      volume: 0.30, fallbackFreq: 990, fallbackDuration: 0.05 },
            chest_open:         { file: 'chest_open.mp3',       volume: 0.55, fallbackFreq: 200, fallbackDuration: 0.20 },
            roulette_spin:      { file: 'roulette_spin.mp3',    volume: 0.45, fallbackFreq: 440, fallbackDuration: 0.30 },
            roulette_win:       { file: 'roulette_win.mp3',     volume: 0.60, fallbackFreq: 990, fallbackDuration: 0.30 },
            totem_activate:     { file: 'totem_activate.mp3',   volume: 0.55, fallbackFreq: 180, fallbackDuration: 0.35 },
            upgrade_purchase:   { file: 'upgrade_purchase.mp3', volume: 0.45, fallbackFreq: 550, fallbackDuration: 0.12 },
            insufficient_funds: { file: 'insufficient_funds.mp3', volume: 0.35, fallbackFreq: 120, fallbackDuration: 0.15 },
            character_unlock:   { file: 'character_unlock.mp3', volume: 0.60, fallbackFreq: 700, fallbackDuration: 0.30 },
            menu_click:         { file: 'menu_click.mp3',       volume: 0.35, fallbackFreq: 500, fallbackDuration: 0.05 },
            boss_spawn:         { file: 'boss_spawn.mp3',       volume: 0.60, fallbackFreq: 90,  fallbackDuration: 0.50 },
            boss_death:         { file: 'boss_death.mp3',       volume: 0.65, fallbackFreq: 130, fallbackDuration: 0.45 },
            enemy_ranged_shoot: { file: 'enemy_ranged_shoot.mp3', volume: 0.20, fallbackFreq: 600, fallbackDuration: 0.06 },
            achievement_unlocked: { file: 'achievement_unlocked.mp3', volume: 0.55, fallbackFreq: 740, fallbackDuration: 0.25 },
            boomerang_throw:    { file: 'boomerang_throw.mp3',    volume: 0.25, fallbackFreq: 500, fallbackDuration: 0.08 },
            totem_zap:          { file: 'totem_zap.mp3',          volume: 0.30, fallbackFreq: 950, fallbackDuration: 0.06 },
            tome_pickup:        { file: 'tome_pickup.mp3',        volume: 0.50, fallbackFreq: 820, fallbackDuration: 0.18 },
            chronos_activate:   { file: 'chronos_activate.mp3',   volume: 0.55, fallbackFreq: 300, fallbackDuration: 0.40 },
            freeze_field:       { file: 'freeze_field.mp3',       volume: 0.50, fallbackFreq: 1200, fallbackDuration: 0.30 },
            phoenix_revive:     { file: 'phoenix_revive.mp3',     volume: 0.65, fallbackFreq: 660, fallbackDuration: 0.45 },
            item_slot_full:     { file: 'item_slot_full.mp3',     volume: 0.35, fallbackFreq: 200, fallbackDuration: 0.12 }
        };

        // ==========================================================
        // ===================  SPRITE MANAGER  ======================
        // ==========================================================
        class SpriteManager {
            constructor(defs, bgFile) {
                this.defs = defs;
                this.images = {}; // key -> [Image, ...]
                this.ready = {};  // key -> [bool, ...]

                Object.entries(defs).forEach(([key, def]) => {
                    this.images[key] = [];
                    this.ready[key] = [];
                    def.frames.forEach((file, idx) => {
                        const img = new Image();
                        this.ready[key][idx] = false;
                        img.onload = () => { this.ready[key][idx] = true; };
                        img.onerror = () => {
                            this.ready[key][idx] = false;
                            console.warn(`[Sprites] No se encontró "${file}". Se usará el emoji de reserva "${def.emoji}".`);
                        };
                        img.src = file;
                        this.images[key][idx] = img;
                    });
                });

                // Fondo del mapa
                this.bgImage = new Image();
                this.bgReady = false;
                this.bgPattern = null;
                this.bgImage.onload = () => {
                    this.bgReady = true;
                    this.bgPattern = ctx.createPattern(this.bgImage, 'repeat');
                };
                this.bgImage.onerror = () => {
                    this.bgReady = false;
                    console.warn(`[Sprites] No se encontró "${bgFile}". Se usará un fondo de cuadrícula de reserva.`);
                };
                this.bgImage.src = bgFile;
            }

            isReady(key, frame = 0) {
                return !!(this.ready[key] && this.ready[key][frame]);
            }

            getImage(key, frame = 0) {
                return this.images[key][frame];
            }
        }

        // Función que sustituye un sprite no cargado por un emoji.
        // worldX/worldY están en coordenadas del MUNDO; se convierten
        // a coordenadas de pantalla usando la cámara.
        function drawSprite(key, frame, worldX, worldY, size, flip = false) {
            const screenX = worldX - camera.x;
            const screenY = worldY - camera.y;

            // Culling: no dibujar lo que está fuera de la pantalla
            if (screenX < -size || screenX > canvas.width + size ||
                screenY < -size || screenY > canvas.height + size) return;

            ctx.save();
            ctx.translate(screenX, screenY);
            if (flip) ctx.scale(-1, 1);

            if (spriteManager.isReady(key, frame)) {
                const img = spriteManager.getImage(key, frame);
                ctx.drawImage(img, -size / 2, -size / 2, size, size);
            } else {
                const emoji = SPRITE_DEFS[key].emoji;
                ctx.font = `${size}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(emoji, 0, 0);
            }
            ctx.restore();
        }

        function drawBackground() {
            ctx.save();
            if (spriteManager.bgReady && spriteManager.bgPattern) {
                ctx.translate(-camera.x, -camera.y);
                ctx.fillStyle = spriteManager.bgPattern;
                ctx.fillRect(camera.x, camera.y, canvas.width, canvas.height);
            } else {
                // Fallback: cuadrícula procedural que se mueve con la cámara
                ctx.fillStyle = '#1a1c23';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                ctx.lineWidth = 1;
                const gridSize = 64;
                const offsetX = -((camera.x % gridSize) + gridSize) % gridSize;
                const offsetY = -((camera.y % gridSize) + gridSize) % gridSize;
                for (let x = offsetX; x < canvas.width; x += gridSize) {
                    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
                }
                for (let y = offsetY; y < canvas.height; y += gridSize) {
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
                }
            }
            ctx.restore();
        }

        // ==========================================================
        // ===================  SOUND MANAGER  ========================
        // ==========================================================
        class SoundManager {
            constructor(defs) {
                this.defs = defs;
                this.audios = {};
                this.ready = {};
                this.actx = null;
                this.musicInstance = null;
                this.fallbackMusicInterval = null;
                this.muted = false;

                Object.entries(defs).forEach(([key, def]) => {
                    const audio = new Audio();
                    this.ready[key] = false;
                    audio.oncanplaythrough = () => { this.ready[key] = true; };
                    audio.onerror = () => {
                        this.ready[key] = false;
                        console.warn(`[Sonido] No se encontró "${def.file}". Se usará un pitido chiptune de reserva.`);
                    };
                    audio.src = def.file;
                    audio.preload = 'auto';
                    audio.volume = def.volume ?? 0.5;
                    this.audios[key] = audio;
                });
            }

            setMuted(muted) {
                this.muted = muted;
                if (this.musicInstance) this.musicInstance.muted = muted;
            }

            getCtx() {
                if (!this.actx) this.actx = new (window.AudioContext || window.webkitAudioContext)();
                return this.actx;
            }

            // Sonido "de bit" (chiptune) de reserva, generado con Web Audio API
            playBeep(freq, duration, volume = 0.2) {
                if (this.muted) return;
                try {
                    const actx = this.getCtx();
                    const osc = actx.createOscillator();
                    const gain = actx.createGain();
                    osc.type = 'square';
                    osc.frequency.value = freq;
                    gain.gain.value = volume;
                    osc.connect(gain);
                    gain.connect(actx.destination);
                    osc.start();
                    gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + duration);
                    osc.stop(actx.currentTime + duration);
                } catch (e) { /* ignorar si el audio no está disponible */ }
            }

            play(key) {
                if (this.muted) return;
                const def = this.defs[key];
                if (!def) return;
                if (this.ready[key]) {
                    const a = this.audios[key].cloneNode();
                    a.volume = def.volume ?? 0.5;
                    a.play().catch(() => {});
                } else {
                    this.playBeep(def.fallbackFreq, def.fallbackDuration, (def.volume ?? 0.3) * 0.6);
                }
            }

            startMusic() {
                const def = this.defs.background_music;
                if (this.ready.background_music) {
                    const a = this.audios.background_music;
                    a.loop = true;
                    a.volume = def.volume;
                    a.muted = this.muted;
                    a.currentTime = 0;
                    a.play().catch(() => {});
                    this.musicInstance = a;
                } else {
                    this.startFallbackMusic();
                }
            }

            // Música de reserva: pequeño arpegio chiptune en bucle
            startFallbackMusic() {
                if (this.fallbackMusicInterval) return;
                const notes = this.defs.background_music.fallbackNotes;
                let i = 0;
                this.fallbackMusicInterval = setInterval(() => {
                    if (this.ready.background_music) {
                        clearInterval(this.fallbackMusicInterval);
                        this.fallbackMusicInterval = null;
                        this.startMusic();
                        return;
                    }
                    this.playBeep(notes[i % notes.length], 0.18, 0.045);
                    i++;
                }, 320);
            }

            stopMusic() {
                if (this.musicInstance) this.musicInstance.pause();
                if (this.fallbackMusicInterval) {
                    clearInterval(this.fallbackMusicInterval);
                    this.fallbackMusicInterval = null;
                }
            }
        }

        const spriteManager = new SpriteManager(SPRITE_DEFS, BACKGROUND_IMAGE);
        const soundManager = new SoundManager(SOUND_DEFS);

        // Silenciar/activar todo el audio (efectos + música). El estado
        // elegido se guarda en saveData (js/save.js) y persiste entre
        // sesiones; el icono del botón se actualiza en updateMuteButtonIcon().
        function toggleMute() {
            soundManager.setMuted(!soundManager.muted);
            saveData.muted = soundManager.muted;
            persistSave();
            updateMuteButtonIcon();
        }

        function updateMuteButtonIcon() {
            const btn = document.getElementById('mute-toggle-btn');
            if (btn) btn.innerText = soundManager.muted ? '🔇' : '🔊';
        }

        let musicStarted = false;
        function tryStartMusic() {
            if (musicStarted) return;
            musicStarted = true;
            if (soundManager.actx && soundManager.actx.state === 'suspended') soundManager.actx.resume();
            soundManager.startMusic();
            startHint.style.display = 'none';
        }
        window.addEventListener('keydown', tryStartMusic, { once: true });
        window.addEventListener('click', tryStartMusic, { once: true });

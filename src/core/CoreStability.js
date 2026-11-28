/* ============================================================================
   BLACKOUT OPS — Core Stability, Logging, Scene Teardown & Legend Guard
   Zero-build IIFE module (ADR-002).
   - BO.log(scope, level, msg, err): structured ring-buffered logger
   - BO.emitGameEvent(type, payload): canonical gameplay event dispatcher
   - BO.SceneCleanup.disposeScene(scene, renderer): deterministic leak teardown
   - BO.SceneCleanup.disposeObject(root, { keep, detach }): subtree teardown for rebuilt meshes
   - BO.GPULedger: per-match GPU upload ledger; sweep() frees what a finished match left behind
   - Wraps BO.Menus.renderLegend so unknown legendTab keys (e.g. 'bosses') fall back safely
   ============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO = global.BO || {};
    const HISTORY_LIMIT = 200;
    const history = [];

    function log(scope, level, msg, err) {
        const entry = {
            t: Date.now(),
            scope: String(scope || 'Core'),
            level: level || 'info',
            msg: String(msg || ''),
            err: err ? (err.message || String(err)) : ''
        };
        history.push(entry);
        if (history.length > HISTORY_LIMIT) history.shift();

        const tag = `[BO:${entry.scope}] ${entry.msg}`;
        if (level === 'error') {
            console.error(tag, err || '');
            const devToast = (BO.Settings && BO.Settings.get && BO.Settings.get('devLogToast')) ||
                /[?&]debug=([^&]*errors[^&]*)/i.test(global.location?.search || '');
            if (devToast && BO.Events?.emit) {
                BO.Events.emit('hud:toast', { text: `${entry.scope}: ${entry.msg}`, color: '#ef4444' });
            }
        } else if (level === 'warn') {
            console.warn(tag, err || '');
        } else if (level === 'debug') {
            if (/[?&]debug=/i.test(global.location?.search || '')) console.debug(tag, err || '');
        }
        return entry;
    }
    log.history = history;

    function emitGameEvent(type, payload) {
        if (!BO.Events || !BO.Events.emit) return;
        const evName = type && type.indexOf(':') === -1 ? 'game:' + type : type;
        try {
            BO.Events.emit(evName, payload || {});
        } catch (err) {
            log('Events', 'error', 'Listener failed for ' + evName, err);
        }
    }

    function isSharedAsset(obj) {
        if (!obj) return false;
        if (obj.userData && obj.userData.sharedAsset) return true;
        return false;
    }

    function isCachedTexture(tex) {
        if (!tex) return false;
        if (tex.userData && tex.userData.sharedAsset) return true;
        if (!BO.Textures) return false;
        if (tex === BO.Textures.darkMatterTex || tex === BO.Textures.papTex) return true;
        for (const k in BO.Textures.textures) if (BO.Textures.textures[k] === tex) return true;
        for (const k in BO.Textures.heightMaps) if (BO.Textures.heightMaps[k] === tex) return true;
        for (const k in BO.Textures.roughMaps) if (BO.Textures.roughMaps[k] === tex) return true;
        for (const k in BO.Textures.camoTextures) if (BO.Textures.camoTextures[k] === tex) return true;
        return false;
    }

    function isCachedMaterial(mat) {
        if (!mat) return false;
        if (mat.userData?.sharedAsset) return true;
        if (BO.Assets?.hasSharedMatValue && BO.Assets.hasSharedMatValue(mat)) return true;
        if (BO.Textures?.materials) {
            for (const k in BO.Textures.materials) if (BO.Textures.materials[k] === mat) return true;
        }
        if (BO.FX && (mat === BO.FX.decalMat || mat === BO.FX.scorchMat || mat === BO.FX.shellMat)) return true;
        return false;
    }

    function isCachedGeometry(geo) {
        if (!geo) return false;
        if (geo.userData?.sharedAsset) return true;
        if (BO.Assets?.isSharedGeo && BO.Assets.isSharedGeo(geo)) return true;
        if (BO.FX && (geo === BO.FX.decalGeo || geo === BO.FX.particleGeo || geo === BO.FX.shellGeo)) return true;
        return false;
    }

    const TEX_SLOTS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'bumpMap', 'emissiveMap', 'alphaMap', 'aoMap'];

    function disposeMaterial(mat) {
        if (!mat || isCachedMaterial(mat)) return;
        for (let i = 0; i < TEX_SLOTS.length; i++) {
            const t = mat[TEX_SLOTS[i]];
            if (t && !isCachedTexture(t) && typeof t.dispose === 'function') {
                try { t.dispose(); } catch (err) { log('SceneCleanup', 'debug', 'tex dispose', err); }
            }
        }
        if (typeof mat.dispose === 'function') {
            try { mat.dispose(); } catch (err) { log('SceneCleanup', 'debug', 'mat dispose', err); }
        }
    }

    /**
     * Release the GPU resources of one subtree (geometry, materials, owned textures) while
     * respecting every shared cache. Optionally detaches the root from its parent.
     * Children listed in `keep` (and their subtrees) are skipped so cached rigs survive.
     */
    function disposeObject(root, opts) {
        if (!root) return;
        const keep = opts && opts.keep;
        const stack = [root];
        while (stack.length) {
            const obj = stack.pop();
            if (!obj || (keep && keep.indexOf(obj) !== -1)) continue;
            const ch = obj.children;
            for (let i = 0; i < ch.length; i++) stack.push(ch[i]);
            if (isSharedAsset(obj)) continue;
            // Shadow-casting lights own a depth render target (up to 2048²) that three.js never
            // frees when the light leaves the scene.
            if (obj.isLight && obj.shadow && obj.shadow.map && typeof obj.shadow.dispose === 'function') {
                try { obj.shadow.dispose(); } catch (err) { log('SceneCleanup', 'debug', 'shadow dispose', err); }
            }
            if (obj.isInstancedMesh && typeof obj.dispose === 'function') {
                try { obj.dispose(); } catch (_) {}
            }
            if (obj.geometry && !obj.userData?.sharedGeometry && !isCachedGeometry(obj.geometry)) {
                try { obj.geometry.dispose(); } catch (err) { log('SceneCleanup', 'debug', 'geo dispose', err); }
            }
            const mat = obj.material;
            if (Array.isArray(mat)) {
                for (let i = 0; i < mat.length; i++) disposeMaterial(mat[i]);
            } else if (mat) {
                disposeMaterial(mat);
            }
        }
        if (opts && opts.detach && root.parent) root.parent.remove(root);
    }

    function disposeScene(scene, renderer) {
        if (scene) {
            try {
                disposeObject(scene);
                while (scene.children.length > 0) {
                    scene.remove(scene.children[0]);
                }
            } catch (err) {
                log('SceneCleanup', 'warn', 'Scene traversal error during cleanup', err);
            }
        }
        if (BO.FX) {
            try {
                if (typeof BO.FX.clear === 'function') BO.FX.clear();
                BO.FX.attachScene?.(null);
            } catch (err) {
                log('SceneCleanup', 'warn', 'FX cleanup error', err);
            }
        }
        if (BO.Combat && typeof BO.Combat.setTargetPool === 'function') {
            BO.Combat.setTargetPool([]);
        }
        if (BO.HitboxDebug && typeof BO.HitboxDebug.clear === 'function') {
            BO.HitboxDebug.clear();
        }
        if (BO.Sound && typeof BO.Sound.stopEffects === 'function') {
            BO.Sound.stopEffects();
        }
        if (renderer && renderer.renderLists && typeof renderer.renderLists.dispose === 'function') {
            try { renderer.renderLists.dispose(); } catch (_) {}
        }
    }

    /* ------------------------------------------------------------------ GPU ledger
       Mode code removes plenty of props, markers and NPCs from the scene on its own
       (stop(), clear(), despawn) before disposeScene() can reach them, so their GPU
       buffers used to outlive the match (Survival +~95 geometries and Open World
       +~70 per match). The ledger records every geometry and texture the renderer
       uploads, stamped with the match it was uploaded in. At teardown it frees
       whatever a finished match uploaded that no persistent scene still uses and
       no shared cache owns. three.js keeps the CPU data on dispose() and simply
       re-uploads on next use, so a false positive costs one upload, never a crash. */
    const GPULedger = {
        installed: false,
        epoch: 0,          // 0 = menus / boot; every match gets a fresh epoch
        _nextEpoch: 1,
        geometries: new Map(),
        textures: new Map(),
        lastSweep: null,

        install() {
            if (this.installed || typeof THREE === 'undefined') return this.installed;
            const ledger = this;
            const track = (proto, map) => {
                const orig = proto.addEventListener;
                proto.addEventListener = function (type, listener) {
                    // WebGLRenderer subscribes to 'dispose' exactly once per resource, on first upload.
                    if (type === 'dispose' && !map.has(this)) {
                        map.set(this, ledger.epoch);
                        const self = this;
                        orig.call(this, 'dispose', function onLedgerDispose() {
                            map.delete(self);
                            self.removeEventListener('dispose', onLedgerDispose);
                        });
                    }
                    return orig.call(this, type, listener);
                };
            };
            track(THREE.BufferGeometry.prototype, this.geometries);
            track(THREE.Texture.prototype, this.textures);
            this.installed = true;
            return true;
        },

        /** Stamps everything uploaded from now on as belonging to a new match. */
        beginMatch() {
            this.epoch = this._nextEpoch++;
            return this.epoch;
        },

        /** Back in the menus: later uploads (showcase, gunsmith, previews) are never swept. */
        endMatch() {
            this.epoch = 0;
        },

        /** Everything reachable from scenes that live across matches. */
        _collectKept() {
            const geos = new Set();
            const texs = new Set();
            const addMaterial = (mat) => {
                if (!mat) return;
                for (const key in mat) {
                    const v = mat[key];
                    if (v && v.isTexture) texs.add(v);
                }
                const u = mat.uniforms;
                if (u) for (const k in u) { const v = u[k] && u[k].value; if (v && v.isTexture) texs.add(v); }
            };
            const visit = (root) => {
                if (!root || typeof root.traverse !== 'function') return;
                root.traverse((o) => {
                    if (o.geometry) geos.add(o.geometry);
                    if (Array.isArray(o.material)) o.material.forEach(addMaterial); else addMaterial(o.material);
                    if (o.skeleton && o.skeleton.boneTexture) texs.add(o.skeleton.boneTexture);
                });
                if (root.isScene) {
                    if (root.background && root.background.isTexture) texs.add(root.background);
                    if (root.environment && root.environment.isTexture) texs.add(root.environment);
                }
            };
            const App = BO.App, P = BO.Player;
            [
                P && P.vmScene, P && P.fistRig && P.fistRig.root,
                App && App.showcaseScene,
                BO.Atmosphere && BO.Atmosphere.envScene,
                BO.PostFX && BO.PostFX.qscene,
                BO.Menus && BO.Menus._epScene,
                BO.World && BO.World.scene // empty after disposeScene; kept for direct match→match restarts
            ].forEach(visit);
            if (App && App.weaponStudioBackground && App.weaponStudioBackground.isTexture) texs.add(App.weaponStudioBackground);
            return { geos, texs };
        },

        _cachedTextures() {
            const set = new Set();
            const T = BO.Textures;
            if (!T) return set;
            if (T.darkMatterTex) set.add(T.darkMatterTex);
            if (T.papTex) set.add(T.papTex);
            for (const bag of [T.textures, T.heightMaps, T.roughMaps, T.camoTextures]) {
                if (bag) for (const k in bag) if (bag[k]) set.add(bag[k]);
            }
            if (BO.Assets && typeof BO.Assets.sharedTextures === 'function') BO.Assets.sharedTextures(set);
            return set;
        },

        /**
         * Frees resources uploaded by finished matches that nothing persistent still uses.
         * Returns { geometries, textures } freed.
         */
        sweep() {
            if (!this.installed) return { geometries: 0, textures: 0 };
            const { geos, texs } = this._collectKept();
            const cachedTex = this._cachedTextures();
            let freedGeo = 0, freedTex = 0;
            for (const [geo, epoch] of Array.from(this.geometries)) {
                if (epoch === 0 || geos.has(geo) || isCachedGeometry(geo)) continue;
                try { geo.dispose(); freedGeo++; } catch (err) { log('GPULedger', 'debug', 'geo dispose', err); }
            }
            for (const [tex, epoch] of Array.from(this.textures)) {
                if (epoch === 0 || tex.isRenderTargetTexture || texs.has(tex) || cachedTex.has(tex) || (tex.userData && tex.userData.sharedAsset)) continue;
                try { tex.dispose(); freedTex++; } catch (err) { log('GPULedger', 'debug', 'tex dispose', err); }
            }
            this.lastSweep = { geometries: freedGeo, textures: freedTex, at: Date.now() };
            if (freedGeo || freedTex) log('GPULedger', 'debug', `Freed ${freedGeo} geometries, ${freedTex} textures left by the last match`);
            return this.lastSweep;
        }
    };
    GPULedger.install();

    /**
     * Shadow-caster budget. Each preset allows a number of world meshes to cast sun shadows
     * (largest first) above a minimum size; characters always cast. The authored castShadow
     * flag is remembered, so raising the preset later brings shadows back.
     * (maxShadowCasters stays the preset's count of shadow-casting lights.)
     */
    function applySceneQualityBudgets(scene) {
        if (!scene || !BO.Settings?.getQualityPreset) return;
        const q = BO.Settings.getQualityPreset();
        const budget = Number.isFinite(q.shadowCasterBudget) ? q.shadowCasterBudget : 1200;
        const minR = Number.isFinite(q.shadowCasterMinRadius) ? q.shadowCasterMinRadius : 0.4;
        const candidates = [];
        scene.traverse((obj) => {
            if (!obj || (!obj.isMesh && !obj.isInstancedMesh)) return;
            const ud = obj.userData || (obj.userData = {});
            if (ud.boCastShadow === undefined) ud.boCastShadow = !!obj.castShadow;
            if (!ud.boCastShadow) return;
            if (!q.shadows || budget <= 0) { obj.castShadow = false; return; }
            if (ud.entity || ud.isHeroShadow || ud.glbPart) { obj.castShadow = true; return; }
            const g = obj.geometry;
            if (g && !g.boundingSphere && typeof g.computeBoundingSphere === 'function') g.computeBoundingSphere();
            const rad = g && g.boundingSphere ? g.boundingSphere.radius * Math.max(obj.scale.x, obj.scale.y, obj.scale.z) : 1.0;
            if (rad < minR) { obj.castShadow = false; return; }
            candidates.push({ obj, rad });
        });
        candidates.sort((a, b) => b.rad - a.rad);
        for (let i = 0; i < candidates.length; i++) candidates[i].obj.castShadow = i < budget;
        return { candidates: candidates.length, kept: Math.min(budget, candidates.length) };
    }

    // Wrap MenuController.renderLegend so invalid/retired legendTab keys (e.g. 'bosses') fall back safely
    function installLegendGuard() {
        const M = BO.Menus;
        if (!M || M._legendGuardInstalled || typeof M.renderLegend !== 'function') return false;
        M._legendGuardInstalled = true;
        const origRenderLegend = M.renderLegend.bind(M);
        M.renderLegend = function (keepScroll) {
            const modes = BO.ModeGuide && BO.ModeGuide.MODES;
            if (modes && !modes[this.legendTab]) {
                const firstKey = Object.keys(modes)[0];
                if (firstKey) this.legendTab = firstKey;
            }
            return origRenderLegend(keepScroll);
        };
        return true;
    }

    function waitInstall() {
        if (installLegendGuard()) return;
        const id = setInterval(() => {
            if (installLegendGuard()) clearInterval(id);
        }, 50);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitInstall);
    } else {
        waitInstall();
    }

    BO.log = log;
    BO.emitGameEvent = emitGameEvent;
    BO.GPULedger = GPULedger;
    BO.SceneCleanup = {
        disposeScene,
        disposeObject,
        ledger: GPULedger,
        applySceneQualityBudgets,
        installLegendGuard
    };
})(window);

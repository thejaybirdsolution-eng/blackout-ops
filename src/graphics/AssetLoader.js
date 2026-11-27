/* ============================================================================
   BLACKOUT OPS — Global 3D GLTF, PBR Texture, Skybox & Staged Audio Asset Loader
   Provides shared caching and GPU-safe instancing across all game modes.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO = global.BO || {};

    const texCache = new Map();
    const matCache = new Map();
    const glbCache = new Map();
    const glbPromises = new Map();
    const sharedGeos = new Set();
    const sharedMats = new Set();

    const audioCache = new Map();
    const audioPromises = new Map();
    const activeMusicSources = new Set();
    let musicEpoch = 0;
    let currentMusicPath = null;
    let activeAmbient = null;
    let ambientEpoch = 0;

    function resolvePath(relPath, defaultDir) {
        const clean = String(relPath || '').replace(/^\/+/, '');
        if (clean.startsWith('staged_assets/')) return clean;
        if (defaultDir && clean.startsWith(defaultDir)) return 'staged_assets/' + clean;
        return 'staged_assets/' + defaultDir + clean;
    }

    function loadTex(relPath, repeatX = 1, repeatY = 1) {
        const full = resolvePath(relPath, 'textures/');
        const key = 'ftex:' + full + ':' + repeatX + ':' + repeatY;
        if (texCache.has(key)) return texCache.get(key);
        const tex = new THREE.TextureLoader().load(full);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeatX, repeatY);
        if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
        tex.anisotropy = 4;
        texCache.set(key, tex);
        return tex;
    }

    function pbrMat(relPath, repeatX = 1, repeatY = 1, extra = {}) {
        const key = 'pbr:' + relPath + ':' + repeatX + ':' + repeatY + ':' + JSON.stringify(extra);
        if (!matCache.has(key)) {
            matCache.set(key, new THREE.MeshStandardMaterial(Object.assign({
                map: loadTex(relPath, repeatX, repeatY),
                roughness: 0.78,
                metalness: 0.10
            }, extra)));
        }
        return matCache.get(key);
    }

    function loadSkyboxTex(relPath) {
        const clean = String(relPath || '').replace(/^\/+/, '');
        const full = clean.startsWith('staged_assets/')
            ? clean
            : (clean.includes('/') ? 'staged_assets/3d_models/skyboxes/' + clean : 'staged_assets/3d_models/skyboxes/Skyboxes/' + clean);
        const key = 'sky:' + full;
        if (texCache.has(key)) return texCache.get(key);
        const tex = new THREE.TextureLoader().load(full);
        tex.mapping = THREE.EquirectangularReflectionMapping;
        if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
        texCache.set(key, tex);
        return tex;
    }

    function applySkybox(scene, relPath) {
        if (!scene || !relPath) return null;
        const tex = loadSkyboxTex(relPath);
        scene.traverse((o) => {
            if (o.isMesh && o.material && o.material.isShaderMaterial && o.material.uniforms && o.material.uniforms.uZenith) {
                o.visible = false;
            }
        });
        scene.background = tex;
        return tex;
    }

    function _cloneGLBScene(source) {
        let hasSkinned = false;
        source.traverse((o) => { if (o.isSkinnedMesh) hasSkinned = true; });
        const clone = source.clone(true);
        if (!hasSkinned) return clone;

        const sourceToClone = new Map();
        const walk = (srcNode, dstNode) => {
            sourceToClone.set(srcNode, dstNode);
            const len = Math.min(srcNode.children.length, dstNode.children.length);
            for (let i = 0; i < len; i++) walk(srcNode.children[i], dstNode.children[i]);
        };
        walk(source, clone);

        source.traverse((srcObj) => {
            if (!srcObj.isSkinnedMesh || !srcObj.skeleton) return;
            const dstObj = sourceToClone.get(srcObj);
            if (!dstObj || !dstObj.isSkinnedMesh) return;
            const clonedBones = srcObj.skeleton.bones.map((b) => sourceToClone.get(b) || b);
            const boneInverses = srcObj.skeleton.boneInverses.map((inv) => inv.clone());
            dstObj.bind(new THREE.Skeleton(clonedBones, boneInverses), srcObj.bindMatrix.clone());
            dstObj.frustumCulled = false;
        });
        return clone;
    }

    function loadGLB(relPath) {
        const path = resolvePath(relPath, '3d_models/');
        if (glbCache.has(path)) return Promise.resolve(_cloneGLBScene(glbCache.get(path)));
        if (glbPromises.has(path)) return glbPromises.get(path).then((sc) => _cloneGLBScene(sc));
        if (typeof THREE.GLTFLoader !== 'function') {
            return Promise.reject(new Error('THREE.GLTFLoader is not loaded'));
        }
        const p = new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            loader.load(path, (gltf) => {
                const sc = gltf.scene || gltf.scenes[0];
                sc.traverse((o) => {
                    if (!o.isMesh) return;
                    o.castShadow = true;
                    o.receiveShadow = true;
                    if (o.isSkinnedMesh) o.frustumCulled = false;
                    if (o.geometry) sharedGeos.add(o.geometry);
                    const mats = Array.isArray(o.material) ? o.material : [o.material];
                    for (const m of mats) {
                        if (!m) continue;
                        sharedMats.add(m);
                        if (m.map && THREE.sRGBEncoding) m.map.encoding = THREE.sRGBEncoding;
                        if (m.emissiveMap && THREE.sRGBEncoding) m.emissiveMap.encoding = THREE.sRGBEncoding;
                    }
                });
                glbCache.set(path, sc);
                glbPromises.delete(path);
                resolve(sc);
            }, undefined, (err) => {
                glbPromises.delete(path);
                console.warn('[BO.Assets] Failed to load GLB:', path, err);
                reject(err);
            });
        });
        glbPromises.set(path, p);
        return p.then((sc) => _cloneGLBScene(sc));
    }

    function _normalizeGLBScene(sc, opts = {}) {
        const wrap = new THREE.Group();
        wrap.add(sc);
        wrap.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(sc);
        if (!box.isEmpty()) {
            const sz = new THREE.Vector3();
            box.getSize(sz);
            if (opts.fitSize) {
                const [tw, th, td] = opts.fitSize;
                const sx = tw > 0 && sz.x > 1e-4 ? tw / sz.x : 1;
                const sy = th > 0 && sz.y > 1e-4 ? th / sz.y : 1;
                const szScale = td > 0 && sz.z > 1e-4 ? td / sz.z : 1;
                if (opts.uniform) {
                    const u = Math.min(sx, sy, szScale);
                    sc.scale.multiplyScalar(u);
                } else {
                    sc.scale.multiply(new THREE.Vector3(sx, sy, szScale));
                }
                sc.updateMatrixWorld(true);
                box.setFromObject(sc);
            }
            const ctr = new THREE.Vector3();
            box.getCenter(ctr);
            if (opts.centerXZ !== false) {
                sc.position.x -= ctr.x;
                sc.position.z -= ctr.z;
            }
            if (opts.align === 'center') sc.position.y -= ctr.y;
            else if (opts.align !== 'raw') sc.position.y -= box.min.y;
        }
        wrap.updateMatrixWorld(true);
        return wrap;
    }

    function _applyTransform(obj, opts) {
        if (opts.pos) {
            if (Array.isArray(opts.pos)) obj.position.set(opts.pos[0], opts.pos[1], opts.pos[2]);
            else obj.position.copy(opts.pos);
        }
        if (opts.rot !== undefined) {
            if (Array.isArray(opts.rot)) obj.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
            else obj.rotation.y = opts.rot;
        }
        if (opts.scale !== undefined) {
            if (Array.isArray(opts.scale)) obj.scale.set(opts.scale[0], opts.scale[1], opts.scale[2]);
            else obj.scale.setScalar(opts.scale);
        }
    }

    function _hideFallbacks(fb) {
        if (!fb) return;
        const list = Array.isArray(fb) ? fb : [fb];
        for (const item of list) {
            if (item) item.visible = false;
        }
    }

    function _isLive(holder, opts) {
        if (opts.guardScene && BO.World && BO.World.scene !== opts.guardScene) return false;
        if (opts.ownerSession && BO.Minigames && BO.Minigames.session !== opts.ownerSession) return false;
        let cur = holder;
        while (cur.parent) cur = cur.parent;
        if (cur !== holder && BO.World && BO.World.scene && cur.isScene && cur !== BO.World.scene) return false;
        return !!holder.parent;
    }

    function placeGLB(parent, path, opts = {}) {
        const holder = new THREE.Group();
        _applyTransform(holder, opts);
        if (parent) parent.add(holder);
        const ownerSession = BO.Minigames && BO.Minigames.session;
        const liveOpts = Object.assign({ ownerSession }, opts);
        loadGLB(path).then((sc) => {
            if (!_isLive(holder, liveOpts)) return;
            if (opts.noHit !== false) sc.traverse((o) => { o.userData.noHit = true; });
            if (opts.castShadow === false || opts.receiveShadow === false) {
                sc.traverse((o) => {
                    if (!o.isMesh) return;
                    if (opts.castShadow === false) o.castShadow = false;
                    if (opts.receiveShadow === false) o.receiveShadow = false;
                });
            }
            const wrap = _normalizeGLBScene(sc, opts);
            holder.add(wrap);
            holder.updateMatrixWorld(true);
            _hideFallbacks(opts.hideFallback);
            if (opts.solidSession) opts.solidSession.solid(holder);
            if (opts.solidWorld && opts.solidWorld.worldMeshes) {
                holder.traverse((o) => { if (o.isMesh) opts.solidWorld.worldMeshes.push(o); });
            }
            if (opts.onLoad) opts.onLoad(holder, sc);
        }).catch(() => {});
        return holder;
    }

    function placeGLBInstanced(parent, path, transforms, opts = {}) {
        const holder = new THREE.Group();
        if (!transforms || !transforms.length) return holder;
        if (parent) parent.add(holder);
        const ownerSession = BO.Minigames && BO.Minigames.session;
        const liveOpts = Object.assign({ ownerSession }, opts);
        loadGLB(path).then((sc) => {
            if (!_isLive(holder, liveOpts)) return;
            const wrap = _normalizeGLBScene(sc, opts);
            const dummy = new THREE.Object3D();
            const instMat4 = new THREE.Matrix4();
            const finalMat4 = new THREE.Matrix4();
            const meshes = [];
            wrap.traverse((o) => { if (o.isMesh && o.geometry) meshes.push(o); });
            for (const srcMesh of meshes) {
                const im = new THREE.InstancedMesh(srcMesh.geometry, srcMesh.material, transforms.length);
                im.castShadow = opts.castShadow !== false;
                im.receiveShadow = opts.receiveShadow !== false;
                if (opts.noHit !== false) im.userData.noHit = true;
                if (opts.frustumCulled === false) im.frustumCulled = false;
                for (let i = 0; i < transforms.length; i++) {
                    const tr = transforms[i];
                    if (tr && tr.isMatrix4) {
                        instMat4.copy(tr);
                    } else {
                        dummy.position.set(0, 0, 0);
                        dummy.rotation.set(0, 0, 0);
                        dummy.scale.set(1, 1, 1);
                        _applyTransform(dummy, tr || {});
                        dummy.updateMatrix();
                        instMat4.copy(dummy.matrix);
                    }
                    finalMat4.multiplyMatrices(instMat4, srcMesh.matrixWorld);
                    im.setMatrixAt(i, finalMat4);
                }
                im.instanceMatrix.needsUpdate = true;
                if (typeof im.computeBoundingSphere === 'function') im.computeBoundingSphere();
                holder.add(im);
            }
            _hideFallbacks(opts.hideFallback);
            if (opts.solidSession) opts.solidSession.solid(holder);
            if (opts.onLoad) opts.onLoad(holder);
        }).catch(() => {});
        return holder;
    }

    /* ---------------------------------------------------- Staged Audio Clips */
    function _getAudioCtx() {
        if (!BO.Sound) return null;
        return BO.Sound.ensureContext ? BO.Sound.ensureContext() : BO.Sound.ctx;
    }

    function loadAudioBuffer(relPath) {
        const path = resolvePath(relPath, 'audio/');
        if (audioCache.has(path)) return Promise.resolve(audioCache.get(path));
        if (audioPromises.has(path)) return audioPromises.get(path);
        const ctx = _getAudioCtx();
        if (!ctx || typeof global.fetch !== 'function') return Promise.resolve(null);
        const p = global.fetch(path)
            .then((r) => (r.ok ? r.arrayBuffer() : null))
            .then((buf) => (buf ? ctx.decodeAudioData(buf) : null))
            .then((decoded) => {
                if (decoded) audioCache.set(path, decoded);
                audioPromises.delete(path);
                return decoded;
            })
            .catch(() => {
                audioPromises.delete(path);
                return null;
            });
        audioPromises.set(path, p);
        return p;
    }

    function playClip(relPath, opts = {}) {
        const ctx = _getAudioCtx();
        if (!ctx) return;
        const isMusic = !!opts.music;
        if (isMusic && !opts.keepExisting) stopMusicClips();
        const epoch = musicEpoch;
        const resolved = resolvePath(relPath, 'audio/');
        loadAudioBuffer(relPath).then((buffer) => {
            if (!buffer) return;
            if (isMusic && epoch !== musicEpoch) return;
            const liveCtx = _getAudioCtx();
            if (!liveCtx) return;
            const src = liveCtx.createBufferSource();
            src.buffer = buffer;
            src.loop = !!opts.loop;
            const baseRate = opts.rate || 1;
            const rJit = opts.rateJitter ? (1 + (Math.random() - 0.5) * 2 * opts.rateJitter) : 1;
            src.playbackRate.value = Math.max(0.25, baseRate * rJit);
            const g = liveCtx.createGain();
            const baseVol = opts.volume ?? (isMusic ? 0.24 : 0.45);
            const vJit = opts.volJitter ? (1 + (Math.random() - 0.5) * 2 * opts.volJitter) : 1;
            const targetVol = Math.max(0, baseVol * vJit);
            if (opts.fadeIn && opts.fadeIn > 0) {
                g.gain.setValueAtTime(0.0001, liveCtx.currentTime);
                g.gain.linearRampToValueAtTime(targetVol, liveCtx.currentTime + opts.fadeIn);
            } else {
                g.gain.value = targetVol;
            }
            const dest = isMusic
                ? (BO.Sound && BO.Sound.musicGain)
                : (opts.dest === 'combat' && BO.Sound && BO.Sound.combatGain)
                    ? BO.Sound.combatGain
                    : (BO.Sound && BO.Sound.sfxGain);
            if (opts.pan && Math.abs(opts.pan) > 0.01 && typeof liveCtx.createStereoPanner === 'function') {
                const panner = liveCtx.createStereoPanner();
                panner.pan.value = Math.max(-1, Math.min(1, opts.pan));
                src.connect(g);
                g.connect(panner);
                panner.connect(dest || liveCtx.destination);
            } else {
                src.connect(g);
                g.connect(dest || liveCtx.destination);
            }
            src.start();
            if (isMusic) {
                const entry = { src, gain: g, path: resolved };
                activeMusicSources.add(entry);
                currentMusicPath = resolved;
                src.onended = () => { activeMusicSources.delete(entry); };
            }
        }).catch(() => {});
    }

    function stopMusicClips(fadeSec = 0) {
        musicEpoch++;
        currentMusicPath = null;
        const liveCtx = _getAudioCtx();
        for (const entry of activeMusicSources) {
            const src = entry.src || entry;
            try {
                if (fadeSec > 0 && entry.gain && liveCtx) {
                    const now = liveCtx.currentTime;
                    entry.gain.gain.setValueAtTime(entry.gain.gain.value, now);
                    entry.gain.gain.linearRampToValueAtTime(0.0001, now + fadeSec);
                    src.stop(now + fadeSec + 0.03);
                } else {
                    src.stop();
                }
            } catch (e) {}
        }
        activeMusicSources.clear();
    }

    function crossfadeMusic(relPath, opts = {}) {
        const resolved = resolvePath(relPath, 'audio/');
        if (currentMusicPath === resolved && activeMusicSources.size > 0) return;
        const fadeSec = opts.fadeSec ?? 0.75;
        stopMusicClips(fadeSec);
        playClip(relPath, Object.assign({ music: true, loop: true, fadeIn: fadeSec, keepExisting: true }, opts));
    }

    function playAmbient(relPath, opts = {}) {
        const ctx = _getAudioCtx();
        if (!ctx) return;
        const resolved = resolvePath(relPath, 'audio/');
        if (activeAmbient && activeAmbient.path === resolved) return;
        stopAmbient(0.35);
        const epoch = ++ambientEpoch;
        loadAudioBuffer(relPath).then((buffer) => {
            if (!buffer || epoch !== ambientEpoch) return;
            const liveCtx = _getAudioCtx();
            if (!liveCtx) return;
            const src = liveCtx.createBufferSource();
            src.buffer = buffer;
            src.loop = true;
            const g = liveCtx.createGain();
            const vol = opts.volume ?? 0.14;
            g.gain.setValueAtTime(0.0001, liveCtx.currentTime);
            g.gain.linearRampToValueAtTime(vol, liveCtx.currentTime + (opts.fadeIn ?? 1.0));
            src.connect(g);
            g.connect((BO.Sound && BO.Sound.sfxGain) || liveCtx.destination);
            src.start();
            activeAmbient = { src, gain: g, path: resolved };
            src.onended = () => { if (activeAmbient && activeAmbient.src === src) activeAmbient = null; };
        }).catch(() => {});
    }

    function stopAmbient(fadeSec = 0.5) {
        ambientEpoch++;
        if (!activeAmbient) return;
        const cur = activeAmbient;
        activeAmbient = null;
        const liveCtx = _getAudioCtx();
        try {
            if (fadeSec > 0 && cur.gain && liveCtx) {
                const now = liveCtx.currentTime;
                cur.gain.gain.setValueAtTime(cur.gain.gain.value, now);
                cur.gain.gain.linearRampToValueAtTime(0.0001, now + fadeSec);
                cur.src.stop(now + fadeSec + 0.03);
            } else {
                cur.src.stop();
            }
        } catch (e) {}
    }

    BO.Assets = {
        loadTex,
        pbrMat,
        loadSkyboxTex,
        applySkybox,
        loadGLB,
        placeGLB,
        placeGLBInstanced,
        loadAudioBuffer,
        hasAudioBuffer: (relPath) => audioCache.has(resolvePath(relPath, 'audio/')),
        playClip,
        stopMusicClips,
        crossfadeMusic,
        playAmbient,
        stopAmbient,
        isSharedGeo: (g) => sharedGeos.has(g),
        isSharedMat: (m) => sharedMats.has(m) || matCache.has(m),
        isCachedTex: (t) => texCache.has(t),
        hasSharedMatValue: (m) => {
            if (sharedMats.has(m)) return true;
            for (const v of matCache.values()) if (v === m) return true;
            return false;
        },
        hasCachedTexValue: (t) => {
            for (const v of texCache.values()) if (v === t) return true;
            return false;
        }
    };
})(window);

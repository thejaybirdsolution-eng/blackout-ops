/* ============================================================================
   BLACKOUT OPS — Lazy Mode Bundle Loader
   Zero-build IIFE module (ADR-002).
   In unbundled dev (index.html), every mode script is already loaded so
   isLoaded() returns true and ensure() resolves immediately. In bundled builds
   (index.bundled.html), mode bundles are fetched once on demand via dynamic
   <script> tag and initialized cleanly.
   ============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO = global.BO || {};
    const inflight = Object.create(null);
    const loaded = Object.create(null);

    function getManifest() {
        return BO.BUNDLE_MANIFEST || null;
    }

    function isBundled() {
        return !!getManifest();
    }

    function isLoaded(bundleKey) {
        if (!bundleKey) return true;
        const man = getManifest();
        if (!man || !man.bundles || !man.bundles[bundleKey]) return true;
        return !!loaded[bundleKey];
    }

    function _postLoadInit(bundleKey) {
        if (bundleKey === 'rpg' && BO.RPGUI && typeof BO.RPGUI.init === 'function') {
            try { BO.RPGUI.init(); } catch (e) { BO.log?.('BundleLoader', 'error', 'RPGUI.init failed', e); }
        } else if (bundleKey === 'owrpg' && BO.OWRPGUI && typeof BO.OWRPGUI.init === 'function') {
            try { BO.OWRPGUI.init(); } catch (e) { BO.log?.('BundleLoader', 'error', 'OWRPGUI.init failed', e); }
        } else if (bundleKey === 'minigames' && BO.MinigameHub && typeof BO.MinigameHub.init === 'function') {
            try { BO.MinigameHub.init(); } catch (e) { BO.log?.('BundleLoader', 'error', 'MinigameHub.init failed', e); }
        }
        BO.emitGameEvent?.('bundle:loaded', { bundle: bundleKey });
    }

    function ensure(bundleKey) {
        if (!bundleKey) return Promise.resolve(false);
        const man = getManifest();
        if (!man || !man.bundles || !man.bundles[bundleKey]) {
            return Promise.resolve(false);
        }
        if (loaded[bundleKey]) return Promise.resolve(true);
        if (inflight[bundleKey]) return inflight[bundleKey];

        const info = man.bundles[bundleKey];
        const src = info.path + (info.hash ? '?h=' + info.hash : '');
        inflight[bundleKey] = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.async = false;
            s.onload = () => {
                loaded[bundleKey] = true;
                delete inflight[bundleKey];
                _postLoadInit(bundleKey);
                resolve(true);
            };
            s.onerror = (err) => {
                delete inflight[bundleKey];
                BO.log?.('BundleLoader', 'error', 'Failed to load mode bundle ' + src, err);
                reject(err);
            };
            document.head.appendChild(s);
        });
        return inflight[bundleKey];
    }

    function bundleKeyForMode(mode) {
        if (mode === 'rpg') return 'rpg';
        if (mode === 'owrpg') return 'owrpg';
        if (mode === 'survival') return 'survival';
        if (mode === 'minigame' || mode === 'minigames') return 'minigames';
        return null;
    }

    BO.BundleLoader = {
        isBundled,
        isLoaded,
        ensure,
        bundleKeyForMode
    };
})(window);

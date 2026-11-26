/* ============================================================================
   BLACKOUT OPS — Character shading upgrades for the whole zombie/creature roster.

   Hooks CharacterMeshBuilder's material cache so every one of the 70 zombie
   types, the bosses and the quadrupeds pick up:
     - Skin: wrapped diffuse + view-dependent translucency rim (a cheap
       subsurface-scattering approximation) tinted toward a blood-red undertone,
       plus a faint wet specular sheen. Dead flesh stops reading as painted plastic.
     - Eyes: pushed into HDR so they bloom through the post chain, with a hot
       white core; they pulse gently so idle zombies never look frozen.
     - Cloth/fatigue: lifted roughness so torn fabric never shines like vinyl.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const pulsing = [];
    const SKIN_KEY = /^(zskin|qskin|skin|zflesh|zmuscle)/;
    const EYE_KEY = /^(zeye|qeye|eye)/;
    const CLOTH_KEY = /(cloth|fatigue|rag|shirt|pants|bdu|torn)/;

    function applySkinShader(mat) {
        if (!mat || !mat.isMeshStandardMaterial || mat.userData.boSkin) return;
        mat.userData.boSkin = true;
        mat.roughness = Math.min(mat.roughness, 0.62);
        mat.onBeforeCompile = (shader) => {
            shader.uniforms.uSSSColor = { value: new THREE.Color(0.55, 0.08, 0.06) };
            shader.uniforms.uSSSStrength = { value: 0.55 };
            shader.fragmentShader = shader.fragmentShader
                .replace('#include <common>', `#include <common>
uniform vec3 uSSSColor;
uniform float uSSSStrength;`)
                .replace('#include <opaque_fragment>', `
{
    // Translucency rim: light bleeding through thin edges (ears, fingers, torn flesh).
    vec3 V = normalize(vViewPosition);
    float facing = 1.0 - clamp(dot(normal, -V), 0.0, 1.0);
    float rim = pow(facing, 2.2);
    vec3 ambientRef = diffuseColor.rgb * (totalEmissiveRadiance + reflectedLight.indirectDiffuse * 2.0 + 0.04);
    outgoingLight += uSSSColor * rim * uSSSStrength * (0.35 + length(reflectedLight.directDiffuse) * 0.9) + ambientRef * rim * 0.25;
}
#include <opaque_fragment>`);
            // three r149 names the final chunk output_fragment; fall back to it.
            if (shader.fragmentShader.indexOf('uSSSColor * rim') === -1) {
                shader.fragmentShader = shader.fragmentShader.replace('#include <output_fragment>', `
{
    vec3 V = normalize(vViewPosition);
    float facing = 1.0 - clamp(dot(normal, -V), 0.0, 1.0);
    float rim = pow(facing, 2.2);
    vec3 ambientRef = diffuseColor.rgb * (totalEmissiveRadiance + reflectedLight.indirectDiffuse * 2.0 + 0.04);
    outgoingLight += uSSSColor * rim * uSSSStrength * (0.35 + length(reflectedLight.directDiffuse) * 0.9) + ambientRef * rim * 0.25;
}
#include <output_fragment>`);
            }
        };
        mat.customProgramCacheKey = () => 'boSkin1';
        mat.needsUpdate = true;
    }

    function applyEyeGlow(mat) {
        if (!mat || mat.userData.boEye || !mat.color) return;
        mat.userData.boEye = true;
        mat.userData.boEyeBase = mat.color.clone().multiplyScalar(3.2);
        mat.color.copy(mat.userData.boEyeBase);
        mat.toneMapped = true;
        pulsing.push(mat);
    }

    function applyCloth(mat) {
        if (!mat || !mat.isMeshStandardMaterial || mat.userData.boCloth) return;
        mat.userData.boCloth = true;
        mat.roughness = Math.max(mat.roughness, 0.86);
        mat.metalness = Math.min(mat.metalness, 0.05);
    }

    function hook() {
        const CM = BO.CharacterMesh;
        if (!CM || CM.__boShading) return;
        CM.__boShading = true;
        const orig = CM._mat.bind(CM);
        CM._mat = function (key, creator) {
            const mat = orig(key, creator);
            try {
                const k = String(key).toLowerCase();
                if (EYE_KEY.test(k) || k === 'zeyecore') applyEyeGlow(mat);
                else if (SKIN_KEY.test(k)) applySkinShader(mat);
                else if (CLOTH_KEY.test(k)) applyCloth(mat);
            } catch (e) { /* cosmetic only */ }
            return mat;
        };
    }

    let t = 0;
    BO.CharacterShading = {
        init: hook,
        update(dt) {
            t += dt;
            const k = 0.82 + 0.18 * Math.sin(t * 2.6);
            for (let i = 0; i < pulsing.length; i++) {
                const m = pulsing[i];
                m.color.copy(m.userData.boEyeBase).multiplyScalar(k);
            }
        }
    };
    hook();
})(window);

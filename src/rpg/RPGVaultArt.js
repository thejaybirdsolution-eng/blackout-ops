/* Native 3D vault dressing. Decorative geometry stays outside playable space. */
(function (BO) {
    'use strict';

    BO.RPGVaultArt = {
        build(layout, seed) {
            const { hw, hl, wallH, biome, style } = layout;
            const group = new THREE.Group();
            group.name = 'Vault architecture';
            const accent = new THREE.Color(biome.light);
            const dark = new THREE.MeshStandardMaterial({ color: 0x172326, roughness: 0.83, metalness: 0.27 });
            const stone = new THREE.MeshStandardMaterial({ color: 0x293534, roughness: 0.9, metalness: 0.08 });
            const trim = new THREE.MeshStandardMaterial({ color: 0x9e7542, roughness: 0.45, metalness: 0.7 });
            const cool = new THREE.MeshBasicMaterial({ color: accent.clone().multiplyScalar(0.65) });
            const warm = new THREE.MeshBasicMaterial({ color: 0xe5b16b });
            const dustMat = new THREE.PointsMaterial({ color: accent, transparent: true, opacity: 0.37, size: 0.075, depthWrite: false });
            const geometries = [];

            const geom = (shape) => { geometries.push(shape); return shape; };
            const add = (shape, material, x, y, z) => {
                const mesh = new THREE.Mesh(shape, material);
                mesh.position.set(x, y, z);
                group.add(mesh);
                return mesh;
            };
            const box = (w, h, d) => geom(new THREE.BoxGeometry(w, h, d));

            const cap = box(0.85, 0.26, 1.35);
            const shaft = box(0.53, wallH - 0.7, 0.96);
            const chase = box(0.065, wallH - 1.5, 0.72);
            const lantern = box(0.25, 0.63, 0.35);
            const lanternCover = box(0.38, 0.13, 0.48);
            const buttresses = Math.max(3, Math.round(hl / 5));
            for (const side of [-1, 1]) {
                for (let i = 0; i < buttresses; i++) {
                    const x = side * (hw - 0.25);
                    const z = -hl + 4 + i * ((hl * 2 - 8) / Math.max(1, buttresses - 1));
                    add(shaft, stone, x, wallH / 2, z);
                    add(chase, trim, side * (hw - 0.56), wallH / 2, z);
                    add(cap, dark, x, 0.24, z);
                    add(cap, dark, x, wallH - 0.15, z);
                    add(lantern, i % 2 ? cool : warm, side * (hw - 0.69), 2.7, z);
                    for (const dy of [-0.37, 0.37]) add(lanternCover, trim, side * (hw - 0.69), 2.7 + dy, z);
                }
                add(box(0.2, 0.14, hl * 2 - 1.4), trim, side * (hw - 0.28), 4.4, 0);
                add(box(0.09, 0.025, hl * 2 - 2.1), cool, side * (hw - 0.82), 0.025, 0);
            }

            // Roof trusses lead the eye toward the gates while leaving light shafts open.
            const truss = box(hw * 2 - 0.42, 0.39, 0.9);
            const underside = box(hw * 2 - 1.3, 0.08, 0.18);
            const crossbars = style === 'Arcade' || style === 'Cloister' ? 5 : 4;
            for (let i = 0; i < crossbars; i++) {
                const z = -hl + 2.8 + i * ((hl * 2 - 5.6) / (crossbars - 1));
                add(truss, dark, 0, wallH - 0.12, z);
                add(underside, i % 2 ? cool : trim, 0, wallH - 0.34, z);
            }
            const roofLip = box(hw * 2 - 0.25, 0.36, 4.5);
            for (const side of [-1, 1]) add(roofLip, stone, 0, wallH + 0.25, side * (hl - 2.1));

            const marker = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.33, depthWrite: false });
            const ring = add(geom(new THREE.RingGeometry(1.12, 1.23, 8)), marker, layout.spawn.x, 0.035, layout.spawn.z - 2.8);
            ring.rotation.x = -Math.PI / 2;
            const diamond = add(geom(new THREE.RingGeometry(0.42, 0.52, 4)), marker, layout.spawn.x, 0.04, layout.spawn.z - 2.8);
            diamond.rotation.x = -Math.PI / 2;

            const motes = [];
            let state = (seed >>> 0) + 1;
            const rand = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
            for (let i = 0; i < 170; i++) motes.push((rand() - 0.5) * hw * 1.8, 1.55 + rand() * (wallH - 2), (rand() - 0.5) * hl * 1.8);
            const cloud = geom(new THREE.BufferGeometry());
            cloud.setAttribute('position', new THREE.Float32BufferAttribute(motes, 3));
            const particles = new THREE.Points(cloud, dustMat);
            group.add(particles);
            BO.World.scene.add(group);

            return {
                update(elapsed) {
                    particles.position.x = 0.38 * Math.sin(elapsed * 0.32);
                    particles.position.y = 0.15 * Math.sin(elapsed * 0.43);
                },
                dispose() {
                    group.removeFromParent();
                    geometries.forEach((geometry) => geometry.dispose());
                    [dark, stone, trim, cool, warm, dustMat, marker].forEach((material) => material.dispose());
                }
            };
        }
    };
})(window.BO);

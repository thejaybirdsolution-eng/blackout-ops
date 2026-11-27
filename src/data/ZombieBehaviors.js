(function (BO) {
    'use strict';

    // Each gait supplies a relative forward offset, lateral offset, and pace.
    const movement = {
        stop_go: (t) => [0, 0, t % 3 < 0.75 ? 0.12 : 1.55],
        side_skip: (t, d, s) => [0, s * 2, 0.82 + 0.34 * Math.abs(Math.sin(t * 2))],
        reverse_feint: (t, d) => [t % 5 < 0.8 && d < 8 ? -d - 3 : 0, 0, 1.12],
        wide_orbit: (t, d, s) => [d < 10 ? -d * 0.78 : 0, s * 6, 1.05],
        tight_spiral: (t, d, s) => [-d * 0.5, s * Math.min(d * 0.65, 4), 0.9 + 0.16 * Math.sin(t)],
        switchback: (t) => [0, Math.floor(t / 1.3) % 2 ? 4.5 : -4.5, 1],
        figure_eight: (t) => [Math.sin(t * 2) * 2, Math.sin(t) * 4, 1.12],
        corner_cut: (t, d, s) => [0, d > 9 ? s * 5 : 0, d > 9 ? 0.82 : 1.42],
        stalk_and_burst: (t, d) => [0, 0, d > 7 ? 0.72 : 1.7],
        crowd_edge: (t, d, s, nearby) => [0, s * Math.min(nearby * 2, 6), 1.08],
        retreat_to_lunge: (t, d) => [d < 5 && t % 4 < 1.2 ? -d - 4 : 0, 0, d < 5 ? 1.45 : 0.83],
        pulse_dash: (t) => [0, 0, t % 2.6 < 0.32 ? 2.15 : 0.66],
        diagonal_approach: (t, d, s) => [0, s * d * 0.5, 1.04],
        shuffle: (t) => [0, Math.sin(t * 4) * 0.7, 0.72],
        lateral_probe: (t, d, s) => [d < 12 && t % 3 < 1 ? -d : 0, s * 3.6, 0.96],
        oscillating_pressure: (t) => [0, 0, 0.95 + 0.4 * Math.sin(t * 1.3)],
        crescent_run: (t, d, s) => [0, s * Math.sin(Math.min(d, 18) / 18 * Math.PI) * 7, 1.26],
        crouch_creep: (t, d) => [0, 0, d > 10 ? 0.56 : 0.94],
        windup_charge: (t, d) => [0, 0, t % 6 < 1.3 ? 0.03 : (t % 6 < 2.1 ? 2.5 : 0.76)],
        evasive_dash: (t, d, s, nearby, flinch) => [0, flinch ? s * -8 : 0, flinch ? 1.9 : 0.97]
    };

    // range, recovery, telegraph time, damage multiplier, and effect on a landed hit.
    const attacks = {
        hammer_fist: [2.1, 3.4, 0.65, 1.8, (z, p) => { p.cameraShake += 0.13; }],
        plate_rake: [1.8, 3.0, 0.42, 0.75, (z, p) => { p.armor = Math.max(0, p.armor - 24); }],
        shove: [2.0, 2.5, 0.32, 0.55, (z, p) => { p.vel.addScaledVector(p.pos.clone().sub(z.pos).setY(0).normalize(), 9); }],
        hook_pull: [4.2, 5.1, 0.78, 0.68, (z, p) => { p.vel.addScaledVector(z.pos.clone().sub(p.pos).setY(0).normalize(), 8); }],
        disorienting_slap: [1.65, 3.0, 0.27, 0.58, (z, p) => { p.yaw += 0.48; }],
        mag_rip: [1.8, 4.8, 0.52, 0.48, (z, p) => { if (p.activeWeapon?.stats.kind === 'gun') p.activeWeapon.mag = Math.max(0, p.activeWeapon.mag - 5); }],
        elbow_jam: [1.7, 3.7, 0.25, 0.8, (z, p) => { p.swapTimer = Math.max(p.swapTimer, 0.76); }],
        exhaustion_bite: [1.85, 3.9, 0.34, 0.78, (z, p) => { p.tacStamina = Math.max(0, p.tacStamina - 0.5); }],
        rupture_bite: [1.7, 5.7, 0.62, 1.08, (z, p) => { p.regenDelayTimer = Math.max(p.regenDelayTimer, 8); }],
        strip_pouch: [1.6, 6.6, 0.43, 0.36, (z, p) => { p.lethalCount = Math.max(0, p.lethalCount - 1); }],
        break_plate: [1.9, 5.6, 0.56, 0.52, (z, p) => { p.armorReservePlates = Math.max(0, p.armorReservePlates - 1); }],
        scream: [6.0, 7.4, 1.05, 0.35, (z, p) => { BO.Sound.playZombieGroan('wail_void', 1); p.cameraShake += 0.21; }],
        gut_check: [1.65, 3.5, 0.31, 0.95, (z, p) => { p.vel.x *= 0.15; p.vel.z *= 0.15; }],
        uppercut: [1.8, 4.5, 0.48, 0.9, (z, p) => { p.vel.y = Math.max(p.vel.y, 6.2); }],
        caustic_splash: [3.4, 4.9, 0.81, 0.85, (z, p) => { BO.FX.spawnParticles(p.pos, 14, 0x84cc16, 2.9, 3, 0.4, 1); }],
        power_leech: [2.2, 6.2, 0.68, 0.65, (z, p) => { p.ultimateCharge = Math.max(0, p.ultimateCharge - 0.20); }],
        interrupt_reload: [1.9, 3.0, 0.29, 0.6, (z, p) => { p.reloading = false; }],
        pack_signal: [4.0, 8.5, 0.9, 0.48, (z) => {
            for (const ally of BO.ZombiesMode.zombies) {
                if (ally !== z && ally.alive && ally.pos.distanceTo(z.pos) < 8) ally.flinchTimer = ally.stunTimer = 0;
            }
        }],
        self_repair: [2.0, 6.7, 0.72, 0.66, (z) => { z.hp = Math.min(z.maxHp, z.hp + z.maxHp * 0.2); }],
        ward_strike: [2.3, 6, 0.57, 0.75, (z) => { z.wardTimer = Math.max(z.wardTimer, 2.4); }]
    };

    BO.ZombieBehaviors = { movement, attacks };

    const gaits = Object.keys(movement);
    const moves = Object.keys(attacks);
    BO.ZombiesData.ORDERED_PROGRESSION.slice(4, 44).forEach((spec, i) => {
        spec.movementHabit = gaits[i % gaits.length];
        spec.bonusAttacks = [moves[i % moves.length]];
        if (i % 4 === 3) spec.bonusAttacks.push(moves[(i + 7) % moves.length]);
    });
})(window.BO);

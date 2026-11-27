/* ============================================================================
   BLACKOUT OPS — Standard Gamepad Input Poller
   Zero-build IIFE module (ADR-002).
   Supports W3C standard mapping (Xbox / DualSense / Switch Pro controllers):
     - Left stick (axes 0, 1): movement with 0.15 radial deadzone
     - Right stick (axes 2, 3): yaw/pitch with 0.15 deadzone & quadratic curve
     - LT (6) ADS, RT (7) Fire, A (0) Jump, B (1) Crouch/Slide, X (2) Reload,
       Y (3) Switch Weapon, LB (4) Tactical, RB (5) Lethal, L3 (10) Sprint,
       Start (9) Pause
     - Optional subtle ADS aim-assist slowdown gated on Settings 'gamepadAimAssist'
   Only overrides inputs when actively pressed on a connected gamepad so
   keyboard + mouse always remain completely uncontested when idle.
   ============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO = global.BO || {};
    const DEADZONE = 0.15;
    const prevButtons = Object.create(null);
    let padOwnsFire = false;
    let padOwnsAds = false;
    let padOwnsSprint = false;

    function radialDeadzone(x, y, dz) {
        const len = Math.hypot(x, y);
        if (len <= dz) return { x: 0, y: 0 };
        const mag = Math.min(1, (len - dz) / (1 - dz));
        const scale = mag / len;
        return { x: x * scale, y: y * scale };
    }

    function pressed(pad, idx) {
        const b = pad.buttons && pad.buttons[idx];
        return !!(b && (b.pressed || b.value > 0.35));
    }

    function edgePressed(pad, idx) {
        const down = pressed(pad, idx);
        const was = !!prevButtons[idx];
        prevButtons[idx] = down;
        return down && !was;
    }

    function clearOwnedState() {
        const P = BO.Player;
        if (P) {
            P.padMoveX = 0;
            P.padMoveY = 0;
            if (padOwnsFire) {
                P.triggerHeld = false;
                if (BO.Combat && BO.Combat.handleFireInput) BO.Combat.handleFireInput(false, false);
            }
            if (padOwnsAds) P.adsHeld = false;
            if (padOwnsSprint && P.keys) delete P.keys['GamepadSprint'];
        }
        padOwnsFire = false;
        padOwnsAds = false;
        padOwnsSprint = false;
    }

    function poll(dt) {
        const P = BO.Player;
        if (!P || typeof navigator === 'undefined' || !navigator.getGamepads) return;
        const pads = navigator.getGamepads();
        let pad = null;
        if (pads) {
            for (let i = 0; i < pads.length; i++) {
                if (pads[i] && pads[i].connected) { pad = pads[i]; break; }
            }
        }
        if (!pad) {
            if (padOwnsFire || padOwnsAds || padOwnsSprint || (P.padMoveX || P.padMoveY)) {
                clearOwnedState();
            }
            return;
        }

        // Start button (9) toggles Pause during matches
        if (edgePressed(pad, 9) && BO.State && BO.State.screen === 'playing' && BO.Menus?.setPauseOpen) {
            BO.Menus.setPauseOpen(!BO.State.paused);
            return;
        }

        if (!BO.State || BO.State.screen !== 'playing' || BO.State.paused || !P.alive) {
            clearOwnedState();
            return;
        }
        if (BO.SurvivalUI?.open || BO.RPGUI?.modalOpen || BO.OWRPGUI?.modalOpen || BO.ExpansionShop?.open) {
            clearOwnedState();
            return;
        }

        // Left stick -> Player movement axes
        const ls = radialDeadzone(pad.axes[0] || 0, pad.axes[1] || 0, DEADZONE);
        P.padMoveX = ls.x;
        P.padMoveY = -ls.y; // stick up (-1) -> forward (+1)

        // L3 sprint latch / hold
        const l3 = pressed(pad, 10);
        if (l3 && ls.y < -0.3) {
            padOwnsSprint = true;
            P.padSprint = true;
        } else if (padOwnsSprint && Math.abs(ls.x) < 0.1 && Math.abs(ls.y) < 0.1) {
            padOwnsSprint = false;
            P.padSprint = false;
        } else if (!l3 && Math.abs(ls.y) < 0.2) {
            P.padSprint = false;
        }

        // Right stick -> quadratic look curve
        const rs = radialDeadzone(pad.axes[2] || 0, pad.axes[3] || 0, DEADZONE);
        if (rs.x !== 0 || rs.y !== 0) {
            const sens = (BO.Settings?.get?.('sensitivity') || 1.0);
            const adsSens = (BO.Settings?.get?.('adsSensitivity') || 0.65);
            const inv = BO.Settings?.get?.('invertY') ? -1 : 1;
            const aimAssist = !!(BO.Settings?.get?.('gamepadAimAssist') && P.adsAlpha > 0.35);
            const curveX = Math.sign(rs.x) * rs.x * rs.x;
            const curveY = Math.sign(rs.y) * rs.y * rs.y;
            const adsScale = P.adsAlpha > 0.2 ? BO.Math.lerp(1.0, adsSens, P.adsAlpha) : 1.0;
            const rate = 2.85 * sens * adsScale * (aimAssist ? 0.78 : 1.0);
            P.yaw -= curveX * rate * dt;
            P.pitch = BO.Math.clamp(P.pitch - curveY * rate * 0.78 * inv * dt, -1.48, 1.48);
        }

        // LT (6) ADS
        const ltDown = pressed(pad, 6);
        if (ltDown) {
            P.adsHeld = true;
            padOwnsAds = true;
        } else if (padOwnsAds) {
            P.adsHeld = false;
            padOwnsAds = false;
        }

        // RT (7) Fire
        const rtDown = pressed(pad, 7);
        if (rtDown) {
            const fresh = !padOwnsFire;
            P.triggerHeld = true;
            padOwnsFire = true;
            if (BO.Combat && BO.Combat.handleFireInput) BO.Combat.handleFireInput(true, fresh);
        } else if (padOwnsFire) {
            P.triggerHeld = false;
            padOwnsFire = false;
            if (BO.Combat && BO.Combat.handleFireInput) BO.Combat.handleFireInput(false, false);
        }

        // Face & shoulder buttons (edge-triggered)
        if (edgePressed(pad, 0) && typeof P.tryJump === 'function') P.tryJump();
        if (edgePressed(pad, 1) && typeof P.toggleCrouchOrSlide === 'function') P.toggleCrouchOrSlide();
        if (edgePressed(pad, 2) && typeof P.startReload === 'function') P.startReload();
        if (edgePressed(pad, 3) && typeof P.switchWeapon === 'function') P.switchWeapon();
        if (edgePressed(pad, 5) && BO.Combat?.useLethal) BO.Combat.useLethal();
        if (edgePressed(pad, 4) && BO.Combat?.useTactical) BO.Combat.useTactical();
    }

    BO.GamepadInput = {
        DEADZONE,
        poll,
        clear: clearOwnedState,
        radialDeadzone
    };
})(window);

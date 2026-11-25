/* ============================================================================
   BLACKOUT OPS — Open World RPG · Faction Reputation & Hostility
   Reputation in [-1000, +1500]. Gains are scaled by Presence; the rival
   faction loses SPILLOVER × the raw change (only on gains). Raiders and the
   Brood are always hostile. Contested POIs record an owner in poiStates.
============================================================================ */
(function (BO) {
    'use strict';

    const FD = () => BO.OWRPGFactionsData;

    const Factions = {
        rep(s, f) { return s.factions[f] || 0; },

        tier(s, f) {
            const r = this.rep(s, f);
            let t = FD().TIERS[0];
            for (const tier of FD().TIERS) if (r >= tier.min) t = tier;
            return t;
        },

        /** Change reputation. Returns the applied delta for the main faction. */
        add(s, f, amount, opts = {}) {
            if (!FD().FACTIONS[f] || !amount) return 0;
            const before = this.tier(s, f).id;
            let delta = amount;
            if (delta > 0 && !opts.raw) delta *= BO.OWRPGCharacter.derived(s).repMult;
            delta = Math.round(delta);
            s.factions[f] = BO.Math.clamp(this.rep(s, f) + delta, FD().REP_MIN, FD().REP_MAX);
            // Sworn locks out the rival's Sworn tier.
            const rival = FD().FACTIONS[f].rival;
            if (delta > 0 && rival && !opts.noSpill) {
                s.factions[rival] = BO.Math.clamp(this.rep(s, rival) - Math.round(amount * FD().SPILLOVER), FD().REP_MIN, FD().REP_MAX);
            }
            if (this.tier(s, f).id === 'sworn' && rival && this.rep(s, rival) >= 750) s.factions[rival] = 749;
            const after = this.tier(s, f).id;
            BO.Events.emit('owrpg:rep', { faction: f, delta, tierChanged: before !== after, tier: after });
            return delta;
        },

        /** Hostile to the player? groups: raiders/brood always; factions when Hated, or a provoked flag. */
        isHostile(s, group) {
            if (FD().HOSTILE_GROUPS.includes(group)) return true;
            if (!FD().FACTIONS[group]) return false;
            if (s.worldFlags['provoked_' + group]) return true;
            return this.tier(s, group).id === 'hated';
        },

        /** Shunned factions warn, then open fire if you linger inside 12 m. */
        isWary(s, group) { return !!FD().FACTIONS[group] && this.tier(s, group).id === 'shunned'; },

        vendorDiscount(s, f) { const d = FD().TIER_DISCOUNT[this.tier(s, f).id]; return d === null ? null : d; },

        canTrade(s, vendorId) {
            const v = FD().VENDORS[vendorId];
            if (!v) return false;
            return this.vendorDiscount(s, v.faction) !== null && !this.isHostile(s, v.faction);
        },

        /** Killing a faction member costs rep with them and earns a little with their rival. */
        onFactionKill(s, f) {
            if (!FD().FACTIONS[f]) return;
            this.add(s, f, -60, { noSpill: true });
            const rival = FD().FACTIONS[f].rival;
            if (rival) this.add(s, rival, 15, { noSpill: true });
        },

        poiOwner(s, poi) {
            const st = s.poiStates[poi.id];
            return (st && st.owner) || poi.faction || null;
        },

        setPoiOwner(s, poiId, owner) {
            const st = s.poiStates[poiId] || (s.poiStates[poiId] = {});
            if (st.owner === owner) return;
            st.owner = owner;
            BO.Events.emit('owrpg:territory', { poi: poiId, owner });
        }
    };

    BO.OWRPGFactions = Factions;
})(window.BO);

/**
 * Team Entity - Sports Team State and Properties
 * Dominion Wars - Nation Building Strategy Game
 *
 * Teams are owned by nations, start empty (no auto roster), use nation funds directly,
 * and start with 0 fans. Users manage starters/subs, draft players, train them, and
 * level up stadium facilities.
 */

class Team {
    constructor(data) {
        this.id = data.id;
        this.nationId = data.nationId;
        this.sport = data.sport; // 'basketball' | 'hockey' | 'soccer' | 'football'
        this.name = data.name;
        this.founded = data.founded || Date.now();

        // ── Stadium upgrades (levels 0-10) ─────────────────────────────
        this.stadium = {
            seating: 0,        // adds seating capacity
            gym: 0,            // +player skill gain from games and wins
            medicalCenter: 0,  // -injury chance and length
            youthAcademy: 0,   // +skills of new draftable players
            fanExperience: 0,  // +fans from each game played and wins
            concessions: 0,    // +revenue from tickets + X% of fans per game
            technologyCenter: 0, // +fans, +XP/games, +draft skills, -injury, needs tech
        };
        this.stadiumCapacity = 0; // computed from seating level

        // ── Bonus properties (computed from stadium upgrades) ────────────
        this.gymBonus = 0;            // +player skill gain from games and wins
        this.medicalBonus = 0;        // -injury chance and length
        this.youthAcademyBonus = 0;   // +skills of new draftable players
        this.fanExperienceBonus = 0;  // +fans from each game played and wins
        this.concessionsBonus = 0;    // +revenue from tickets + X% of fans per game
        this.technologyBonus = 0;     // +fans, +XP/games, +draft skills, -injury, needs tech

        // ── Roster management ──────────────────────────────────────────
        // players: all players on the team (playerId -> player object)
        this.players = new Map();
        // roster: starting lineup (position -> playerId)
        this.roster = new Map();
        // subs: substitutes (position -> [playerId, ...])
        this.subs = new Map();

        // ── Finances ───────────────────────────────────────────────────
        // No separate team budget - nation.money is used directly.
        // These are tracked for display/revenue calculations only.
        this.revenue = 0;
        this.expenses = 0;

        // ── Performance ────────────────────────────────────────────────
        this.stats = {
            // Universal (all sports)
            wins: 0,
            losses: 0,
            draws: 0,
            totalInjuries: 0,

            // Tournaments (all sports)
            championships: 0,
            playoffAppearances: 0,
            tournamentsEntered: 0,
            tournamentsWon: 0,
            worldTournamentsEntered: 0,
            worldTournamentsWon: 0,

            // Football
            interceptions: 0,
            passes: 0,
            touchdowns: 0,
            conversions2pt: 0,
            extraPoints: 0,
            fieldGoals: 0,

            // Hockey
            fights: 0,
            hockeyPoints: 0,
            hockeyShots: 0,
            hockeyBlocks: 0,

            // Soccer
            soccerPoints: 0,
            soccerSteals: 0,

            // Basketball
            basketballSteals: 0,
            rebounds: 0,
            basketballPoints: 0,
            basketballShots: 0,
            basketballBlocks: 0,
        };

        // ── Fans ───────────────────────────────────────────────────────
        this.fans = 0;           // start with no fans
        this.fanLoyalty = 50;    // 0-100

        // ── Season tracking ────────────────────────────────────────────
        this.currentSeason = 1;
        this.currentWeek = 1;
        this.leagueId = null;    // which league the team belongs to
        this.injuries = new Map(); // playerId -> { type, daysLeft }

        // ── Contract expiry tracking ───────────────────────────────────
        // Players whose contracts expire at end of current season
        this.contractExpiryWarnings = [];
    }

    /** Total roster size (starters + subs) */
    get rosterSize() {
        let subsCount = 0;
        for (const ids of this.subs.values()) subsCount += ids.length;
        return this.roster.size + subsCount;
    }

    /** Get a player object by id if on this team */
    getPlayer(playerId) {
        return this.players.get(playerId) || null;
    }

    /** Check if a position's starter slot is filled */
    hasStarter(position) {
        return this.roster.has(position) && this.roster.get(position) !== null;
    }

    /** Get starter player id for a position */
    getStarter(position) {
        return this.roster.get(position) || null;
    }

    /** Get subs for a position */
    getSubs(position) {
        return this.subs.get(position) || [];
    }

    /** Count injured players */
    get injuredCount() {
        return this.injuries.size;
    }

    /** Win rate (0-100) for this team */
    get winRate() {
        const total = this.stats.wins + this.stats.losses;
        return total === 0 ? 0 : Math.round((this.stats.wins / total) * 100);
    }

    /** Coach rating (0-100) based on wins/losses and tournament success */
    get coachRating() {
        const total = this.stats.wins + this.stats.losses;
        if (total === 0) return 0;
        const winComponent = (this.stats.wins / total) * 60;
        const tournamentComponent = Math.min(
            (this.stats.tournamentsWon + this.stats.worldTournamentsWon) * 10,
            40
        );
        return Math.round(winComponent + tournamentComponent);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Team;
} else if (typeof window !== 'undefined') {
    window.Team = Team;
}

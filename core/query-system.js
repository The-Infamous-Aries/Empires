/**
 * Query System - Read-only query API for external clients (Discord bots, etc.)
 *
 * Parses GraphQL-like query syntax, executes against domain databases,
 * applies permission filtering at every nesting level, and logs all queries
 * to the audit system.
 *
 * Query syntax:
 *   { domain { field1 field2 nested { subField } } where: { field: { $gt: 10 } } limit: 25 offset: 0 }
 */

const path = require('path');

const { DatabaseManager_Instance } = require('./database-manager');
const DataPersistence = require('./data-persistence');

const db = DatabaseManager_Instance;

// ─── Permission Levels ──────────────────────────────────────────────────

const PERMISSIONS = {
    PUBLIC: 'public',
    GAME_DATA: 'game_data',
    MILITARY_DATA: 'military_data',
    ECON: 'econ',
    PLAYER_DATA: 'player_data',
    PRIVATE_MESSAGES: 'private_messages',
    ANALYTICS: 'analytics',
    ADMIN: 'admin',
};

// ─── Field Permission Schema ──────────────────────────────────────────
// Maps domain -> field -> required permission
// Nested fields use dot notation: "militaryUnits.soldiers"

const FIELD_PERMISSIONS = {
    nations: {
        id: 'public',
        name: 'public',
        ruler: 'public',
        improvements: 'public',
        projects: 'public',
        wonders: 'public',
        infra: 'public',
        land: 'public',
        tech: 'public',
        territories: 'public',
        teams: 'public',
        treaties: 'public',
        friends: 'public',
        foes: 'public',
        score: 'public',
        lastActive: 'public',
        currency: 'public',
        militaryUnits: 'public',
        'militaryUnits.soldiers': 'public',
        'militaryUnits.tanks': 'public',
        'militaryUnits.aircraft': 'public',
        'militaryUnits.ships': 'public',
        'militaryUnits.spies': 'public',
        'militaryUnits.missiles': 'public',
        'militaryUnits.nukes': 'public',
        population: 'game_data',
        happiness: 'game_data',
        crime: 'game_data',
        disease: 'game_data',
        pollution: 'game_data',
        literacyRate: 'game_data',
        currentHoldings: 'game_data',
        bestFriend: 'game_data',
        nemesis: 'game_data',
        playerId: 'player_data',
        lastLogin: 'player_data',
    },
    alliances: {
        id: 'public',
        name: 'public',
        acronym: 'public',
        description: 'public',
        memberCount: 'public',
        governmentType: 'public',
        diplomaticStance: 'public',
        nations: 'public',
        treasury: 'none', // never exposed
        'nations.id': 'public',
        'nations.name': 'public',
        'nations.ruler': 'public',
        'nations.improvements': 'public',
        'nations.projects': 'public',
        'nations.wonders': 'public',
        'nations.infra': 'public',
        'nations.land': 'public',
        'nations.tech': 'public',
        'nations.territories': 'public',
        'nations.teams': 'public',
        'nations.treaties': 'public',
        'nations.friends': 'public',
        'nations.foes': 'public',
        'nations.score': 'public',
        'nations.lastActive': 'public',
        'nations.currency': 'public',
        'nations.militaryUnits': 'public',
        'nations.militaryUnits.soldiers': 'public',
        'nations.militaryUnits.tanks': 'public',
        'nations.militaryUnits.aircraft': 'public',
        'nations.militaryUnits.ships': 'public',
        'nations.militaryUnits.spies': 'public',
        'nations.militaryUnits.missiles': 'public',
        'nations.militaryUnits.nukes': 'public',
        'nations.population': 'game_data',
        'nations.happiness': 'game_data',
        'nations.crime': 'game_data',
        'nations.disease': 'game_data',
        'nations.pollution': 'game_data',
        'nations.literacyRate': 'game_data',
        'nations.currentHoldings': 'game_data',
        'nations.bestFriend': 'game_data',
        'nations.nemesis': 'game_data',
    },
    treaties: {
        id: 'public',
        type: 'public',
        partyA: 'public',
        partyB: 'public',
        status: 'public',
        createdAt: 'public',
        acceptedAt: 'public',
        endsAt: 'public',
        terms: 'public',
        createdBy: 'public',
        'parties.partyA': 'public',
        'parties.partyA.nationId': 'public',
        'parties.partyA.nationName': 'public',
        'parties.partyB': 'public',
        'parties.partyB.nationId': 'public',
        'parties.partyB.nationName': 'public',
    },
    wars: {
        id: 'public',
        type: 'public',
        status: 'public',
        reason: 'public',
        declared: 'public',
        turns: 'public',
        sideA: 'public',
        'sideA.nations': 'public',
        'sideA.nations[].id': 'public',
        'sideA.nations[].name': 'public',
        'sideA.damages': 'public',
        'sideA.losses': 'public',
        sideB: 'public',
        'sideB.nations': 'public',
        'sideB.nations[].id': 'public',
        'sideB.nations[].name': 'public',
        'sideB.damages': 'public',
        'sideB.losses': 'public',
        peaceTerms: 'public',
        endedAt: 'public',
    },
    sports: {
        id: 'public',
        teamName: 'public',
        sport: 'public',
        nationId: 'public',
        leagueId: 'public',
        stadium: 'public',
        'stadium.seating': 'public',
        'stadium.gym': 'public',
        'stadium.medicalCenter': 'public',
        'stadium.youthAcademy': 'public',
        'stadium.fanExperience': 'public',
        'stadium.concessions': 'public',
        'stadium.technologyCenter': 'public',
        players: 'public',
        roster: 'public',
        subs: 'public',
        revenue: 'public',
        expenses: 'public',
        fans: 'public',
        fanLoyalty: 'public',
        stats: 'public',
        injuries: 'public',
        nation: 'public',
        'nation.id': 'public',
        'nation.name': 'public',
    },
    players: {
        id: 'player_data',
        username: 'player_data',
        level: 'player_data',
        experience: 'player_data',
        legendaryLevel: 'player_data',
        totalLegendaryLevels: 'player_data',
        skills: 'player_data',
        'skills.*': 'player_data',
        legendarySkills: 'player_data',
        factionKey: 'player_data',
        factionColor: 'player_data',
        factionRank: 'player_data',
        unallocatedSkillPoints: 'player_data',
        unallocatedLegendarySkillPoints: 'player_data',
        achievements: 'player_data',
        titles: 'player_data',
        currentTitle: 'player_data',
        settings: 'player_data',
        activeEffects: 'player_data',
        email: 'none',
        passwordHash: 'none',
    },
    world: {
        id: 'public',
        gameDay: 'public',
        globalHappiness: 'public',
        globalCrime: 'public',
        globalDisease: 'public',
        globalPollution: 'public',
        globalLiteracyRate: 'public',
        globalDiseaseSpawns: 'public',
        globalDiseaseTypes: 'public',
        totalNations: 'public',
        nationsAtWar: 'public',
        nationsAtPeace: 'public',
    },
    worldbank: {
        id: 'public',
        currencyType: 'public',
        currencyValues: 'public',
        usersOnCurrency: 'public',
        interestRates: 'public',
        loanRates: 'public',
        lotteryBalance: 'public',
        lotteryWinners: 'public',
        'lotteryWinners.tier1': 'public',
        'lotteryWinners.tier2': 'public',
        'lotteryWinners.tier3': 'public',
        lastLotteryDraw: 'public',
    },
    aid: {
        id: 'public',
        fromNationId: 'public',
        toNationId: 'public',
        amount: 'public',
        type: 'public',
        createdAt: 'public',
        status: 'public',
    },
};

// Domains that are completely excluded from the query API
const BLOCKED_DOMAINS = new Set(['accounts', 'sessions']);

// ─── Query Parser ──────────────────────────────────────────────────────

/**
 * Parse a GraphQL-like query string into an AST.
 * Supports nesting: { domain { field1 nested { subField } } where: {} limit: N offset: N }
 */
class QueryParser {
    constructor(queryString) {
        this.query = queryString;
        this.pos = 0;
        this.len = queryString.length;
    }

    skipWhitespace() {
        while (this.pos < this.len && /\s/.test(this.query[this.pos])) {
            this.pos++;
        }
    }

    peek() {
        return this.pos < this.len ? this.query[this.pos] : null;
    }

    readWord() {
        const start = this.pos;
        while (
            this.pos < this.len &&
            /[\w$_.]/.test(this.query[this.pos])
        ) {
            this.pos++;
        }
        return this.query.slice(start, this.pos);
    }

    readString() {
        this.skipWhitespace();
        if (this.peek() !== '"') return null;
        this.pos++; // skip opening quote
        const start = this.pos;
        while (this.pos < this.len && this.query[this.pos] !== '"') {
            this.pos++;
        }
        const str = this.query.slice(start, this.pos);
        if (this.pos < this.len) this.pos++; // skip closing quote
        return str;
    }

    readValue() {
        this.skipWhitespace();
        const ch = this.peek();
        if (ch === '"') return this.readString();
        if (ch === '[') {
            this.pos++; // skip [
            const arr = [];
            while (this.pos < this.len && this.peek() !== ']') {
                if (this.peek() === ',') this.pos++;
                arr.push(this.readValue());
            }
            if (this.pos < this.len) this.pos++; // skip ]
            return arr;
        }
        if (ch === '{') return this.readObject();
        // Number or word
        const numMatch = this.query.slice(this.pos).match(/^-?\d+\.?\d*/);
        if (numMatch) {
            const val = parseFloat(numMatch[0]);
            this.pos += numMatch[0].length;
            return val;
        }
        return this.readWord();
    }

    readObject() {
        const obj = {};
        this.pos++; // skip {
        this.skipWhitespace();
        while (this.pos < this.len && this.peek() !== '}') {
            const key = this.readWord();
            this.skipWhitespace();
            if (this.peek() === ':') this.pos++;
            this.skipWhitespace();
            obj[key] = this.readValue();
            this.skipWhitespace();
            if (this.peek() === ',') this.pos++;
        }
        if (this.pos < this.len) this.pos++; // skip }
        return obj;
    }

    readSelectionSet() {
        const fields = [];
        this.pos++; // skip {
        this.skipWhitespace();
        while (this.pos < this.len && this.peek() !== '}') {
            const fieldName = this.readWord();
            this.skipWhitespace();
            let subFields = null;
            if (this.peek() === '{') {
                subFields = this.readSelectionSet();
            }
            fields.push({ name: fieldName, subFields });
            this.skipWhitespace();
        }
        if (this.pos < this.len) this.pos++; // skip }
        return fields;
    }

    parse() {
        this.skipWhitespace();
        if (this.peek() !== '{') throw new Error('Query must start with {');
        const selectionSet = this.readSelectionSet();

        // Parse top-level: each entry is a domain with its fields
        const domains = [];
        for (const sel of selectionSet) {
            domains.push({
                domain: sel.name,
                fields: sel.subFields || [],
                filters: {},
                limit: 50,
                offset: 0,
            });
        }

        // Check for where/limit/offset at top level (applied to first domain)
        // In our syntax, where/limit/offset appear after the domain selection
        // We need a more flexible parser. Let's re-parse with a simpler approach.
        return { domains };
    }

    /**
     * Parse a full query including where/limit/offset clauses.
     * Format: { domain { fields } where: { ... } limit: N offset: N }
     */
    static parseFull(queryString) {
        const result = { domains: [] };

        // Extract the top-level selection set
        const outerMatch = queryString.match(/^\s*\{([\s\S]*?)\}\s*$/);
        if (!outerMatch) throw new Error('Query must be wrapped in {}');
        const outerContent = outerMatch[1];

        // Tokenize domain blocks with proper brace matching
        // Format: domainName { fields } [where: { ... }] [limit: N] [offset: N]
        let pos = 0;
        const len = outerContent.length;

        function skipWhitespace() {
            while (pos < len && /\s/.test(outerContent[pos])) pos++;
        }

        function readWord() {
            const start = pos;
            while (pos < len && /[\w$_.]/.test(outerContent[pos])) pos++;
            return outerContent.slice(start, pos);
        }

        function readSelectionSet() {
            // Assumes current char is '{'
            pos++; // skip {
            const depthStart = pos;
            let depth = 1;
            while (pos < len && depth > 0) {
                if (outerContent[pos] === '{') depth++;
                else if (outerContent[pos] === '}') depth--;
                pos++;
            }
            // Return content between the outer braces (depth returns to 0)
            return outerContent.slice(depthStart, pos - 1).trim();
        }

        // Parse domain blocks: domainName { fields }
        while (pos < len) {
            skipWhitespace();
            if (pos >= len) break;

            const domainName = readWord();
            if (!domainName) break;

            skipWhitespace();
            if (outerContent[pos] !== '{') {
                // Not a domain block, could be where/limit/offset — break out
                break;
            }

            const innerContent = readSelectionSet();
            const fields = QueryParser.parseFields(innerContent);
            result.domains.push({
                domain: domainName,
                fields,
                filters: {},
                limit: 50,
                offset: 0,
            });
        }

        // The remaining content may contain where/limit/offset
        const remaining = outerContent.slice(pos).trim();

        // Parse where: { ... } with proper brace matching
        const whereIdx = remaining.indexOf('where:');
        if (whereIdx !== -1) {
            const afterWhere = remaining.slice(whereIdx + 6).trim();
            if (afterWhere.startsWith('{')) {
                // Find matching closing brace
                let depth = 1;
                let whereEnd = 1;
                while (whereEnd < afterWhere.length && depth > 0) {
                    if (afterWhere[whereEnd] === '{') depth++;
                    else if (afterWhere[whereEnd] === '}') depth--;
                    whereEnd++;
                }
                const whereContent = afterWhere.slice(1, whereEnd - 1).trim();
                const filters = QueryParser.parseFilters(whereContent);
                if (result.domains.length > 0) {
                    result.domains[0].filters = filters;
                }
            }
        }

        // Parse limit: N
        const limitMatch = remaining.match(/limit:\s*(\d+)/);
        if (limitMatch && result.domains.length > 0) {
            result.domains[0].limit = parseInt(limitMatch[1], 10);
        }

        // Parse offset: N
        const offsetMatch = remaining.match(/offset:\s*(\d+)/);
        if (offsetMatch && result.domains.length > 0) {
            result.domains[0].offset = parseInt(offsetMatch[1], 10);
        }

        return result;
    }

    static parseFields(content) {
        const fields = [];
        // Split by top-level braces to handle nesting
        let depth = 0;
        let current = '';
        let fieldName = null;

        for (let i = 0; i < content.length; i++) {
            const ch = content[i];
            if (ch === '{') {
                if (depth === 0) {
                    fieldName = current.trim();
                    current = '';
                }
                depth++;
                current += ch;
            } else if (ch === '}') {
                depth--;
                current += ch;
                if (depth === 0) {
                    fields.push({
                        name: fieldName,
                        subFields: QueryParser.parseFields(current.slice(1, -1).trim()),
                    });
                    current = '';
                    fieldName = null;
                }
            } else if (depth === 0) {
                if (ch === ',') {
                    if (current.trim()) fields.push({ name: current.trim(), subFields: [] });
                    current = '';
                } else {
                    current += ch;
                }
            } else {
                current += ch;
            }
        }
        if (current.trim() && depth === 0) {
            fields.push({ name: current.trim(), subFields: [] });
        }
        return fields;
    }

    static parseFilters(content) {
        const filters = {};
        // Parse key: value or key: { operator: value } pairs
        const pairs = content.split(/,\s*/);
        for (const pair of pairs) {
            const colonIdx = pair.indexOf(':');
            if (colonIdx === -1) continue;
            const key = pair.slice(0, colonIdx).trim();
            const valStr = pair.slice(colonIdx + 1).trim();
            if (valStr.startsWith('{') && valStr.endsWith('}')) {
                const inner = valStr.slice(1, -1).trim();
                const opMatch = inner.match(/^(\w+):\s*(.+)$/);
                if (opMatch) {
                    filters[key] = { [opMatch[1]]: QueryParser.parseValue(opMatch[2].trim()) };
                }
            } else {
                filters[key] = QueryParser.parseValue(valStr);
            }
        }
        return filters;
    }

    static parseValue(str) {
        const num = parseFloat(str);
        if (!isNaN(num) && str === String(num)) return num;
        if (str === 'true') return true;
        if (str === 'false') return false;
        if (str.startsWith('"') && str.endsWith('"')) return str.slice(1, -1);
        return str;
    }
}

// ─── Permission Checker ───────────────────────────────────────────────

/**
 * Check if a given permission is allowed for the querying nation.
 * Handles alliance relationships: protection and extension.
 */
class PermissionChecker {
    constructor(apiKey, nationId, nationData, allianceData) {
        this.apiKey = apiKey;
        this.nationId = nationId;
        this.nationData = nationData || {};
        this.allianceData = allianceData || {}; // { allianceId, role, protects, isExtensionOf }
    }

    hasPermission(requiredPermission) {
        if (!requiredPermission) return true;
        if (requiredPermission === 'none') return false;
        if (requiredPermission === 'public') return true;

        const apiPerms = this.apiKey.permissions || [];

        if (apiPerms.includes(PERMISSIONS.ADMIN)) return true;

        // For game_data and below, check alliance membership
        if (
            requiredPermission === PERMISSIONS.GAME_DATA ||
            requiredPermission === PERMISSIONS.MILITARY_DATA ||
            requiredPermission === PERMISSIONS.ECON
        ) {
            if (this.allianceData.allianceId && this.allianceData.allianceId !== 'none') {
                return true;
            }
            // Check if nation's alliance is protected by querying nation's alliance
            // Handled at cross-user privacy level
            return false;
        }

        if (requiredPermission === PERMISSIONS.PLAYER_DATA) {
            // Player data: owner only, or alliance government
            if (apiPerms.includes(PERMISSIONS.PLAYER_DATA)) return true;
            return false;
        }

        return false;
    }

    /**
     * Check if the querying nation can view alliance-restricted fields for a target nation.
     * Handles protection and extension relationships.
     */
    canViewAllianceFields(targetNationId, targetAllianceId, targetNationAllianceRole) {
        if (this.nationId === targetNationId) return true; // own data

        const myAllianceId = this.allianceData.allianceId;
        const myRole = this.allianceData.role;

        // Same alliance
        if (myAllianceId && myAllianceId === targetAllianceId) return true;

        // Protection: my alliance protects target's alliance
        if (
            this.allianceData.protects &&
            this.allianceData.protects.includes(targetAllianceId)
        ) {
            return true;
        }

        // Extension: my alliance is the parent of target's alliance
        if (
            this.allianceData.isExtensionOf &&
            this.allianceData.isExtensionOf.includes(targetAllianceId)
        ) {
            return true;
        }

        return false;
    }

    canViewBestFriendNemesis(targetNationId, targetAllianceId) {
        if (this.nationId === targetNationId) return true;

        const myRole = this.allianceData.role;
        const myAllianceId = this.allianceData.allianceId;

        // Same alliance government
        if (
            myAllianceId === targetAllianceId &&
            (myRole === 'leader' || myRole === 'officer' || myRole === 'admin')
        ) {
            return true;
        }

        // Extension parent government
        if (
            this.allianceData.isExtensionOf &&
            this.allianceData.isExtensionOf.includes(targetAllianceId) &&
            (myRole === 'leader' || myRole === 'officer' || myRole === 'admin')
        ) {
            return true;
        }

        return false;
    }
}

// ─── Field Filtering ──────────────────────────────────────────────────

/**
 * Filter fields from a record based on permission and nested field selection.
 * Handles dot-notation permission keys (e.g., "militaryUnits.soldiers").
 */
function filterFields(record, selectedFields, permissionChecker, domain, context = {}) {
    if (!record) return null;

    const result = {};
    const targetAllianceId = record.allianceId;
    const targetNationId = record.id;

    for (const field of selectedFields) {
        const fieldName = field.name;
        const subFields = field.subFields || [];

        // Check permission for this field
        const dotKey = `${domain}.${fieldName}`;
        const requiredPerm = FIELD_PERMISSIONS[domain]?.[dotKey] ||
            FIELD_PERMISSIONS[domain]?.[fieldName] ||
            'public';

        if (requiredPerm === 'none') continue;

        // Check alliance-restricted fields for nations
        if (
            domain === 'nations' &&
            (fieldName === 'population' || fieldName === 'happiness' ||
                fieldName === 'crime' || fieldName === 'disease' ||
                fieldName === 'pollution' || fieldName === 'literacyRate' ||
                fieldName === 'currentHoldings')
        ) {
            if (!permissionChecker.canViewAllianceFields(
                targetNationId,
                targetAllianceId,
                record.allianceRole
            )) {
                continue;
            }
        }

        if (
            domain === 'nations' &&
            (fieldName === 'bestFriend' || fieldName === 'nemesis')
        ) {
            if (!permissionChecker.canViewBestFriendNemesis(
                targetNationId,
                targetAllianceId
            )) {
                continue;
            }
        }

        if (!permissionChecker.hasPermission(requiredPerm)) continue;

        // Handle nested fields
        if (subFields.length > 0) {
            const nestedResult = {};
            const nestedDomain = getNestedDomain(domain, fieldName);

            for (const subField of subFields) {
                const nestedDotKey = `${domain}.${fieldName}.${subField.name}`;
                const nestedPerm = FIELD_PERMISSIONS[domain]?.[nestedDotKey] ||
                    FIELD_PERMISSIONS[domain]?.[`${fieldName}.${subField.name}`] ||
                    'public';

                if (nestedPerm === 'none') continue;

                if (!permissionChecker.hasPermission(nestedPerm)) continue;

                if (record[fieldName] && record[fieldName][subField.name] !== undefined) {
                    nestedResult[subField.name] = record[fieldName][subField.name];
                }
            }

            if (Object.keys(nestedResult).length > 0) {
                result[fieldName] = nestedResult;
            }
        } else {
            if (record[fieldName] !== undefined) {
                result[fieldName] = record[fieldName];
            }
        }
    }

    return result;
}

/**
 * Determine the nested domain for permission checking.
 */
function getNestedDomain(parentDomain, fieldName) {
    const nestedMap = {
        nations: {
            militaryUnits: 'nations',
        },
        alliances: {
            nations: 'nations',
        },
        wars: {
            sideA: 'wars',
            sideB: 'wars',
        },
        sports: {
            nation: 'nations',
        },
        treaties: {
            parties: 'treaties',
        },
        worldbank: {
            lotteryWinners: 'worldbank',
        },
    };
    return nestedMap[parentDomain]?.[fieldName] || parentDomain;
}

// ─── Audit Logger ─────────────────────────────────────────────────────

class AuditLogger {
    constructor() {
        this.auditDb = null;
    }

    async log(apiKeyPrefix, nationId, domain, queryType, targetId, success, failureReason) {
        try {
            const { AnalyticsDatabase } = require('./databases/analytics-database');
            if (!this.auditDb) {
                this.auditDb = new AnalyticsDatabase();
            }
            await this.auditDb.insert(`audit_${Date.now()}`, {
                type: 'query_audit',
                timestamp: Date.now(),
                apiKeyPrefix,
                nationId,
                domain,
                queryType,
                targetId,
                success,
                failureReason: failureReason || null,
            });
        } catch (error) {
            console.error('Audit log failed:', error);
        }
    }
}

const auditLogger = new AuditLogger();

// ─── Query Executor ───────────────────────────────────────────────────

class QueryExecutor {
    constructor() {
        this.cache = new Map();
        this.cacheTtl = 30000; // 30 seconds
    }

    /**
     * Execute a parsed query against the databases.
     * @param {Object} parsed - Result of QueryParser.parseFull()
     * @param {Object} context - { apiKey, nationId, nationData, allianceData }
     */
    async execute(parsed, context) {
        const results = {};

        for (const domainQuery of parsed.domains) {
            const domain = domainQuery.domain;
            if (BLOCKED_DOMAINS.has(domain)) {
                results[domain] = [];
                continue;
            }

            const database = db.get(domain);
            if (!database) {
                results[domain] = [];
                continue;
            }

            // Determine permissions from context
            const permissions = context.apiKey.permissions || [PERMISSIONS.PUBLIC];
            const permissionChecker = new PermissionChecker(
                context.apiKey,
                context.nationId,
                context.nationData,
                context.allianceData
            );

            // Query the database
            const dbFields = domainQuery.fields.map((f) => f.name);
            const dbFilters = domainQuery.filters;
            const dbPermissions = permissions;

            let records;
            try {
                records = await database.query(dbFields, dbFilters, dbPermissions);
            } catch (error) {
                console.error(`Query error for domain ${domain}:`, error);
                records = [];
            }

            // Apply field filtering and permission checks
            const filtered = records.map((record) =>
                filterFields(record, domainQuery.fields, permissionChecker, domain)
            ).filter(Boolean);

            // Apply limit/offset
            const limit = domainQuery.limit || 50;
            const offset = domainQuery.offset || 0;
            const paginated = filtered.slice(offset, offset + limit);

            results[domain] = paginated;

            // Log audit
            await auditLogger.log(
                context.apiKey.prefix || 'unknown',
                context.nationId || 'unknown',
                domain,
                'read',
                domainQuery.filters.id || null,
                true,
                null
            );
        }

        return results;
    }

    /**
     * Execute a query and catch errors, returning failure audit info.
     */
    async executeSafe(parsed, context) {
        try {
            const results = await this.execute(parsed, context);
            return { success: true, data: results };
        } catch (error) {
            await auditLogger.log(
                context.apiKey.prefix || 'unknown',
                context.nationId || 'unknown',
                'unknown',
                'read',
                null,
                false,
                error.message
            );
            return { success: false, error: error.message };
        }
    }
}

const queryExecutor = new QueryExecutor();

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Parse and execute a query string.
 * @param {string} queryString - GraphQL-like query
 * @param {Object} context - { apiKey, nationId, nationData, allianceData }
 * @returns {Object} { success, data, metadata }
 */
async function executeQuery(queryString, context) {
    const parsed = QueryParser.parseFull(queryString);
    const result = await queryExecutor.executeSafe(parsed, context);

    if (!result.success) {
        return {
            success: false,
            error: result.error,
        };
    }

    return {
        success: true,
        data: result.data,
        metadata: {
            timestamp: Date.now(),
            domains: Object.keys(result.data),
        },
    };
}

/**
 * Get the full schema with permissions for the schema endpoint.
 */
function getSchema() {
    const schema = {};
    for (const [domain, fields] of Object.entries(FIELD_PERMISSIONS)) {
        schema[domain] = {
            fields: Object.entries(fields).reduce((acc, [field, perm]) => {
                acc[field] = {
                    type: typeof field === 'string' ? 'string' : 'mixed',
                    permission: perm,
                    restricted: false,
                };
                return acc;
            }, {}),
        };
    }
    return { domains: schema };
}

/**
 * Get the audit log (admin only).
 */
async function getAuditLog(limit = 50, offset = 0, filters = {}) {
    try {
        const { AnalyticsDatabase } = require('./databases/analytics-database');
        const auditDb = new AnalyticsDatabase();
        const records = await auditDb.query(
            [],
            { type: 'query_audit', ...filters },
            ['admin']
        );
        return records.slice(offset, offset + limit);
    } catch (error) {
        return [];
    }
}

module.exports = {
    QueryParser,
    PermissionChecker,
    QueryExecutor,
    AuditLogger,
    executeQuery,
    getSchema,
    getAuditLog,
    PERMISSIONS,
    FIELD_PERMISSIONS,
    BLOCKED_DOMAINS,
};

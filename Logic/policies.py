"""
Policy System for Sovereign Nation Game

This module defines the Domestic and War Policy components that determine
nation bonuses, penalties, and strategic choices.
"""

from dataclasses import dataclass
from typing import List, Dict
from enum import Enum


class DomesticPolicyType(Enum):
    """All available domestic policy types in the game."""
    URBANIZATION = "Urbanization"
    AGRARIANISM = "Agrarianism"
    INDUSTRIALIZATION = "Industrialization"
    OPEN_MARKETS = "Open Markets"
    MILITARISM = "Militarism"
    WELFARE_STATE = "Welfare State"
    BALANCED = "Balanced"
    SCIENTIFIC_FOCUS = "Scientific Focus"
    ISOLATIONISM = "Isolationism"
    EXPANSIONISM = "Expansionism"
    ENVIRONMENTALISM = "Environmentalism"
    FREE_TRADE = "Free Trade"
    PROTECTIONISM = "Protectionism"
    MERCANTILISM = "Mercantilism"
    SOCIALISM = "Socialism"
    LIBERTARIANISM = "Libertarianism"
    CONSERVATISM = "Conservatism"
    PROGRESSIVISM = "Progressivism"
    NATIONALISM = "Nationalism"
    GLOBALISM = "Globalism"
    TECHNOLOGICAL = "Technological"
    AGRICULTURAL = "Agricultural"


class WarPolicyType(Enum):
    """All available war policy types in the game."""
    NEUTRAL = "Neutral"
    PIRATE = "Pirate"
    ATTRITION = "Attrition"
    BLITZKRIEG = "Blitzkrieg"
    FORTRESS = "Fortress"
    GUERRILLA = "Guerrilla"
    DIPLOMATIC = "Diplomatic"
    DETERRENCE = "Deterrence"
    TOTAL_WAR = "Total War"
    LIMITED_WAR = "Limited War"
    SIEGE = "Siege"
    TERROR = "Terror"
    STRATEGIC = "Strategic"
    NAVAL = "Naval"
    AIR_SUPERIORITY = "Air Superiority"
    ECONOMIC = "Economic"
    DEFENSIVE = "Defensive"
    AGGRESSIVE = "Aggressive"
    NUCLEAR_FIRST_STRIKE = "Nuclear First Strike"
    CONTAINMENT = "Containment"


@dataclass
class DomesticPolicy:
    """Domestic policy with bonuses and effects."""
    name: str
    description: str  # Flavor text to help players understand the policy
    # Economic effects
    tax_income_bonus: float = 0.0  # Percentage bonus to tax income
    commerce_income_bonus: float = 0.0  # Percentage bonus to commerce income
    trade_income_bonus: float = 0.0  # Percentage bonus to trade income
    citizen_income_bonus: float = 0.0  # Direct bonus to citizen income
    infrastructure_cost_bonus: float = 0.0  # Percentage bonus to infrastructure cost (negative = cheaper)
    improvement_cost_bonus: float = 0.0  # Percentage bonus to improvement build cost (negative = cheaper)
    improvement_upkeep_bonus: float = 0.0  # Percentage bonus to improvement upkeep (negative = cheaper)
    project_cost_bonus: float = 0.0  # Percentage bonus to project cost (negative = cheaper)
    wonder_cost_bonus: float = 0.0  # Percentage bonus to wonder build cost (negative = cheaper)
    land_cost_bonus: float = 0.0  # Percentage bonus to land cost (negative = cheaper)
    new_city_cost_bonus: float = 0.0  # Percentage bonus to new city cost (negative = cheaper)
    # Production effects
    food_production_bonus: float = 0.0  # Percentage bonus to food production
    manufacturing_output_bonus: float = 0.0  # Percentage bonus to manufacturing output
    # Technology effects
    technology_cost_bonus: float = 0.0  # Percentage bonus to technology cost (negative = cheaper)
    tech_income_bonus: float = 0.0  # Percentage bonus to tech income
    # Military effects
    military_unit_cap_bonus: float = 0.0  # Percentage bonus to military unit cap
    soldier_upkeep_bonus: float = 0.0  # Percentage bonus to soldier upkeep
    soldier_efficiency_bonus: float = 0.0  # Percentage bonus to soldier efficiency
    # Population effects
    population_growth_bonus: float = 0.0  # Percentage bonus to population growth
    happiness_bonus: int = 0  # Direct happiness modifier
    # Environmental effects
    pollution_bonus: float = 0.0  # Pollution per city (can be negative for reduction)
    environment_bonus: float = 0.0  # Environment bonus
    power_plant_efficiency_bonus: float = 0.0  # Percentage bonus to power plant efficiency
    disease_bonus: float = 0.0  # Disease per city (can be negative for reduction)
    # Trade effects
    import_export_fees_bonus: float = 0.0  # Percentage bonus to import/export fees (negative = cheaper)
    resource_market_fees_bonus: float = 0.0  # Percentage bonus to resource market fees (negative = cheaper)
    # Defense effects
    spy_defense_bonus: float = 0.0  # Percentage bonus to spy defense
    war_score_gain_bonus: float = 0.0  # Percentage bonus to war score gain
    # War effects
    war_happiness_penalty_reduction: float = 0.0  # Percentage reduction to war happiness penalty
    # Special effects that don't fit in other categories
    special_effect: str = ""  # Description of special effects

    def __str__(self) -> str:
        return self.name


@dataclass
class WarPolicy:
    """War policy with bonuses and effects."""
    name: str
    description: str  # Flavor text to help players understand the policy
    # Combat effects
    attack_damage_bonus: float = 0.0  # Percentage bonus to attack damage
    first_strike_bonus: float = 0.0  # Percentage bonus to first-strike attacks
    offensive_bonus: float = 0.0  # Percentage bonus to offensive attacks
    defensive_bonus: float = 0.0  # Percentage bonus to defense
    ground_defense_bonus: float = 0.0  # Percentage bonus to ground defense
    city_resistance_bonus: float = 0.0  # Bonus to city resistance
    # Soldier effects
    soldier_efficiency_bonus: float = 0.0  # Percentage bonus to soldier efficiency
    soldier_casualties_dealt_bonus: float = 0.0  # Percentage bonus to casualties dealt
    soldier_casualties_taken_bonus: float = 0.0  # Percentage bonus to casualties taken
    # War score effects
    war_score_gain_bonus: float = 0.0  # Percentage bonus to war score gain
    war_score_loss_reduction: float = 0.0  # Percentage reduction to war score loss
    # Economic effects
    loot_bonus: float = 0.0  # Percentage bonus to loot
    resource_steal_bonus: float = 0.0  # Percentage bonus to resource stealing
    infrastructure_damage_bonus: float = 0.0  # Percentage bonus to infrastructure damage
    # Diplomatic effects
    peace_deal_bonus: float = 0.0  # Percentage bonus to peace deal bonuses
    beige_duration_reduction: float = 0.0  # Percentage reduction to beige duration
    blockade_duration_bonus: float = 0.0  # Percentage bonus to blockade duration
    war_declaration_cost_bonus: float = 0.0  # Percentage bonus to war declaration cost
    # Defense effects
    spy_defense_bonus: float = 0.0  # Percentage bonus to spy defense
    spy_operations_bonus: float = 0.0  # Percentage bonus to spy operations
    enemy_spy_operations_reduction: float = 0.0  # Percentage reduction to enemy spy operations
    resistance_recovery_bonus: float = 0.0  # Percentage bonus to resistance recovery
    # Nuclear effects
    nuke_damage_bonus: float = 0.0  # Percentage bonus to nuke damage
    nuke_intercept_chance_bonus: float = 0.0  # Percentage bonus to nuke intercept chance (negative = harder to intercept)
    global_condemnation_bonus: float = 0.0  # Percentage bonus to global condemnation
    # Happiness effects
    war_happiness_penalty_reduction: float = 0.0  # Percentage reduction to war happiness penalty
    enemy_happiness_damage: int = 0  # Happiness damage to enemy per attack
    # Special effects
    nuclear_deterrence: bool = False  # Whether policy provides nuclear deterrence
    # Air effects
    airstrike_damage_bonus: float = 0.0  # Percentage bonus to airstrike damage
    aircraft_losses_bonus: float = 0.0  # Percentage bonus to aircraft losses (negative = fewer losses)
    dogfight_bonus: float = 0.0  # Percentage bonus to dogfight bonus
    missile_damage_bonus: float = 0.0  # Percentage bonus to missile damage
    # Naval effects
    naval_battle_bonus: float = 0.0  # Percentage bonus to naval battle
    ship_efficiency_bonus: float = 0.0  # Percentage bonus to ship efficiency
    special_effect: str = ""  # Description of special effects

    def __str__(self) -> str:
        return self.name


class DomesticPolicySystem:
    """System for managing domestic policy types and their effects."""

    def __init__(self):
        self.policies: Dict[DomesticPolicyType, DomesticPolicy] = self._initialize_policies()

    def _initialize_policies(self) -> Dict[DomesticPolicyType, DomesticPolicy]:
        """Initialize all domestic policy types with their data."""
        return {
            DomesticPolicyType.URBANIZATION: DomesticPolicy(
                name="Urbanization",
                description="Focus on urban development and population growth. Cheaper infrastructure with faster population growth. Choose for rapid expansion.",
                infrastructure_cost_bonus=-0.08,
                population_growth_bonus=0.10
            ),
            DomesticPolicyType.AGRARIANISM: DomesticPolicy(
                name="Agrarianism",
                description="Focus on agricultural development and rural values. Strong food production with land bonuses. Choose for food security.",
                food_production_bonus=0.20,
                land_cost_bonus=-0.08,
                happiness_bonus=2
            ),
            DomesticPolicyType.INDUSTRIALIZATION: DomesticPolicy(
                name="Industrialization",
                description="Focus on industrial development and manufacturing. Strong production with pollution trade-off. Choose for industrial growth.",
                manufacturing_output_bonus=0.15,
                pollution_bonus=2.0,
                improvement_cost_bonus=-0.05
            ),
            DomesticPolicyType.OPEN_MARKETS: DomesticPolicy(
                name="Open Markets",
                description="Free trade with minimal government intervention. Strong commerce and trade bonuses. Choose for economic growth.",
                commerce_income_bonus=0.15,
                trade_income_bonus=0.10,
                import_export_fees_bonus=-0.15
            ),
            DomesticPolicyType.MILITARISM: DomesticPolicy(
                name="Militarism",
                description="Focus on military strength and readiness. Large military with efficiency bonuses. Choose for military dominance.",
                military_unit_cap_bonus=0.15,
                soldier_upkeep_bonus=0.08,
                soldier_efficiency_bonus=0.05
            ),
            DomesticPolicyType.WELFARE_STATE: DomesticPolicy(
                name="Welfare State",
                description="Focus on social welfare and public health. High happiness with disease reduction. Choose for citizen well-being.",
                happiness_bonus=5,
                tax_income_bonus=-0.08,
                disease_bonus=-2.0
            ),
            DomesticPolicyType.BALANCED: DomesticPolicy(
                name="Balanced",
                description="A balanced approach with no specialization. Good for new players or neutral strategies."
            ),
            DomesticPolicyType.SCIENTIFIC_FOCUS: DomesticPolicy(
                name="Scientific Focus",
                description="Focus on scientific advancement and research. Maximum technology bonuses. Choose for tech-focused strategies.",
                technology_cost_bonus=-0.12,
                tech_income_bonus=0.15,
                project_cost_bonus=-0.10
            ),
            DomesticPolicyType.ISOLATIONISM: DomesticPolicy(
                name="Isolationism",
                description="Focus on self-reliance and defense. Strong spy defense with trade penalty. Choose for defensive play.",
                spy_defense_bonus=0.30,
                trade_income_bonus=-0.10,
                war_score_gain_bonus=0.15
            ),
            DomesticPolicyType.EXPANSIONISM: DomesticPolicy(
                name="Expansionism",
                description="Focus on territorial expansion and growth. Cheap land and cities with happiness penalty. Choose for rapid expansion.",
                land_cost_bonus=-0.12,
                new_city_cost_bonus=-0.08,
                happiness_bonus=-2
            ),
            DomesticPolicyType.ENVIRONMENTALISM: DomesticPolicy(
                name="Environmentalism",
                description="Focus on environmental protection and sustainability. Pollution reduction with efficiency bonuses. Choose for eco-friendly strategies.",
                pollution_bonus=-2.0,
                environment_bonus=3.0,
                power_plant_efficiency_bonus=0.05
            ),
            DomesticPolicyType.FREE_TRADE: DomesticPolicy(
                name="Free Trade",
                description="Focus on free trade and market access. Strong trade bonuses with reduced fees. Choose for trade-focused strategies.",
                resource_market_fees_bonus=-0.20,
                trade_income_bonus=0.08,
                commerce_income_bonus=0.05
            ),
            DomesticPolicyType.PROTECTIONISM: DomesticPolicy(
                name="Protectionism",
                description="Focus on protecting domestic industries. Cheaper improvements with trade penalty. Choose for development focus.",
                resource_market_fees_bonus=0.10,
                trade_income_bonus=-0.05,
                improvement_cost_bonus=-0.05
            ),
            DomesticPolicyType.MERCANTILISM: DomesticPolicy(
                name="Mercantilism",
                description="Focus on commercial wealth and trade. Maximum commerce bonuses. Choose for economic dominance.",
                commerce_income_bonus=0.20,
                trade_income_bonus=0.05,
                tax_income_bonus=0.05
            ),
            DomesticPolicyType.SOCIALISM: DomesticPolicy(
                name="Socialism",
                description="Focus on social equality and state services. Strong tax and happiness with commerce penalty. Choose for citizen-focused growth.",
                tax_income_bonus=0.10,
                happiness_bonus=3,
                commerce_income_bonus=-0.05
            ),
            DomesticPolicyType.LIBERTARIANISM: DomesticPolicy(
                name="Libertarianism",
                description="Focus on individual freedom and minimal government. Strong commerce with low upkeep. Choose for economic growth.",
                commerce_income_bonus=0.15,
                tax_income_bonus=-0.05,
                improvement_upkeep_bonus=-0.05
            ),
            DomesticPolicyType.CONSERVATISM: DomesticPolicy(
                name="Conservatism",
                description="Focus on traditional values and stability. Balanced approach with small bonuses. Choose for steady growth.",
                happiness_bonus=2,
                pollution_bonus=-1.0,
                technology_cost_bonus=-0.05
            ),
            DomesticPolicyType.PROGRESSIVISM: DomesticPolicy(
                name="Progressivism",
                description="Focus on progress and reform. Technology and happiness bonuses with lower upkeep. Choose for modernization.",
                technology_cost_bonus=-0.08,
                happiness_bonus=3,
                improvement_upkeep_bonus=-0.05
            ),
            DomesticPolicyType.NATIONALISM: DomesticPolicy(
                name="Nationalism",
                description="Focus on national pride and strength. Strong military and spy bonuses. Choose for patriotic strategies.",
                soldier_efficiency_bonus=0.10,
                happiness_bonus=2,
                spy_defense_bonus=0.10
            ),
            DomesticPolicyType.GLOBALISM: DomesticPolicy(
                name="Globalism",
                description="Focus on international cooperation. Strong trade with war penalty reduction. Choose for diplomatic play.",
                trade_income_bonus=0.15,
                war_happiness_penalty_reduction=0.50,
                special_effect="Diplomacy bonus +20%"
            ),
            DomesticPolicyType.TECHNOLOGICAL: DomesticPolicy(
                name="Technological",
                description="Focus on technological advancement. Maximum technology bonuses. Choose for tech supremacy.",
                technology_cost_bonus=-0.15,
                tech_income_bonus=0.20,
                wonder_cost_bonus=-0.08
            ),
            DomesticPolicyType.AGRICULTURAL: DomesticPolicy(
                name="Agricultural",
                description="Focus on agricultural development and food security. Maximum food production. Choose for food-focused strategies.",
                food_production_bonus=0.25,
                land_cost_bonus=-0.10,
                disease_bonus=-1.0
            ),
        }

    def get_policy(self, policy_type: DomesticPolicyType) -> DomesticPolicy:
        """Get a domestic policy by type."""
        return self.policies[policy_type]

    def get_all_policies(self) -> List[DomesticPolicy]:
        """Get all available domestic policies."""
        return list(self.policies.values())


class WarPolicySystem:
    """System for managing war policy types and their effects."""

    def __init__(self):
        self.policies: Dict[WarPolicyType, WarPolicy] = self._initialize_policies()

    def _initialize_policies(self) -> Dict[WarPolicyType, WarPolicy]:
        """Initialize all war policy types with their data."""
        return {
            WarPolicyType.NEUTRAL: WarPolicy(
                name="Neutral",
                description="A neutral stance with no war bonuses or penalties. Good for peaceful nations or avoiding conflict."
            ),
            WarPolicyType.PIRATE: WarPolicy(
                name="Pirate",
                description="Aggressive raiding strategy focused on loot. Strong war gains with defensive weakness. Choose for raiding strategies.",
                loot_bonus=0.50,
                defensive_bonus=-0.15,
                spy_defense_bonus=-0.10
            ),
            WarPolicyType.ATTRITION: WarPolicy(
                name="Attrition",
                description="War of attrition with high casualties on both sides. Strong war score gains. Choose for grinding victories.",
                soldier_casualties_dealt_bonus=0.15,
                soldier_casualties_taken_bonus=0.15,
                war_score_gain_bonus=0.10
            ),
            WarPolicyType.BLITZKRIEG: WarPolicy(
                name="Blitzkrieg",
                description="Lightning war strategy emphasizing speed and first strikes. Strong offensive bonuses. Choose for aggressive attacks.",
                first_strike_bonus=0.20,
                war_score_gain_bonus=0.15,
                soldier_efficiency_bonus=0.08
            ),
            WarPolicyType.FORTRESS: WarPolicy(
                name="Fortress",
                description="Defensive strategy focused on protection. Strong defense with offensive penalty. Choose for defensive play.",
                defensive_bonus=0.20,
                offensive_bonus=-0.15,
                city_resistance_bonus=10.0
            ),
            WarPolicyType.GUERRILLA: WarPolicy(
                name="Guerrilla",
                description="Asymmetric warfare strategy. Strong ground defense with spy bonuses. Choose for defensive resistance.",
                ground_defense_bonus=0.25,
                offensive_bonus=-0.15,
                spy_defense_bonus=0.15
            ),
            WarPolicyType.DIPLOMATIC: WarPolicy(
                name="Diplomatic",
                description="Diplomatic approach to conflict. Strong peace deal bonuses. Choose for negotiated exits.",
                peace_deal_bonus=0.20,
                war_score_loss_reduction=0.25,
                beige_duration_reduction=0.20
            ),
            WarPolicyType.DETERRENCE: WarPolicy(
                name="Deterrence",
                description="Deterrence strategy preventing first strikes. Strong defense against nuclear attacks. Choose for nuclear defense.",
                nuclear_deterrence=True,
                spy_defense_bonus=0.15,
                war_declaration_cost_bonus=0.50
            ),
            WarPolicyType.TOTAL_WAR: WarPolicy(
                name="Total War",
                description="All-out war strategy with maximum damage. Strong offensive with casualty trade-off. Choose for total destruction.",
                attack_damage_bonus=0.15,
                war_happiness_penalty_reduction=1.0,
                soldier_casualties_taken_bonus=0.10
            ),
            WarPolicyType.LIMITED_WAR: WarPolicy(
                name="Limited War",
                description="Limited conflict with controlled damage. Reduced infrastructure damage with peace bonuses. Choose for restrained warfare.",
                war_score_gain_bonus=0.10,
                infrastructure_damage_bonus=-0.20,
                peace_deal_bonus=0.15
            ),
            WarPolicyType.SIEGE: WarPolicy(
                name="Siege",
                description="Prolonged siege strategy focused on wearing down defenses. Strong defense with city resistance. Choose for defensive sieges.",
                defensive_bonus=0.25,
                offensive_bonus=-0.20,
                city_resistance_bonus=15.0,
                war_score_gain_bonus=0.05
            ),
            WarPolicyType.TERROR: WarPolicy(
                name="Terror",
                description="Psychological warfare targeting enemy morale. Strong spy operations with happiness damage. Choose for psychological attacks.",
                enemy_happiness_damage=-3,
                spy_operations_bonus=0.20,
                loot_bonus=0.25
            ),
            WarPolicyType.STRATEGIC: WarPolicy(
                name="Strategic",
                description="Strategic warfare targeting key infrastructure. Strong airstrike and missile damage. Choose for precision strikes.",
                airstrike_damage_bonus=0.20,
                missile_damage_bonus=0.15,
                war_score_gain_bonus=0.10
            ),
            WarPolicyType.NAVAL: WarPolicy(
                name="Naval",
                description="Naval warfare strategy focused on maritime dominance. Strong naval bonuses with blockade. Choose for naval warfare.",
                naval_battle_bonus=0.25,
                ship_efficiency_bonus=0.10,
                blockade_duration_bonus=0.50
            ),
            WarPolicyType.AIR_SUPERIORITY: WarPolicy(
                name="Air Superiority",
                description="Air dominance strategy focused on controlling the skies. Strong air combat bonuses. Choose for air warfare.",
                airstrike_damage_bonus=0.25,
                aircraft_losses_bonus=-0.15,
                dogfight_bonus=0.20
            ),
            WarPolicyType.ECONOMIC: WarPolicy(
                name="Economic",
                description="Economic warfare focused on resource theft and plunder. Strong resource stealing. Choose for economic gains.",
                loot_bonus=0.30,
                resource_steal_bonus=0.50,
                war_score_gain_bonus=0.05
            ),
            WarPolicyType.DEFENSIVE: WarPolicy(
                name="Defensive",
                description="Defensive strategy focused on protecting infrastructure. Strong defense with resistance recovery. Choose for defensive play.",
                defensive_bonus=0.15,
                infrastructure_damage_bonus=-0.25,
                resistance_recovery_bonus=0.50
            ),
            WarPolicyType.AGGRESSIVE: WarPolicy(
                name="Aggressive",
                description="Aggressive offensive strategy focused on rapid gains. Strong offensive with war score bonus. Choose for aggressive expansion.",
                offensive_bonus=0.15,
                war_score_gain_bonus=0.20,
                soldier_casualties_taken_bonus=0.10
            ),
            WarPolicyType.NUCLEAR_FIRST_STRIKE: WarPolicy(
                name="Nuclear First Strike",
                description="Nuclear first-strike strategy focused on devastating attacks. Strong nuke damage with diplomatic penalty. Choose for nuclear dominance.",
                nuke_damage_bonus=0.20,
                nuke_intercept_chance_bonus=-0.10,
                global_condemnation_bonus=0.50
            ),
            WarPolicyType.CONTAINMENT: WarPolicy(
                name="Containment",
                description="Containment strategy focused on limiting enemy capabilities. Strong spy defense with enemy spy reduction. Choose for containment strategies.",
                spy_defense_bonus=0.25,
                enemy_spy_operations_reduction=-0.20,
                war_score_gain_bonus=0.05
            ),
        }

    def get_policy(self, policy_type: WarPolicyType) -> WarPolicy:
        """Get a war policy by type."""
        return self.policies[policy_type]

    def get_all_policies(self) -> List[WarPolicy]:
        """Get all available war policies."""
        return list(self.policies.values())


class PolicySystem:
    """Main system for managing both domestic and war policies."""

    def __init__(self):
        self.domestic_system = DomesticPolicySystem()
        self.war_system = WarPolicySystem()

    def get_domestic_policy(self, policy_type: DomesticPolicyType) -> DomesticPolicy:
        """Get a domestic policy by type."""
        return self.domestic_system.get_policy(policy_type)

    def get_war_policy(self, policy_type: WarPolicyType) -> WarPolicy:
        """Get a war policy by type."""
        return self.war_system.get_policy(policy_type)

    def get_all_domestic_policies(self) -> List[DomesticPolicy]:
        """Get all available domestic policies."""
        return self.domestic_system.get_all_policies()

    def get_all_war_policies(self) -> List[WarPolicy]:
        """Get all available war policies."""
        return self.war_system.get_all_policies()


# Singleton instance
policy_system = PolicySystem()

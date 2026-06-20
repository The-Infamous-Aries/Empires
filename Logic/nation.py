from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set
from datetime import datetime
import uuid

from .govrel import GovernmentType, Religion, Government, Religion as ReligionClass
from .policies import WarPolicy, DomesticPolicy, PolicySystem, WarPolicyType, DomesticPolicyType
from .resources import ResourceType, ResourceSystem
from .improvements import ImprovementType, ImprovementCategory, ImprovementSystem
from .wonders import WonderType, WonderCategory, WonderSystem
from .projects import ProjectType, ProjectCategory, ProjectSystem
from .bonuses import BonusType, BonusCategory, BonusSystem
from .progression import ProgressionTier
from .diplomacy import DiplomaticRelation


@dataclass
class Nation:
    nation_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    nation_name: str = ""
    ruler_name: str = ""
    capital_city_name: str = ""
    national_color: str = ""
    
    government_type: GovernmentType = GovernmentType.DEMOCRACY
    religion: Optional[Religion] = None
    war_policy_type: WarPolicyType = WarPolicyType.NEUTRAL
    domestic_policy_type: DomesticPolicyType = DomesticPolicyType.BALANCED
    
    cash: float = 10000000.0
    technology: int = 0
    literacy_rate: float = 0.0
    
    tax_rate: float = 0.30
    max_tax_rate: float = 0.20
    citizen_income: float = 5.0
    
    resource_slots: int = 1
    resource_1: ResourceType = ResourceType.GRAIN
    resource_2: Optional[ResourceType] = None
    owned_resources: List[ResourceType] = field(default_factory=list)
    has_water_access: bool = False
    resource_inventory: Dict[ResourceType, float] = field(default_factory=dict)
    resources_producing: List[ResourceType] = field(default_factory=list)
    resource_stockpiles: Dict[ResourceType, float] = field(default_factory=dict)
    
    owned_improvements: Dict[ImprovementType, int] = field(default_factory=dict)
    improvement_slots_available: int = 0
    
    owned_wonders: Set[WonderType] = field(default_factory=set)
    wonder_slots_available: int = 1
    
    completed_projects: Set[ProjectType] = field(default_factory=set)
    project_slots_available: int = 1
    
    active_bonuses: Set[BonusType] = field(default_factory=set)
    
    soldiers: int = 0
    tanks: int = 0
    aircraft: int = 0
    ships: int = 0
    submarines: int = 0
    cruise_missiles: int = 0
    nuclear_weapons: int = 0
    spies: int = 0
    
    soldier_cap: int = 0
    tank_cap: int = 0
    aircraft_cap: int = 0
    ship_cap: int = 0
    missile_cap: int = 0
    nuke_cap: int = 0
    spy_cap: int = 0
    
    trade_posts_built: int = 0
    trade_slots_available: int = 0
    trade_partners: List[str] = field(default_factory=list)
    
    is_blockaded: bool = False
    blockade_end_tick: int = 0
    
    nuclear_weapons_used: int = 0
    diplomatic_penalty: float = 0.0
    world_condemnation_ticks_remaining: int = 0
    
    supply_lines_intact: bool = True
    supply_lines_end_tick: int = 0
    
    commanders: Dict[str, "Commander"] = field(default_factory=dict)
    
    alliance_id: Optional[str] = None
    alliance_role: Optional[str] = None
    
    wars_offensive: List[str] = field(default_factory=list)
    wars_defensive: List[str] = field(default_factory=list)
    war_cooldown: int = 0
    
    war_details: Dict[str, Dict[str, float]] = field(default_factory=dict)
    
    is_beige: bool = False
    beige_ticks_remaining: int = 0
    
    diplomatic_relations: Dict[str, DiplomaticRelation] = field(default_factory=dict)
    active_sanctions: List[str] = field(default_factory=list)
    
    current_tier: ProgressionTier = ProgressionTier.MICRO
    tier_progress: float = 0.0
    
    city_ids: List[str] = field(default_factory=list)
    
    active_events: List[str] = field(default_factory=list)
    
    resource_production_rates: Dict[ResourceType, float] = field(default_factory=dict)
    
    anarchy_ticks_remaining: int = 0
    government_change_cooldown: int = 0
    policy_change_cooldown: int = 0
    religion_change_cooldown: int = 0
    resource_change_cooldown: Dict[ResourceType, int] = field(default_factory=dict)
    infrastructure_disabled_ticks: int = 0
    wmd_banned: bool = False
    wmd_ban_expires_at: Optional[datetime] = None
    wmd_destruction_grace_ends_at: Optional[datetime] = None
    
    active_assembly_effects: List[str] = field(default_factory=list)
    active_congress_effects: List[str] = field(default_factory=list)
    
    created_at: datetime = field(default_factory=datetime.now)
    founding_tick: int = 0
    
    def __post_init__(self):
        if not self.owned_resources:
            self.owned_resources = [self.resource_1]
            if self.resource_2:
                self.owned_resources.append(self.resource_2)
        
        if not self.resource_inventory:
            for resource in self.owned_resources:
                self.resource_inventory[resource] = 1000.0
        
        self.improvement_slots_available = 0
        self.project_slots_available = 0
        self.trade_slots_available = self.trade_posts_built
        
        # Initialize totals from cities (will be updated when cities are added)
        self.total_population = 0
        self.total_infrastructure = 0
        self.total_land = 0
        self.happiness = 10
        self.environment = 3
    
    def get_government(self) -> Government:
        from .govrel import GovernmentSystem
        government_system = GovernmentSystem()
        return government_system.get_government(self.government_type)
    
    def get_religion_bonus(self) -> Optional[float]:
        if self.religion:
            return self.religion.income_bonus
        return None
    
    def get_domestic_policy(self) -> Optional['Policy']:
        """Get the domestic policy object."""
        from .policies import policy_system
        return policy_system.get_policy(self.domestic_policy)
    
    def get_war_policy(self) -> Optional['Policy']:
        """Get the war policy object."""
        from .policies import policy_system
        return policy_system.get_policy(self.war_policy)
    
    def can_declare_war(self) -> bool:
        """Check if nation can declare war."""
        return (
            self.war_cooldown == 0 and
            len(self.wars_offensive) < 3 and
            len(self.wars_defensive) < 3 and
            self.anarchy_ticks_remaining == 0
        )
    
    def is_in_anarchy(self) -> bool:
        """Check if nation is in anarchy."""
        return self.anarchy_ticks_remaining > 0
    
    def can_change_government(self) -> bool:
        """Check if nation can change government."""
        if self.government_change_cooldown == 0:
            return True
        # Check if government_cooldown_removed project is active
        from .projects import ProjectSystem, ProjectType
        project_system = ProjectSystem()
        for project_type in self.completed_projects:
            project = project_system.get_project(project_type)
            if project.government_cooldown_removed:
                return True
        return False
    
    def can_change_policy(self) -> bool:
        """Check if nation can change policy."""
        if self.policy_change_cooldown == 0:
            return True
        # Check if policy_cooldown_removed project is active
        from .projects import ProjectSystem, ProjectType
        project_system = ProjectSystem()
        for project_type in self.completed_projects:
            project = project_system.get_project(project_type)
            if project.policy_cooldown_removed:
                return True
        return False
    
    def can_change_religion(self) -> bool:
        """Check if nation can change religion."""
        if self.religion_change_cooldown == 0:
            return True
        # Check if religion_cooldown_removed project is active
        from .projects import ProjectSystem, ProjectType
        project_system = ProjectSystem()
        for project_type in self.completed_projects:
            project = project_system.get_project(project_type)
            if project.religion_cooldown_removed:
                return True
        return False
    
    def can_change_resource(self, resource: ResourceType) -> bool:
        """Check if nation can change a resource."""
        cooldown = self.resource_change_cooldown.get(resource, 0)
        return cooldown == 0
    
    def has_improvement(self, improvement_type: ImprovementType) -> bool:
        """Check if nation has a specific improvement."""
        return improvement_type in self.owned_improvements and self.owned_improvements[improvement_type] > 0
    
    def has_wonder(self, wonder_type: WonderType) -> bool:
        """Check if nation has a specific wonder."""
        return wonder_type in self.owned_wonders
    
    def has_project(self, project_type: ProjectType) -> bool:
        """Check if nation has completed a specific project."""
        return project_type in self.completed_projects
    
    def has_bonus(self, bonus_type: BonusType) -> bool:
        """Check if nation has a specific bonus active."""
        return bonus_type in self.active_bonuses
    
    def can_build_improvement(self, improvement_type: ImprovementType) -> bool:
        """Check if nation can build an improvement."""
        improvement_system = ImprovementSystem()
        improvement = improvement_system.get_improvement(improvement_type)
        
        # Check if max count reached
        if improvement.max_count > 0:
            current_count = self.owned_improvements.get(improvement_type, 0)
            if current_count >= improvement.max_count:
                return False
        
        # Check if has required improvements
        if improvement.requires_improvement:
            required_improvement = ImprovementType[improvement.requires_improvement.upper().replace(' ', '_')]
            if not self.has_improvement(required_improvement):
                return False
        
        # Check if has required wonder
        if improvement.requires_wonder:
            required_wonder = WonderType[improvement.requires_wonder.upper().replace(' ', '_')]
            if not self.has_wonder(required_wonder):
                return False
        
        # Check if has required project
        if improvement.requires_project:
            required_project = ProjectType[improvement.requires_project.upper().replace(' ', '_')]
            if not self.has_project(required_project):
                return False
        
        # Check tech requirement
        if improvement.requires_tech > 0 and self.technology < improvement.requires_tech:
            return False
        
        # Check power requirement
        if improvement.requires_power:
            # Check if nation has Fusion Plant wonder (eliminates all power requirements)
            if self.has_wonder(WonderType.FUSION_PLANT):
                # Fusion Plant eliminates all power requirements
                pass
            else:
                # Need at least one power plant
                power_plants = [
                    ImprovementType.WOOD_BURNING_PLANT,
                    ImprovementType.COAL_BURNING_PLANT,
                    ImprovementType.OIL_BURNING_PLANT,
                    ImprovementType.URANIUM_POWER_PLANT,
                    ImprovementType.WIND_WATER_POWER
                ]
                has_power = any(self.has_improvement(pp) for pp in power_plants)
                if not has_power:
                    return False
        
        return True
    
    def can_build_wonder(self, wonder_type: WonderType) -> bool:
        """Check if nation can build a wonder."""
        wonder_system = WonderSystem()
        wonder = wonder_system.get_wonder(wonder_type)
        
        # Check if already has wonder
        if self.has_wonder(wonder_type):
            return False
        
        # Check if has required improvement
        if wonder.requires_improvement:
            required_improvement = ImprovementType[wonder.requires_improvement.upper().replace(' ', '_')]
            if not self.has_improvement(required_improvement):
                return False
        
        # Check if has required wonder
        if wonder.requires_wonder:
            required_wonder = WonderType[wonder.requires_wonder.upper().replace(' ', '_')]
            if not self.has_wonder(required_wonder):
                return False
        
        # Check if has required project
        if wonder.requires_project:
            required_project = ProjectType[wonder.requires_project.upper().replace(' ', '_')]
            if not self.has_project(required_project):
                return False
        
        # Check tech requirement
        if wonder.requires_tech > 0 and self.technology < wonder.requires_tech:
            return False
        
        # Check infrastructure requirement
        if wonder.requires_infrastructure > 0 and self.total_infrastructure < wonder.requires_infrastructure:
            return False
        
        # Check land requirement
        if wonder.requires_land > 0 and self.total_land < wonder.requires_land:
            return False
        
        # Check government requirement
        if wonder.requires_government:
            gov_str = wonder.requires_government.upper()
            # Handle multiple government types
            if '/' in gov_str:
                gov_types = [GovernmentType[g.strip()] for g in gov_str.split('/')]
                if self.government_type not in gov_types:
                    return False
            else:
                if self.government_type != GovernmentType[gov_str]:
                    return False
        
        # Check religion requirement
        if wonder.requires_religion:
            if not self.religion or str(self.religion.value) != wonder.requires_religion:
                return False
        
        # Check resource requirement
        if wonder.requires_resource:
            if wonder.requires_resource not in [r.value for r in self.resources_producing]:
                return False
        
        return True
    
    def can_start_project(self, project_type: ProjectType) -> bool:
        """Check if nation can start a project."""
        project_system = ProjectSystem()
        project = project_system.get_project(project_type)
        
        # Check if already completed
        if self.has_project(project_type):
            return False
        
        # Check if has project slot available
        if self.project_slots_available <= 0:
            return False
        
        # Check if has required improvement
        if project.requires_improvement:
            required_improvement = ImprovementType[project.requires_improvement.upper().replace(' ', '_')]
            if not self.has_improvement(required_improvement):
                return False
        
        # Check if has required wonder
        if project.requires_wonder:
            required_wonder = WonderType[project.requires_wonder.upper().replace(' ', '_')]
            if not self.has_wonder(required_wonder):
                return False
        
        # Check tech requirement
        if project.requires_tech > 0 and self.technology < project.requires_tech:
            return False
        
        # Check infrastructure requirement
        if project.requires_infrastructure > 0 and self.total_infrastructure < project.requires_infrastructure:
            return False
        
        # Check resource requirement
        if project.requires_resource:
            if project.requires_resource not in [r.value for r in self.resources_producing]:
                return False
        
        return True
    
    def calculate_military_score(self) -> float:
        """Calculate military score based on units."""
        from . import formulas
        return formulas.calculate_military_score(
            self.soldiers, self.tanks, self.aircraft, self.ships
        )
    
    def calculate_defense_strength(self) -> float:
        """Calculate defense strength based on military units."""
        from . import formulas
        return formulas.calculate_defense_strength(
            self.soldiers, self.tanks, self.aircraft, self.ships
        )
    
    def calculate_nation_strength(self) -> float:
        """Calculate full nation strength (NS) including infrastructure, technology, and cities."""
        from . import formulas
        return formulas.calculate_military_score(
            self.soldiers, self.tanks, self.aircraft, self.ships,
            self.nuclear_weapons, self.total_infrastructure, self.technology,
            len(self.city_ids)
        )
    
    # CITY INTEGRATION
    
    def add_city(self, city_id: str):
        """Add a city to the nation."""
        if city_id not in self.city_ids:
            self.city_ids.append(city_id)
    
    def remove_city(self, city_id: str):
        """Remove a city from the nation."""
        if city_id in self.city_ids:
            self.city_ids.remove(city_id)
    
    def get_city_count(self) -> int:
        """Get the number of cities owned."""
        return len(self.city_ids)
    
    # SPY INTEGRATION
    
    def can_train_spy(self) -> bool:
        """Check if nation can train a spy."""
        return self.spies < self.spy_cap
    
    def train_spy(self) -> bool:
        """Train a spy."""
        if self.can_train_spy():
            self.spies += 1
            return True
        return False
    
    def lose_spy(self) -> bool:
        """Lose a spy (killed in operation)."""
        if self.spies > 0:
            self.spies -= 1
            return True
        return False
    
    # DIPLOMACY INTEGRATION
    
    def get_diplomatic_relation(self, other_nation_id: str) -> Optional[DiplomaticRelation]:
        """Get diplomatic relation with another nation."""
        return self.diplomatic_relations.get(other_nation_id)
    
    def set_diplomatic_relation(self, other_nation_id: str, relation: DiplomaticRelation):
        """Set diplomatic relation with another nation."""
        self.diplomatic_relations[other_nation_id] = relation
    
    def has_sanction(self, sanction_id: str) -> bool:
        """Check if nation has a specific sanction."""
        return sanction_id in self.active_sanctions
    
    def add_sanction(self, sanction_id: str):
        """Add a sanction to the nation."""
        if sanction_id not in self.active_sanctions:
            self.active_sanctions.append(sanction_id)
    
    def remove_sanction(self, sanction_id: str):
        """Remove a sanction from the nation."""
        if sanction_id in self.active_sanctions:
            self.active_sanctions.remove(sanction_id)
    
    # PROGRESSION INTEGRATION
    
    def update_tier(self, new_tier: ProgressionTier):
        """Update the nation's progression tier."""
        self.current_tier = new_tier
    
    def set_tier_progress(self, progress: float):
        """Set progress toward next tier (0.0 to 1.0)."""
        self.tier_progress = max(0.0, min(1.0, progress))
    
    def get_tier_info(self) -> Dict[str, any]:
        """Get tier information."""
        return {
            "tier": self.current_tier,
            "progress": self.tier_progress,
            "ns": self.calculate_nation_strength(),
            "infrastructure": self.total_infrastructure
        }
    
    # BEIGE STATUS INTEGRATION
    
    def enter_beige(self, duration_ticks: int):
        """Enter beige protection."""
        self.is_beige = True
        self.beige_ticks_remaining = duration_ticks
    
    def exit_beige(self):
        """Exit beige protection."""
        self.is_beige = False
        self.beige_ticks_remaining = 0
    
    def update_beige_timer(self):
        """Decrement beige timer by 1 tick."""
        if self.is_beige and self.beige_ticks_remaining > 0:
            self.beige_ticks_remaining -= 1
            if self.beige_ticks_remaining <= 0:
                self.exit_beige()
    
    # EVENTS INTEGRATION
    
    def add_event(self, event_id: str):
        """Add an active event to the nation."""
        if event_id not in self.active_events:
            self.active_events.append(event_id)
    
    def remove_event(self, event_id: str):
        """Remove an event from the nation."""
        if event_id in self.active_events:
            self.active_events.remove(event_id)
    
    def has_event(self, event_id: str) -> bool:
        """Check if nation has a specific active event."""
        return event_id in self.active_events
    
    # RESOURCE PRODUCTION INTEGRATION
    
    def set_resource_production_rate(self, resource: ResourceType, rate: float):
        """Set production rate for a resource."""
        self.resource_production_rates[resource] = rate
    
    def get_resource_production_rate(self, resource: ResourceType) -> float:
        """Get production rate for a resource."""
        return self.resource_production_rates.get(resource, 0.0)
    
    # WAR DETAILS INTEGRATION
    
    def set_war_detail(self, war_id: str, war_score: float = 50.0, attacks_used: int = 0):
        """Set war details for a specific war."""
        self.war_details[war_id] = {
            "war_score": war_score,
            "attacks_used_this_tick": attacks_used
        }
    
    def get_war_detail(self, war_id: str) -> Optional[Dict[str, float]]:
        """Get war details for a specific war."""
        return self.war_details.get(war_id)
    
    def update_war_score(self, war_id: str, delta: float):
        """Update war score for a specific war."""
        if war_id in self.war_details:
            self.war_details[war_id]["war_score"] = max(0.0, min(100.0, self.war_details[war_id]["war_score"] + delta))
    
    def set_war_attacks_used(self, war_id: str, attacks_used: int):
        """Set attacks used this tick for a specific war."""
        if war_id in self.war_details:
            self.war_details[war_id]["attacks_used_this_tick"] = attacks_used
    
    def remove_war_detail(self, war_id: str):
        """Remove war details when war ends."""
        if war_id in self.war_details:
            del self.war_details[war_id]
    
    # TICK PROCESSING INTEGRATION
    
    def process_tick(self):
        """Process all tick-based updates for the nation."""
        # Decrement cooldowns
        if self.war_cooldown > 0:
            self.war_cooldown -= 1
        
        if self.government_change_cooldown > 0:
            self.government_change_cooldown -= 1
        
        if self.policy_change_cooldown > 0:
            self.policy_change_cooldown -= 1
        
        if self.religion_change_cooldown > 0:
            self.religion_change_cooldown -= 1
        
        for resource in self.resource_change_cooldown:
            if self.resource_change_cooldown[resource] > 0:
                self.resource_change_cooldown[resource] -= 1
        
        if self.anarchy_ticks_remaining > 0:
            self.anarchy_ticks_remaining -= 1
        
        # Update beige timer
        self.update_beige_timer()
        
        # Reset war attacks used for next tick
        for war_id in self.war_details:
            self.war_details[war_id]["attacks_used_this_tick"] = 0


class NationSystem:
    """System for managing nations."""
    
    def __init__(self):
        self.nations: Dict[str, Nation] = {}
        from .city import CitySystem
        self.city_system = CitySystem()
    
    def create_nation(self, nation_name: str, ruler_name: str, capital_city_name: str,
                     government_type: GovernmentType, religion: Optional[Religion],
                     starting_resource: ResourceType, national_color: str,
                     war_policy_type: WarPolicyType = WarPolicyType.NEUTRAL,
                     domestic_policy_type: DomesticPolicyType = DomesticPolicyType.BALANCED) -> Nation:
        """Create a new nation with starting values."""
        # Note: Water is a SpecialResourceType, not a ResourceType, so it cannot be passed here anyway
        nation = Nation(
            nation_name=nation_name,
            ruler_name=ruler_name,
            capital_city_name=capital_city_name,
            government_type=government_type,
            religion=religion,
            resource_1=starting_resource,
            national_color=national_color,
            war_policy_type=war_policy_type,
            domestic_policy_type=domestic_policy_type
        )
        
        # Create starting capital city with 100 infra and 100 land
        city = self.city_system.create_city(
            city_name=capital_city_name,
            nation_id=nation.nation_id,
            is_capital=True,
            infrastructure=100,
            land=100
        )
        
        # Add city to nation
        nation.city_ids.append(city.city_id)
        
        # Add starting resource to owned resources and resources producing (check for duplicates)
        if starting_resource not in nation.owned_resources:
            nation.owned_resources.append(starting_resource)
        if starting_resource not in nation.resources_producing:
            nation.resources_producing.append(starting_resource)
        
        # Update nation totals
        cities = self.city_system.get_nation_cities(nation.nation_id)
        nation.total_infrastructure = sum(city.infrastructure for city in cities.values())
        nation.total_land = sum(city.land for city in cities.values())
        nation.improvement_slots_available = sum(city.improvement_slots for city in cities.values())
        nation.project_slots_available = len(cities)  # 1 project slot per city
        
        self.nations[nation.nation_id] = nation
        return nation
    
    def get_nation(self, nation_id: str) -> Optional[Nation]:
        """Get a nation by ID."""
        return self.nations.get(nation_id)
    
    def get_all_nations(self) -> List[Nation]:
        """Get all nations."""
        return list(self.nations.values())
    
    def delete_nation(self, nation_id: str) -> bool:
        """Delete a nation by ID."""
        if nation_id in self.nations:
            del self.nations[nation_id]
            return True
        return False
    
    # PROGRESSION SYSTEM INTEGRATION
    
    def update_all_nations_tier(self):
        """Update tier for all nations based on NS and infrastructure."""
        from .progression import progression_system
        
        for nation in self.nations.values():
            ns = nation.calculate_nation_strength()
            new_tier, progress = progression_system.determine_tier_progression(
                ns, nation.total_infrastructure
            )
            nation.update_tier(new_tier)
            nation.set_tier_progress(progress)
    
    # DIPLOMACY SYSTEM INTEGRATION
    
    def establish_relation(self, nation_a_id: str, nation_b_id: str) -> Optional[DiplomaticRelation]:
        """Establish diplomatic relations between two nations."""
        from .diplomacy import diplomacy_system
        relation = diplomacy_system.establish_relation(nation_a_id, nation_b_id)
        
        nation_a = self.get_nation(nation_a_id)
        nation_b = self.get_nation(nation_b_id)
        
        if nation_a:
            nation_a.set_diplomatic_relation(nation_b_id, relation)
        if nation_b:
            nation_b.set_diplomatic_relation(nation_a_id, relation)
        
        return relation
    
    # SPY SYSTEM INTEGRATION
    
    def calculate_spy_cap_for_nation(self, nation_id: str) -> int:
        """Calculate spy cap for a nation based on population and improvements."""
        nation = self.get_nation(nation_id)
        if not nation:
            return 0
        
        # Base cap: 1 per 1,000 citizens
        base_cap = nation.total_population // 1000
        
        # Cap at 60 without Intelligence Agency project
        if nation.has_project(ProjectType.INTELLIGENCE_AGENCY):
            base_cap = 15  # Increased to 15 with project
        
        return min(base_cap, 60) if not nation.has_project(ProjectType.INTELLIGENCE_AGENCY) else 15
    
    # WAR SYSTEM INTEGRATION
    
    def can_be_declared_war_on(self, defender_id: str, attacker_id: str) -> bool:
        """Check if defender can be declared war on by attacker based on NS rules."""
        defender = self.get_nation(defender_id)
        attacker = self.get_nation(attacker_id)
        
        if not defender or not attacker:
            return False
        
        defender_ns = defender.calculate_nation_strength()
        attacker_ns = attacker.calculate_nation_strength()
        
        # New player protection: under 500 NS cannot be declared on by over 1,000 NS
        if defender_ns < 500 and attacker_ns > 1000:
            return False
        
        # War eligibility: must be within 2× or 0.5× NS
        return (attacker_ns <= defender_ns * 2.0) and (attacker_ns >= defender_ns * 0.5)
    
    # ALLIANCE SYSTEM INTEGRATION
    
    def get_alliance_nations(self, alliance_id: str) -> List[Nation]:
        """Get all nations in an alliance."""
        return [nation for nation in self.nations.values() if nation.alliance_id == alliance_id]
    
    def calculate_alliance_score(self, alliance_id: str) -> float:
        """Calculate total alliance score (sum of all member NS)."""
        alliance_nations = self.get_alliance_nations(alliance_id)
        return sum(nation.calculate_nation_strength() for nation in alliance_nations)
    
    # TICK PROCESSING
    
    def process_all_nations_tick(self, current_tick: int):
        """Process tick updates for all nations."""
        for nation in self.nations.values():
            nation.process_tick()
        
        # Update tiers after processing
        self.update_all_nations_tier()


# Singleton instance
nation_system = NationSystem()

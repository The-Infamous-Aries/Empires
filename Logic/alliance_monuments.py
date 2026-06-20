"""
Alliance Monument System for Sovereign Nation Game

This module defines Alliance Monuments - massive cooperative projects that
require enormous resources (20-50x normal wonder costs) but provide powerful
bonuses to all alliance members. These represent alliance-level infrastructure
and achievements distinct from individual nation wonders.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from enum import Enum
from datetime import datetime, timedelta
import uuid

from .resources import ResourceType


class AllianceMonumentCategory(Enum):
    """Categories of alliance monuments."""
    ECONOMIC = "Economic"
    MILITARY = "Military"
    DIPLOMATIC = "Diplomatic"
    INFRASTRUCTURE = "Infrastructure"
    CULTURAL = "Cultural"
    SCIENTIFIC = "Scientific"
    DEFENSIVE = "Defensive"
    TRADE = "Trade"


class AllianceMonumentType(Enum):
    """All available alliance monument types."""
    
    # ECONOMIC MONUMENTS (15)
    GRAND_MARKETPLACE = "Grand Marketplace"
    ALLIANCE_TREASURY = "Alliance Treasury"
    TRADE_FEDERATION_HQ = "Trade Federation HQ"
    MERCHANT_GUILD = "Merchant Guild"
    BANKING_CONSORTIUM = "Banking Consortium"
    ECONOMIC_SUMMIT_CENTER = "Economic Summit Center"
    GLOBAL_EXCHANGE = "Global Exchange"
    COMMERCE_HUB = "Commerce Hub"
    FINANCIAL_DISTRICT = "Financial District"
    INVESTMENT_TRUST = "Investment Trust"
    RESOURCE_CONSORTIUM = "Resource Consortium"
    TAX_BUREAU = "Tax Bureau"
    REVENUE_SERVICE = "Revenue Service"
    ECONOMIC_COUNCIL = "Economic Council"
    PROSPERITY_FOUNDATION = "Prosperity Foundation"
    
    # MILITARY MONUMENTS (12)
    WAR_COUNCIL_CHAMBER = "War Council Chamber"
    GRAND_ARMORY = "Grand Armory"
    STRATEGIC_COMMAND_CENTER = "Strategic Command Center"
    MILITARY_ACADEMY = "Military Academy"
    FORTIFICATION_NETWORK = "Fortification Network"
    ARMED_FORCES_HQ = "Armed Forces HQ"
    DEFENSE_GRID = "Defense Grid"
    TACTICAL_OPERATIONS_CENTER = "Tactical Operations Center"
    WAR_COLLEGE = "War College"
    MUNITIONS_DEPOT = "Munitions Depot"
    MILITARY_RESEARCH_INSTITUTE = "Military Research Institute"
    VETERANS_HALL = "Veterans Hall"
    
    # DIPLOMATIC MONUMENTS (8)
    EMBASSY_COMPLEX = "Embassy Complex"
    DIPLOMATIC_SUMMIT_HALL = "Diplomatic Summit Hall"
    TREATY_REPOSITORY = "Treaty Repository"
    PEACE_PALACE = "Peace Palace"
    FOREIGN_RELATIONS_MINISTRY = "Foreign Relations Ministry"
    ALLIANCE_FORUM = "Alliance Forum"
    DIPLOMATIC_ACADEMY = "Diplomatic Academy"
    INTERNATIONAL_COURT = "International Court"
    
    # INFRASTRUCTURE MONUMENTS (10)
    GRAND_INFRASTRUCTURE_NETWORK = "Grand Infrastructure Network"
    TRANSPORTATION_GRID = "Transportation Grid"
    COMMUNICATIONS_NEXUS = "Communications Nexus"
    POWER_DISTRIBUTION_HUB = "Power Distribution Hub"
    URBAN_DEVELOPMENT_CENTER = "Urban Development Center"
    LOGISTICS_NETWORK = "Logistics Network"
    ENGINEERING_BUREAU = "Engineering Bureau"
    CONSTRUCTION_CONSORTIUM = "Construction Consortium"
    MAINTENANCE_DEPOT = "Maintenance Depot"
    INFRASTRUCTURE_AUTHORITY = "Infrastructure Authority"
    
    # CULTURAL MONUMENTS (6)
    GRAND_CULTURAL_CENTER = "Grand Cultural Center"
    ALLIANCE_HALL_OF_FAME = "Alliance Hall of Fame"
    CULTURAL_EXCHANGE = "Cultural Exchange"
    HERITAGE_PRESERVATION = "Heritage Preservation"
    ARTS_FEDERATION = "Arts Federation"
    MONUMENT_TO_UNITY = "Monument to Unity"
    
    # SCIENTIFIC MONUMENTS (7)
    RESEARCH_CONSORTIUM = "Research Consortium"
    TECHNOLOGY_INSTITUTE = "Technology Institute"
    INNOVATION_HUB = "Innovation Hub"
    SCIENCE_ACADEMY = "Science Academy"
    LABORATORY_NETWORK = "Laboratory Network"
    DISCOVERY_CENTER = "Discovery Center"
    KNOWLEDGE_REPOSITORY = "Knowledge Repository"
    
    # DEFENSIVE MONUMENTS (8)
    FORTIFIED_ALLIANCE = "Fortified Alliance"
    IRON_CURTAIN_BASTION = "Iron Curtain Bastion"
    SHIELD_GENERATOR = "Shield Generator"
    EARLY_WARNING_SYSTEM = "Early Warning System"
    COUNTER_INTELLIGENCE_HQ = "Counter-Intelligence HQ"
    SECURITY_BUREAU = "Security Bureau"
    PROTECTION_AGENCY = "Protection Agency"
    DEFENSE_AUTHORITY = "Defense Authority"
    
    # TRADE MONUMENTS (8)
    TRADE_ROUTE_NETWORK = "Trade Route Network"
    COMMERCIAL_FEDERATION = "Commercial Federation"
    MARKET_REGULATORY_BODY = "Market Regulatory Body"
    SHIPPING_CONSORTIUM = "Shipping Consortium"
    CUSTOMS_UNION = "Customs Union"
    FREE_TRADE_ZONE = "Free Trade Zone"
    MERCHANT_NAVY = "Merchant Navy"
    TRADE_EMBASSY = "Trade Embassy"


class AllianceMonumentStatus(Enum):
    """Status of alliance monument construction."""
    PROPOSED = "Proposed"
    UNDER_CONSTRUCTION = "Under Construction"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    ABANDONED = "Abandoned"


@dataclass
class AllianceMonumentEffects:
    """Effects that apply to all alliance members."""
    
    # Economic effects
    member_income_bonus: float = 0.0
    member_tax_bonus: float = 0.0
    member_commerce_bonus: float = 0.0
    member_trade_bonus: float = 0.0
    alliance_trade_bonus: float = 0.0
    
    # Military effects
    member_military_efficiency_bonus: float = 0.0
    member_soldier_efficiency_bonus: float = 0.0
    member_tank_efficiency_bonus: float = 0.0
    member_aircraft_efficiency_bonus: float = 0.0
    member_ship_efficiency_bonus: float = 0.0
    member_missile_efficiency_bonus: float = 0.0
    
    # Resource effects
    member_resource_production_bonus: float = 0.0
    
    # Defense effects
    member_spy_defense_bonus: float = 0.0
    member_infrastructure_war_damage_reduction: float = 0.0
    member_land_war_damage_reduction: float = 0.0
    
    # Diplomatic effects
    alliance_treaty_cost_reduction: float = 0.0
    alliance_diplomatic_power_bonus: float = 0.0
    
    # Special effects
    enables_alliance_wars: bool = False
    alliance_bank_interest_bonus: float = 0.0
    alliance_tax_efficiency_bonus: float = 0.0
    member_infrastructure_repair_bonus: float = 0.0
    member_technology_cost_reduction: float = 0.0


@dataclass
class AllianceMonument:
    """Represents an alliance monument under construction or completed."""
    
    monument_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    alliance_id: str = ""
    
    # Monument identity
    monument_type: AllianceMonumentType = AllianceMonumentType.GRAND_MARKETPLACE
    name: str = ""
    description: str = ""
    category: AllianceMonumentCategory = AllianceMonumentCategory.ECONOMIC
    
    # Construction status
    status: AllianceMonumentStatus = AllianceMonumentStatus.PROPOSED
    is_active: bool = True
    
    # Construction timeline
    proposed_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_completion: Optional[datetime] = None
    
    # Construction progress
    progress_percentage: float = 0.0
    
    # Costs
    total_cash_cost: float = 0.0
    cash_contributed: float = 0.0
    resource_costs: Dict[ResourceType, float] = field(default_factory=dict)
    resources_contributed: Dict[ResourceType, float] = field(default_factory=dict)
    
    # Contributions tracking (nation_id -> amount)
    cash_contributions: Dict[str, float] = field(default_factory=dict)
    resource_contributions: Dict[str, Dict[ResourceType, float]] = field(default_factory=dict)
    
    # Monument effects
    effects: AllianceMonumentEffects = field(default_factory=AllianceMonumentEffects)
    
    # Upkeep (if any)
    upkeep_per_tick: float = 0.0
    alliance_bank_funded: bool = True
    
    # Construction settings
    minimum_contributors: int = 3
    construction_speed_modifier: float = 1.0
    
    def get_total_progress(self) -> float:
        """Calculate total construction progress percentage."""
        if self.total_cash_cost == 0:
            return 0.0
        
        cash_progress = (self.cash_contributed / self.total_cash_cost) * 100
        
        total_resource_cost = sum(self.resource_costs.values())
        total_resource_contributed = sum(self.resources_contributed.values())
        
        if total_resource_cost > 0:
            resource_progress = (total_resource_contributed / total_resource_cost) * 100
            return (cash_progress + resource_progress) / 2.0
        
        return cash_progress
    
    def is_fully_funded(self) -> bool:
        """Check if monument is fully funded."""
        if self.cash_contributed < self.total_cash_cost:
            return False
        
        for resource_type, cost in self.resource_costs.items():
            if self.resources_contributed.get(resource_type, 0.0) < cost:
                return False
        
        return True
    
    def get_remaining_cash(self) -> float:
        """Get remaining cash needed."""
        return max(0.0, self.total_cash_cost - self.cash_contributed)
    
    def get_remaining_resources(self) -> Dict[ResourceType, float]:
        """Get remaining resources needed."""
        remaining = {}
        for resource_type, cost in self.resource_costs.items():
            contributed = self.resources_contributed.get(resource_type, 0.0)
            if contributed < cost:
                remaining[resource_type] = cost - contributed
        return remaining
    
    def contribute_cash(self, nation_id: str, amount: float) -> bool:
        """Contribute cash to monument construction."""
        if amount <= 0:
            return False
        
        if self.cash_contributed + amount > self.total_cash_cost:
            return False
        
        self.cash_contributed += amount
        
        if nation_id not in self.cash_contributions:
            self.cash_contributions[nation_id] = 0.0
        self.cash_contributions[nation_id] += amount
        
        self.progress_percentage = self.get_total_progress()
        return True
    
    def contribute_resource(self, nation_id: str, resource_type: ResourceType, amount: float) -> bool:
        """Contribute resource to monument construction."""
        if amount <= 0:
            return False
        
        if resource_type not in self.resource_costs:
            return False
        
        current = self.resources_contributed.get(resource_type, 0.0)
        if current + amount > self.resource_costs[resource_type]:
            return False
        
        self.resources_contributed[resource_type] = current + amount
        
        if nation_id not in self.resource_contributions:
            self.resource_contributions[nation_id] = {}
        
        if resource_type not in self.resource_contributions[nation_id]:
            self.resource_contributions[nation_id][resource_type] = 0.0
        
        self.resource_contributions[nation_id][resource_type] += amount
        
        self.progress_percentage = self.get_total_progress()
        return True
    
    def start_construction(self) -> bool:
        """Start monument construction."""
        if self.status != AllianceMonumentStatus.PROPOSED:
            return False
        
        if not self.is_fully_funded():
            return False
        
        self.status = AllianceMonumentStatus.UNDER_CONSTRUCTION
        self.started_at = datetime.now()
        
        base_days = 30
        modified_days = int(base_days / self.construction_speed_modifier)
        self.estimated_completion = datetime.now() + timedelta(days=modified_days)
        
        return True
    
    def complete_construction(self) -> bool:
        """Complete monument construction and activate effects."""
        if self.status != AllianceMonumentStatus.UNDER_CONSTRUCTION:
            return False
        
        if not self.is_fully_funded():
            return False
        
        self.status = AllianceMonumentStatus.COMPLETED
        self.completed_at = datetime.now()
        self.progress_percentage = 100.0
        self.is_active = True
        
        return True
    
    def cancel_construction(self) -> bool:
        """Cancel monument construction."""
        if self.status in [AllianceMonumentStatus.COMPLETED, AllianceMonumentStatus.CANCELLED]:
            return False
        
        self.status = AllianceMonumentStatus.CANCELLED
        self.is_active = False
        
        return True


class AllianceMonumentSystem:
    """System for managing alliance monuments."""
    
    def __init__(self):
        self.monuments: Dict[str, AllianceMonument] = {}
        self.monument_templates: Dict[AllianceMonumentType, Dict[str, Any]] = self._initialize_templates()
    
    def _initialize_templates(self) -> Dict[AllianceMonumentType, Dict[str, Any]]:
        """Initialize monument templates with costs and effects."""
        templates = {}
        
        # ECONOMIC MONUMENTS (15)
        templates[AllianceMonumentType.GRAND_MARKETPLACE] = {
            "name": "Grand Marketplace",
            "description": "Massive centralized market serving all alliance members. Boosts commerce and trade across the alliance.",
            "category": AllianceMonumentCategory.ECONOMIC,
            "cash_cost": 600_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 50000, ResourceType.IRON: 45000, ResourceType.GOLD: 40000},
            "upkeep": 10000.0,
            "effects": AllianceMonumentEffects(member_commerce_bonus=0.15, member_trade_bonus=0.10, alliance_bank_interest_bonus=0.05)
        }
        
        templates[AllianceMonumentType.ALLIANCE_TREASURY] = {
            "name": "Alliance Treasury",
            "description": "Centralized financial institution managing alliance wealth. Improves tax collection and banking efficiency.",
            "category": AllianceMonumentCategory.ECONOMIC,
            "cash_cost": 1_000_000_000.0,
            "resource_costs": {ResourceType.GOLD: 60000, ResourceType.LIMESTONE: 55000, ResourceType.IRON: 50000},
            "upkeep": 15000.0,
            "effects": AllianceMonumentEffects(member_tax_bonus=0.10, alliance_tax_efficiency_bonus=0.15, alliance_bank_interest_bonus=0.10)
        }
        
        templates[AllianceMonumentType.TRADE_FEDERATION_HQ] = {
            "name": "Trade Federation HQ",
            "description": "Headquarters of the alliance trade federation. Coordinates trade routes and commercial activities.",
            "category": AllianceMonumentCategory.ECONOMIC,
            "cash_cost": 800_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 55000, ResourceType.IRON: 50000, ResourceType.GOLD: 45000},
            "upkeep": 12000.0,
            "effects": AllianceMonumentEffects(member_trade_bonus=0.20, member_commerce_bonus=0.10, alliance_trade_bonus=0.15)
        }
        
        templates[AllianceMonumentType.MERCHANT_GUILD] = {
            "name": "Merchant Guild",
            "description": "Powerful guild of alliance merchants. Provides commercial expertise and trade networks.",
            "category": AllianceMonumentCategory.ECONOMIC,
            "cash_cost": 500_000_000.0,
            "resource_costs": {ResourceType.TIMBER: 50000, ResourceType.IRON: 45000, ResourceType.GOLD: 40000},
            "upkeep": 8000.0,
            "effects": AllianceMonumentEffects(member_commerce_bonus=0.12, member_trade_bonus=0.08, member_income_bonus=0.05)
        }
        
        templates[AllianceMonumentType.BANKING_CONSORTIUM] = {
            "name": "Banking Consortium",
            "description": "Alliance banking cooperative. Provides financial services and investment opportunities.",
            "category": AllianceMonumentCategory.ECONOMIC,
            "cash_cost": 750_000_000.0,
            "resource_costs": {ResourceType.GOLD: 55000, ResourceType.LIMESTONE: 50000, ResourceType.IRON: 45000},
            "upkeep": 11000.0,
            "effects": AllianceMonumentEffects(alliance_bank_interest_bonus=0.12, member_income_bonus=0.08, alliance_tax_efficiency_bonus=0.10)
        }
        
        templates[AllianceMonumentType.ECONOMIC_SUMMIT_CENTER] = {
            "name": "Economic Summit Center",
            "description": "Venue for alliance economic planning and coordination. Improves economic decision-making.",
            "category": AllianceMonumentCategory.ECONOMIC,
            "cash_cost": 550_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 52000, ResourceType.IRON: 48000, ResourceType.GOLD: 42000},
            "upkeep": 9000.0,
            "effects": AllianceMonumentEffects(member_tax_bonus=0.08, member_commerce_bonus=0.10, alliance_diplomatic_power_bonus=0.05)
        }
        
        templates[AllianceMonumentType.GLOBAL_EXCHANGE] = {
            "name": "Global Exchange",
            "description": "International trading floor for alliance members. Connects alliance to global markets.",
            "category": AllianceMonumentCategory.ECONOMIC,
            "cash_cost": 900_000_000.0,
            "resource_costs": {ResourceType.GOLD: 58000, ResourceType.LIMESTONE: 53000, ResourceType.IRON: 48000},
            "upkeep": 14000.0,
            "effects": AllianceMonumentEffects(member_trade_bonus=0.25, member_commerce_bonus=0.15, member_income_bonus=0.10)
        }
        
        templates[AllianceMonumentType.COMMERCE_HUB] = {
            "name": "Commerce Hub",
            "description": "Central commercial district serving alliance businesses. Streamlines commercial activities.",
            "category": AllianceMonumentCategory.ECONOMIC,
            "cash_cost": 450_000_000.0,
            "resource_costs": {ResourceType.TIMBER: 48000, ResourceType.IRON: 44000, ResourceType.GOLD: 38000},
            "upkeep": 7000.0,
            "effects": AllianceMonumentEffects(member_commerce_bonus=0.10, member_trade_bonus=0.07, alliance_trade_bonus=0.08)
        }
        
        templates[AllianceMonumentType.FINANCIAL_DISTRICT] = {
            "name": "Financial District",
            "description": "Dedicated financial center for alliance banking and investment operations.",
            "category": AllianceMonumentCategory.ECONOMIC,
            "cash_cost": 700_000_000.0,
            "resource_costs": {ResourceType.GOLD: 54000, ResourceType.LIMESTONE: 49000, ResourceType.IRON: 44000},
            "upkeep": 10500.0,
            "effects": AllianceMonumentEffects(alliance_bank_interest_bonus=0.10, member_income_bonus=0.07, member_tax_bonus=0.05)
        }
        
        templates[AllianceMonumentType.INVESTMENT_TRUST] = {
            "name": "Investment Trust",
            "description": "Alliance investment fund. Provides returns on alliance capital investments.",
            "category": AllianceMonumentCategory.ECONOMIC,
            "cash_cost": 650_000_000.0,
            "resource_costs": {ResourceType.GOLD: 52000, ResourceType.IRON: 47000, ResourceType.LIMESTONE: 42000},
            "upkeep": 9500.0,
            "effects": AllianceMonumentEffects(alliance_bank_interest_bonus=0.15, member_income_bonus=0.06, alliance_tax_efficiency_bonus=0.08)
        }
        
        templates[AllianceMonumentType.RESOURCE_CONSORTIUM] = {
            "name": "Resource Consortium",
            "description": "Alliance resource management organization. Optimizes resource production and distribution.",
            "category": AllianceMonumentCategory.ECONOMIC,
            "cash_cost": 600_000_000.0,
            "resource_costs": {ResourceType.IRON: 50000, ResourceType.COAL: 45000, ResourceType.LIMESTONE: 40000},
            "upkeep": 10000.0,
            "effects": AllianceMonumentEffects(member_resource_production_bonus=0.10, member_trade_bonus=0.08, alliance_trade_bonus=0.10)
        }
        
        templates[AllianceMonumentType.TAX_BUREAU] = {
            "name": "Tax Bureau",
            "description": "Alliance tax collection and administration agency. Improves tax efficiency.",
            "category": AllianceMonumentCategory.ECONOMIC,
            "cash_cost": 400_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 45000, ResourceType.IRON: 40000, ResourceType.GOLD: 35000},
            "upkeep": 6500.0,
            "effects": AllianceMonumentEffects(alliance_tax_efficiency_bonus=0.20, member_tax_bonus=0.07, member_income_bonus=0.05)
        }
        
        templates[AllianceMonumentType.REVENUE_SERVICE] = {
            "name": "Revenue Service",
            "description": "Alliance revenue collection service. Ensures efficient tax collection and compliance.",
            "category": AllianceMonumentCategory.ECONOMIC,
            "cash_cost": 480_000_000.0,
            "resource_costs": {ResourceType.GOLD: 46000, ResourceType.LIMESTONE: 42000, ResourceType.IRON: 38000},
            "upkeep": 7500.0,
            "effects": AllianceMonumentEffects(alliance_tax_efficiency_bonus=0.15, member_tax_bonus=0.08, alliance_bank_interest_bonus=0.05)
        }
        
        templates[AllianceMonumentType.ECONOMIC_COUNCIL] = {
            "name": "Economic Council",
            "description": "Alliance economic policy-making body. Coordinates economic strategy across members.",
            "category": AllianceMonumentCategory.ECONOMIC,
            "cash_cost": 580_000_000.0,
            "resource_costs": {ResourceType.GOLD: 50000, ResourceType.LIMESTONE: 46000, ResourceType.IRON: 42000},
            "upkeep": 8800.0,
            "effects": AllianceMonumentEffects(member_commerce_bonus=0.08, member_trade_bonus=0.08, member_tax_bonus=0.06, alliance_diplomatic_power_bonus=0.08)
        }
        
        templates[AllianceMonumentType.PROSPERITY_FOUNDATION] = {
            "name": "Prosperity Foundation",
            "description": "Alliance economic development foundation. Promotes prosperity across alliance members.",
            "category": AllianceMonumentCategory.ECONOMIC,
            "cash_cost": 720_000_000.0,
            "resource_costs": {ResourceType.GOLD: 56000, ResourceType.LIMESTONE: 51000, ResourceType.IRON: 46000},
            "upkeep": 11000.0,
            "effects": AllianceMonumentEffects(member_income_bonus=0.12, member_commerce_bonus=0.10, member_trade_bonus=0.08)
        }
        
        # MILITARY MONUMENTS (12)
        templates[AllianceMonumentType.WAR_COUNCIL_CHAMBER] = {
            "name": "War Council Chamber",
            "description": "Central command for alliance military operations. Enables coordinated warfare and strategy.",
            "category": AllianceMonumentCategory.MILITARY,
            "cash_cost": 750_000_000.0,
            "resource_costs": {ResourceType.IRON: 60000, ResourceType.LIMESTONE: 55000, ResourceType.GOLD: 50000},
            "upkeep": 12000.0,
            "effects": AllianceMonumentEffects(enables_alliance_wars=True, member_military_efficiency_bonus=0.10, alliance_diplomatic_power_bonus=0.10)
        }
        
        templates[AllianceMonumentType.GRAND_ARMORY] = {
            "name": "Grand Armory",
            "description": "Massive alliance weapons manufacturing and storage facility. Improves military equipment.",
            "category": AllianceMonumentCategory.MILITARY,
            "cash_cost": 1_500_000_000.0,
            "resource_costs": {ResourceType.IRON: 70000, ResourceType.LIMESTONE: 65000, ResourceType.GOLD: 60000},
            "upkeep": 20000.0,
            "effects": AllianceMonumentEffects(member_military_efficiency_bonus=0.15, member_soldier_efficiency_bonus=0.10, member_tank_efficiency_bonus=0.10)
        }
        
        templates[AllianceMonumentType.STRATEGIC_COMMAND_CENTER] = {
            "name": "Strategic Command Center",
            "description": "Advanced military command and control facility. Enhances strategic capabilities.",
            "category": AllianceMonumentCategory.MILITARY,
            "cash_cost": 1_200_000_000.0,
            "resource_costs": {ResourceType.IRON: 65000, ResourceType.GOLD: 60000, ResourceType.LIMESTONE: 55000},
            "upkeep": 16000.0,
            "effects": AllianceMonumentEffects(member_military_efficiency_bonus=0.10, member_missile_efficiency_bonus=0.12, member_spy_defense_bonus=0.08)
        }
        
        templates[AllianceMonumentType.MILITARY_ACADEMY] = {
            "name": "Military Academy",
            "description": "Elite alliance military training institution. Improves military effectiveness.",
            "category": AllianceMonumentCategory.MILITARY,
            "cash_cost": 600_000_000.0,
            "resource_costs": {ResourceType.IRON: 55000, ResourceType.LIMESTONE: 50000, ResourceType.GOLD: 45000},
            "upkeep": 10000.0,
            "effects": AllianceMonumentEffects(member_military_efficiency_bonus=0.12, member_soldier_efficiency_bonus=0.08, member_tank_efficiency_bonus=0.08)
        }
        
        templates[AllianceMonumentType.FORTIFICATION_NETWORK] = {
            "name": "Fortification Network",
            "description": "Alliance-wide defensive fortifications. Improves member nation defenses.",
            "category": AllianceMonumentCategory.MILITARY,
            "cash_cost": 900_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 70000, ResourceType.IRON: 65000, ResourceType.GOLD: 55000},
            "upkeep": 14000.0,
            "effects": AllianceMonumentEffects(member_infrastructure_war_damage_reduction=0.15, member_land_war_damage_reduction=0.15, member_spy_defense_bonus=0.10)
        }
        
        templates[AllianceMonumentType.ARMED_FORCES_HQ] = {
            "name": "Armed Forces HQ",
            "description": "Central headquarters for alliance armed forces. Coordinates military operations.",
            "category": AllianceMonumentCategory.MILITARY,
            "cash_cost": 850_000_000.0,
            "resource_costs": {ResourceType.IRON: 62000, ResourceType.GOLD: 57000, ResourceType.LIMESTONE: 52000},
            "upkeep": 13000.0,
            "effects": AllianceMonumentEffects(member_military_efficiency_bonus=0.08, member_soldier_efficiency_bonus=0.10, member_aircraft_efficiency_bonus=0.08)
        }
        
        templates[AllianceMonumentType.DEFENSE_GRID] = {
            "name": "Defense Grid",
            "description": "Integrated alliance defense network. Provides early warning and coordination.",
            "category": AllianceMonumentCategory.MILITARY,
            "cash_cost": 950_000_000.0,
            "resource_costs": {ResourceType.GOLD: 63000, ResourceType.IRON: 58000, ResourceType.LIMESTONE: 53000},
            "upkeep": 15000.0,
            "effects": AllianceMonumentEffects(member_spy_defense_bonus=0.15, member_infrastructure_war_damage_reduction=0.10, member_military_efficiency_bonus=0.07)
        }
        
        templates[AllianceMonumentType.TACTICAL_OPERATIONS_CENTER] = {
            "name": "Tactical Operations Center",
            "description": "Advanced tactical command facility. Improves battlefield coordination.",
            "category": AllianceMonumentCategory.MILITARY,
            "cash_cost": 700_000_000.0,
            "resource_costs": {ResourceType.IRON: 58000, ResourceType.GOLD: 53000, ResourceType.LIMESTONE: 48000},
            "upkeep": 11000.0,
            "effects": AllianceMonumentEffects(member_military_efficiency_bonus=0.10, member_tank_efficiency_bonus=0.10, member_aircraft_efficiency_bonus=0.10)
        }
        
        templates[AllianceMonumentType.WAR_COLLEGE] = {
            "name": "War College",
            "description": "Alliance military education and research institution. Advances military tactics.",
            "category": AllianceMonumentCategory.MILITARY,
            "cash_cost": 650_000_000.0,
            "resource_costs": {ResourceType.GOLD: 55000, ResourceType.IRON: 50000, ResourceType.LIMESTONE: 45000},
            "upkeep": 10000.0,
            "effects": AllianceMonumentEffects(member_military_efficiency_bonus=0.08, member_soldier_efficiency_bonus=0.12, member_tank_efficiency_bonus=0.08)
        }
        
        templates[AllianceMonumentType.MUNITIONS_DEPOT] = {
            "name": "Munitions Depot",
            "description": "Massive alliance ammunition storage and distribution facility.",
            "category": AllianceMonumentCategory.MILITARY,
            "cash_cost": 550_000_000.0,
            "resource_costs": {ResourceType.IRON: 52000, ResourceType.LIMESTONE: 47000, ResourceType.GOLD: 42000},
            "upkeep": 9000.0,
            "effects": AllianceMonumentEffects(member_military_efficiency_bonus=0.07, member_missile_efficiency_bonus=0.10, member_tank_efficiency_bonus=0.07)
        }
        
        templates[AllianceMonumentType.MILITARY_RESEARCH_INSTITUTE] = {
            "name": "Military Research Institute",
            "description": "Alliance military research and development facility. Advances military technology.",
            "category": AllianceMonumentCategory.MILITARY,
            "cash_cost": 800_000_000.0,
            "resource_costs": {ResourceType.GOLD: 60000, ResourceType.IRON: 55000, ResourceType.LIMESTONE: 50000},
            "upkeep": 12500.0,
            "effects": AllianceMonumentEffects(member_military_efficiency_bonus=0.10, member_technology_cost_reduction=0.10, member_missile_efficiency_bonus=0.08)
        }
        
        templates[AllianceMonumentType.VETERANS_HALL] = {
            "name": "Veterans Hall",
            "description": "Alliance veterans' memorial and support center. Boosts military morale.",
            "category": AllianceMonumentCategory.MILITARY,
            "cash_cost": 450_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 48000, ResourceType.IRON: 43000, ResourceType.GOLD: 38000},
            "upkeep": 7000.0,
            "effects": AllianceMonumentEffects(member_soldier_efficiency_bonus=0.08, member_military_efficiency_bonus=0.05, member_infrastructure_war_damage_reduction=0.05)
        }
        
        # DIPLOMATIC MONUMENTS (8)
        templates[AllianceMonumentType.EMBASSY_COMPLEX] = {
            "name": "Embassy Complex",
            "description": "Massive alliance diplomatic facility. Houses embassies from all allied nations.",
            "category": AllianceMonumentCategory.DIPLOMATIC,
            "cash_cost": 500_000_000.0,
            "resource_costs": {ResourceType.GOLD: 50000, ResourceType.LIMESTONE: 45000, ResourceType.GEMSTONES: 40000},
            "upkeep": 8000.0,
            "effects": AllianceMonumentEffects(alliance_diplomatic_power_bonus=0.15, alliance_treaty_cost_reduction=0.10, alliance_tax_efficiency_bonus=0.05)
        }
        
        templates[AllianceMonumentType.DIPLOMATIC_SUMMIT_HALL] = {
            "name": "Diplomatic Summit Hall",
            "description": "Grand venue for alliance diplomatic summits and negotiations.",
            "category": AllianceMonumentCategory.DIPLOMATIC,
            "cash_cost": 600_000_000.0,
            "resource_costs": {ResourceType.GOLD: 55000, ResourceType.LIMESTONE: 50000, ResourceType.GEMSTONES: 45000},
            "upkeep": 9500.0,
            "effects": AllianceMonumentEffects(alliance_diplomatic_power_bonus=0.20, alliance_treaty_cost_reduction=0.15, member_commerce_bonus=0.05)
        }
        
        templates[AllianceMonumentType.TREATY_REPOSITORY] = {
            "name": "Treaty Repository",
            "description": "Secure archive of alliance treaties and diplomatic agreements.",
            "category": AllianceMonumentCategory.DIPLOMATIC,
            "cash_cost": 400_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 46000, ResourceType.GOLD: 41000, ResourceType.IRON: 36000},
            "upkeep": 6500.0,
            "effects": AllianceMonumentEffects(alliance_treaty_cost_reduction=0.20, alliance_diplomatic_power_bonus=0.10)
        }
        
        templates[AllianceMonumentType.PEACE_PALACE] = {
            "name": "Peace Palace",
            "description": "Alliance center for peace negotiations and conflict resolution.",
            "category": AllianceMonumentCategory.DIPLOMATIC,
            "cash_cost": 550_000_000.0,
            "resource_costs": {ResourceType.GOLD: 52000, ResourceType.LIMESTONE: 47000, ResourceType.GEMSTONES: 42000},
            "upkeep": 8500.0,
            "effects": AllianceMonumentEffects(alliance_diplomatic_power_bonus=0.18, alliance_treaty_cost_reduction=0.12, member_infrastructure_war_damage_reduction=0.08)
        }
        
        templates[AllianceMonumentType.FOREIGN_RELATIONS_MINISTRY] = {
            "name": "Foreign Relations Ministry",
            "description": "Alliance foreign affairs ministry. Manages diplomatic relations.",
            "category": AllianceMonumentCategory.DIPLOMATIC,
            "cash_cost": 480_000_000.0,
            "resource_costs": {ResourceType.GOLD: 50000, ResourceType.LIMESTONE: 45000, ResourceType.IRON: 40000},
            "upkeep": 7500.0,
            "effects": AllianceMonumentEffects(alliance_diplomatic_power_bonus=0.12, alliance_treaty_cost_reduction=0.08, alliance_tax_efficiency_bonus=0.07)
        }
        
        templates[AllianceMonumentType.ALLIANCE_FORUM] = {
            "name": "Alliance Forum",
            "description": "Grand assembly hall for alliance member discussions and decisions.",
            "category": AllianceMonumentCategory.DIPLOMATIC,
            "cash_cost": 420_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 44000, ResourceType.IRON: 39000, ResourceType.GOLD: 34000},
            "upkeep": 6800.0,
            "effects": AllianceMonumentEffects(alliance_diplomatic_power_bonus=0.10, member_commerce_bonus=0.05, member_trade_bonus=0.05)
        }
        
        templates[AllianceMonumentType.DIPLOMATIC_ACADEMY] = {
            "name": "Diplomatic Academy",
            "description": "Alliance diplomatic training institution. Educates future diplomats.",
            "category": AllianceMonumentCategory.DIPLOMATIC,
            "cash_cost": 520_000_000.0,
            "resource_costs": {ResourceType.GOLD: 51000, ResourceType.LIMESTONE: 46000, ResourceType.IRON: 41000},
            "upkeep": 8200.0,
            "effects": AllianceMonumentEffects(alliance_diplomatic_power_bonus=0.14, alliance_treaty_cost_reduction=0.10, member_income_bonus=0.05)
        }
        
        templates[AllianceMonumentType.INTERNATIONAL_COURT] = {
            "name": "International Court",
            "description": "Alliance judicial body for resolving disputes and upholding treaties.",
            "category": AllianceMonumentCategory.DIPLOMATIC,
            "cash_cost": 580_000_000.0,
            "resource_costs": {ResourceType.GOLD: 54000, ResourceType.LIMESTONE: 49000, ResourceType.GEMSTONES: 44000},
            "upkeep": 9000.0,
            "effects": AllianceMonumentEffects(alliance_diplomatic_power_bonus=0.16, alliance_treaty_cost_reduction=0.18, alliance_tax_efficiency_bonus=0.06)
        }
        
        # INFRASTRUCTURE MONUMENTS (10)
        templates[AllianceMonumentType.GRAND_INFRASTRUCTURE_NETWORK] = {
            "name": "Grand Infrastructure Network",
            "description": "Alliance-wide infrastructure system connecting all member nations.",
            "category": AllianceMonumentCategory.INFRASTRUCTURE,
            "cash_cost": 700_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 65000, ResourceType.IRON: 60000, ResourceType.COPPER: 55000},
            "upkeep": 11000.0,
            "effects": AllianceMonumentEffects(member_infrastructure_war_damage_reduction=0.20, member_infrastructure_repair_bonus=0.25, member_land_war_damage_reduction=0.10)
        }
        
        templates[AllianceMonumentType.TRANSPORTATION_GRID] = {
            "name": "Transportation Grid",
            "description": "Alliance transportation network. Facilitates movement of goods and people.",
            "category": AllianceMonumentCategory.INFRASTRUCTURE,
            "cash_cost": 550_000_000.0,
            "resource_costs": {ResourceType.IRON: 55000, ResourceType.LIMESTONE: 50000, ResourceType.TIMBER: 45000},
            "upkeep": 8500.0,
            "effects": AllianceMonumentEffects(member_commerce_bonus=0.10, member_trade_bonus=0.10, member_infrastructure_repair_bonus=0.15)
        }
        
        templates[AllianceMonumentType.COMMUNICATIONS_NEXUS] = {
            "name": "Communications Nexus",
            "description": "Alliance communications hub. Connects all alliance members.",
            "category": AllianceMonumentCategory.INFRASTRUCTURE,
            "cash_cost": 500_000_000.0,
            "resource_costs": {ResourceType.COPPER: 55000, ResourceType.LEAD: 50000, ResourceType.GOLD: 45000},
            "upkeep": 8000.0,
            "effects": AllianceMonumentEffects(member_spy_defense_bonus=0.10, member_commerce_bonus=0.08, alliance_diplomatic_power_bonus=0.05)
        }
        
        templates[AllianceMonumentType.POWER_DISTRIBUTION_HUB] = {
            "name": "Power Distribution Hub",
            "description": "Alliance power distribution network. Ensures reliable power for members.",
            "category": AllianceMonumentCategory.INFRASTRUCTURE,
            "cash_cost": 600_000_000.0,
            "resource_costs": {ResourceType.IRON: 58000, ResourceType.COPPER: 53000, ResourceType.LIMESTONE: 48000},
            "upkeep": 9500.0,
            "effects": AllianceMonumentEffects(member_commerce_bonus=0.07, member_infrastructure_repair_bonus=0.20, member_resource_production_bonus=0.05)
        }
        
        templates[AllianceMonumentType.URBAN_DEVELOPMENT_CENTER] = {
            "name": "Urban Development Center",
            "description": "Alliance urban planning and development authority.",
            "category": AllianceMonumentCategory.INFRASTRUCTURE,
            "cash_cost": 480_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 52000, ResourceType.IRON: 47000, ResourceType.TIMBER: 42000},
            "upkeep": 7500.0,
            "effects": AllianceMonumentEffects(member_infrastructure_repair_bonus=0.15, member_commerce_bonus=0.08, member_income_bonus=0.05)
        }
        
        templates[AllianceMonumentType.LOGISTICS_NETWORK] = {
            "name": "Logistics Network",
            "description": "Alliance logistics and supply chain system.",
            "category": AllianceMonumentCategory.INFRASTRUCTURE,
            "cash_cost": 580_000_000.0,
            "resource_costs": {ResourceType.IRON: 56000, ResourceType.LIMESTONE: 51000, ResourceType.TIMBER: 46000},
            "upkeep": 9000.0,
            "effects": AllianceMonumentEffects(member_trade_bonus=0.12, member_commerce_bonus=0.10, member_infrastructure_repair_bonus=0.12)
        }
        
        templates[AllianceMonumentType.ENGINEERING_BUREAU] = {
            "name": "Engineering Bureau",
            "description": "Alliance engineering and construction authority.",
            "category": AllianceMonumentCategory.INFRASTRUCTURE,
            "cash_cost": 520_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 54000, ResourceType.IRON: 49000, ResourceType.COPPER: 44000},
            "upkeep": 8200.0,
            "effects": AllianceMonumentEffects(member_infrastructure_repair_bonus=0.20, member_infrastructure_war_damage_reduction=0.10, member_technology_cost_reduction=0.05)
        }
        
        templates[AllianceMonumentType.CONSTRUCTION_CONSORTIUM] = {
            "name": "Construction Consortium",
            "description": "Alliance construction cooperative. Pool resources for major projects.",
            "category": AllianceMonumentCategory.INFRASTRUCTURE,
            "cash_cost": 450_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 50000, ResourceType.IRON: 45000, ResourceType.TIMBER: 40000},
            "upkeep": 7000.0,
            "effects": AllianceMonumentEffects(member_infrastructure_repair_bonus=0.18, member_commerce_bonus=0.07, member_trade_bonus=0.07)
        }
        
        templates[AllianceMonumentType.MAINTENANCE_DEPOT] = {
            "name": "Maintenance Depot",
            "description": "Alliance infrastructure maintenance facility.",
            "category": AllianceMonumentCategory.INFRASTRUCTURE,
            "cash_cost": 400_000_000.0,
            "resource_costs": {ResourceType.IRON: 48000, ResourceType.LIMESTONE: 43000, ResourceType.COPPER: 38000},
            "upkeep": 6500.0,
            "effects": AllianceMonumentEffects(member_infrastructure_repair_bonus=0.15, member_infrastructure_war_damage_reduction=0.08, member_resource_production_bonus=0.05)
        }
        
        templates[AllianceMonumentType.INFRASTRUCTURE_AUTHORITY] = {
            "name": "Infrastructure Authority",
            "description": "Alliance infrastructure planning and regulatory body.",
            "category": AllianceMonumentCategory.INFRASTRUCTURE,
            "cash_cost": 620_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 58000, ResourceType.IRON: 53000, ResourceType.COPPER: 48000},
            "upkeep": 9800.0,
            "effects": AllianceMonumentEffects(member_infrastructure_repair_bonus=0.22, member_infrastructure_war_damage_reduction=0.12, member_commerce_bonus=0.08)
        }
        
        # CULTURAL MONUMENTS (6)
        templates[AllianceMonumentType.GRAND_CULTURAL_CENTER] = {
            "name": "Grand Cultural Center",
            "description": "Massive alliance cultural facility. Promotes arts and culture.",
            "category": AllianceMonumentCategory.CULTURAL,
            "cash_cost": 450_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 50000, ResourceType.GEMSTONES: 45000, ResourceType.GOLD: 40000},
            "upkeep": 7500.0,
            "effects": AllianceMonumentEffects(member_income_bonus=0.08, member_commerce_bonus=0.10, alliance_diplomatic_power_bonus=0.07)
        }
        
        templates[AllianceMonumentType.ALLIANCE_HALL_OF_FAME] = {
            "name": "Alliance Hall of Fame",
            "description": "Memorial honoring alliance achievements and notable members.",
            "category": AllianceMonumentCategory.CULTURAL,
            "cash_cost": 400_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 46000, ResourceType.GOLD: 41000, ResourceType.GEMSTONES: 36000},
            "upkeep": 6500.0,
            "effects": AllianceMonumentEffects(member_military_efficiency_bonus=0.05, member_soldier_efficiency_bonus=0.08, alliance_diplomatic_power_bonus=0.05)
        }
        
        templates[AllianceMonumentType.CULTURAL_EXCHANGE] = {
            "name": "Cultural Exchange",
            "description": "Alliance cultural exchange program. Promotes understanding between members.",
            "category": AllianceMonumentCategory.CULTURAL,
            "cash_cost": 380_000_000.0,
            "resource_costs": {ResourceType.GOLD: 44000, ResourceType.LIMESTONE: 39000, ResourceType.TIMBER: 34000},
            "upkeep": 6000.0,
            "effects": AllianceMonumentEffects(member_commerce_bonus=0.08, member_trade_bonus=0.07, alliance_diplomatic_power_bonus=0.08)
        }
        
        templates[AllianceMonumentType.HERITAGE_PRESERVATION] = {
            "name": "Heritage Preservation",
            "description": "Alliance heritage preservation society. Protects cultural assets.",
            "category": AllianceMonumentCategory.CULTURAL,
            "cash_cost": 420_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 48000, ResourceType.GOLD: 43000, ResourceType.GEMSTONES: 38000},
            "upkeep": 6800.0,
            "effects": AllianceMonumentEffects(member_income_bonus=0.06, member_commerce_bonus=0.07, member_infrastructure_repair_bonus=0.08)
        }
        
        templates[AllianceMonumentType.ARTS_FEDERATION] = {
            "name": "Arts Federation",
            "description": "Alliance arts organization. Supports artistic endeavors.",
            "category": AllianceMonumentCategory.CULTURAL,
            "cash_cost": 360_000_000.0,
            "resource_costs": {ResourceType.GOLD: 42000, ResourceType.LIMESTONE: 37000, ResourceType.GEMSTONES: 32000},
            "upkeep": 5800.0,
            "effects": AllianceMonumentEffects(member_commerce_bonus=0.10, member_income_bonus=0.05, alliance_diplomatic_power_bonus=0.06)
        }
        
        templates[AllianceMonumentType.MONUMENT_TO_UNITY] = {
            "name": "Monument to Unity",
            "description": "Grand monument symbolizing alliance unity and cooperation.",
            "category": AllianceMonumentCategory.CULTURAL,
            "cash_cost": 500_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 55000, ResourceType.GOLD: 50000, ResourceType.GEMSTONES: 45000},
            "upkeep": 8000.0,
            "effects": AllianceMonumentEffects(member_military_efficiency_bonus=0.07, member_commerce_bonus=0.08, alliance_diplomatic_power_bonus=0.10)
        }
        
        # SCIENTIFIC MONUMENTS (7)
        templates[AllianceMonumentType.RESEARCH_CONSORTIUM] = {
            "name": "Research Consortium",
            "description": "Alliance research cooperative. Advances scientific knowledge.",
            "category": AllianceMonumentCategory.SCIENTIFIC,
            "cash_cost": 800_000_000.0,
            "resource_costs": {ResourceType.GOLD: 60000, ResourceType.LEAD: 55000, ResourceType.LIMESTONE: 50000},
            "upkeep": 12500.0,
            "effects": AllianceMonumentEffects(member_technology_cost_reduction=0.20, member_resource_production_bonus=0.08, member_military_efficiency_bonus=0.07)
        }
        
        templates[AllianceMonumentType.TECHNOLOGY_INSTITUTE] = {
            "name": "Technology Institute",
            "description": "Alliance technology research and development facility.",
            "category": AllianceMonumentCategory.SCIENTIFIC,
            "cash_cost": 700_000_000.0,
            "resource_costs": {ResourceType.LEAD: 58000, ResourceType.GOLD: 53000, ResourceType.COPPER: 48000},
            "upkeep": 11000.0,
            "effects": AllianceMonumentEffects(member_technology_cost_reduction=0.15, member_military_efficiency_bonus=0.08, member_resource_production_bonus=0.06)
        }
        
        templates[AllianceMonumentType.INNOVATION_HUB] = {
            "name": "Innovation Hub",
            "description": "Alliance innovation center. Encourages technological advancement.",
            "category": AllianceMonumentCategory.SCIENTIFIC,
            "cash_cost": 600_000_000.0,
            "resource_costs": {ResourceType.GOLD: 55000, ResourceType.LEAD: 50000, ResourceType.COPPER: 45000},
            "upkeep": 9500.0,
            "effects": AllianceMonumentEffects(member_technology_cost_reduction=0.12, member_commerce_bonus=0.08, member_resource_production_bonus=0.07)
        }
        
        templates[AllianceMonumentType.SCIENCE_ACADEMY] = {
            "name": "Science Academy",
            "description": "Alliance scientific education institution.",
            "category": AllianceMonumentCategory.SCIENTIFIC,
            "cash_cost": 550_000_000.0,
            "resource_costs": {ResourceType.GOLD: 52000, ResourceType.LEAD: 47000, ResourceType.LIMESTONE: 42000},
            "upkeep": 8800.0,
            "effects": AllianceMonumentEffects(member_technology_cost_reduction=0.10, member_resource_production_bonus=0.10, member_income_bonus=0.05)
        }
        
        templates[AllianceMonumentType.LABORATORY_NETWORK] = {
            "name": "Laboratory Network",
            "description": "Alliance network of research laboratories.",
            "category": AllianceMonumentCategory.SCIENTIFIC,
            "cash_cost": 650_000_000.0,
            "resource_costs": {ResourceType.GOLD: 57000, ResourceType.LEAD: 52000, ResourceType.COPPER: 47000},
            "upkeep": 10200.0,
            "effects": AllianceMonumentEffects(member_technology_cost_reduction=0.14, member_resource_production_bonus=0.08, member_military_efficiency_bonus=0.06)
        }
        
        templates[AllianceMonumentType.DISCOVERY_CENTER] = {
            "name": "Discovery Center",
            "description": "Alliance discovery and exploration facility.",
            "category": AllianceMonumentCategory.SCIENTIFIC,
            "cash_cost": 580_000_000.0,
            "resource_costs": {ResourceType.GOLD: 54000, ResourceType.LEAD: 49000, ResourceType.COPPER: 44000},
            "upkeep": 9200.0,
            "effects": AllianceMonumentEffects(member_technology_cost_reduction=0.11, member_resource_production_bonus=0.09, member_trade_bonus=0.05)
        }
        
        templates[AllianceMonumentType.KNOWLEDGE_REPOSITORY] = {
            "name": "Knowledge Repository",
            "description": "Alliance archive of scientific knowledge and research.",
            "category": AllianceMonumentCategory.SCIENTIFIC,
            "cash_cost": 480_000_000.0,
            "resource_costs": {ResourceType.GOLD: 50000, ResourceType.LEAD: 45000, ResourceType.LIMESTONE: 40000},
            "upkeep": 7800.0,
            "effects": AllianceMonumentEffects(member_technology_cost_reduction=0.08, member_resource_production_bonus=0.07, member_income_bonus=0.06)
        }
        
        # DEFENSIVE MONUMENTS (8)
        templates[AllianceMonumentType.FORTIFIED_ALLIANCE] = {
            "name": "Fortified Alliance",
            "description": "Alliance-wide defensive fortifications. Massive protection network.",
            "category": AllianceMonumentCategory.DEFENSIVE,
            "cash_cost": 800_000_000.0,
            "resource_costs": {ResourceType.LIMESTONE: 70000, ResourceType.IRON: 65000, ResourceType.GOLD: 60000},
            "upkeep": 13000.0,
            "effects": AllianceMonumentEffects(member_spy_defense_bonus=0.20, member_infrastructure_war_damage_reduction=0.15, member_land_war_damage_reduction=0.15)
        }
        
        templates[AllianceMonumentType.IRON_CURTAIN_BASTION] = {
            "name": "Iron Curtain Bastion",
            "description": "Massive defensive barrier protecting alliance territory.",
            "category": AllianceMonumentCategory.DEFENSIVE,
            "cash_cost": 1_000_000_000.0,
            "resource_costs": {ResourceType.IRON: 75000, ResourceType.LIMESTONE: 70000, ResourceType.GOLD: 65000},
            "upkeep": 16000.0,
            "effects": AllianceMonumentEffects(member_military_efficiency_bonus=0.10, member_spy_defense_bonus=0.15, member_infrastructure_war_damage_reduction=0.12)
        }
        
        templates[AllianceMonumentType.SHIELD_GENERATOR] = {
            "name": "Shield Generator",
            "description": "Advanced defensive shield system for alliance members.",
            "category": AllianceMonumentCategory.DEFENSIVE,
            "cash_cost": 900_000_000.0,
            "resource_costs": {ResourceType.GOLD: 68000, ResourceType.LEAD: 63000, ResourceType.IRON: 58000},
            "upkeep": 14500.0,
            "effects": AllianceMonumentEffects(member_infrastructure_war_damage_reduction=0.18, member_land_war_damage_reduction=0.12, member_spy_defense_bonus=0.12)
        }
        
        templates[AllianceMonumentType.EARLY_WARNING_SYSTEM] = {
            "name": "Early Warning System",
            "description": "Alliance early warning network for threats.",
            "category": AllianceMonumentCategory.DEFENSIVE,
            "cash_cost": 700_000_000.0,
            "resource_costs": {ResourceType.GOLD: 62000, ResourceType.COPPER: 57000, ResourceType.IRON: 52000},
            "upkeep": 11500.0,
            "effects": AllianceMonumentEffects(member_spy_defense_bonus=0.18, member_infrastructure_war_damage_reduction=0.10, member_military_efficiency_bonus=0.07)
        }
        
        templates[AllianceMonumentType.COUNTER_INTELLIGENCE_HQ] = {
            "name": "Counter-Intelligence HQ",
            "description": "Alliance counter-intelligence operations center.",
            "category": AllianceMonumentCategory.DEFENSIVE,
            "cash_cost": 750_000_000.0,
            "resource_costs": {ResourceType.GOLD: 64000, ResourceType.LEAD: 59000, ResourceType.IRON: 54000},
            "upkeep": 12000.0,
            "effects": AllianceMonumentEffects(member_spy_defense_bonus=0.25, member_military_efficiency_bonus=0.08, alliance_diplomatic_power_bonus=0.07)
        }
        
        templates[AllianceMonumentType.SECURITY_BUREAU] = {
            "name": "Security Bureau",
            "description": "Alliance security and intelligence agency.",
            "category": AllianceMonumentCategory.DEFENSIVE,
            "cash_cost": 650_000_000.0,
            "resource_costs": {ResourceType.GOLD: 60000, ResourceType.LEAD: 55000, ResourceType.IRON: 50000},
            "upkeep": 10500.0,
            "effects": AllianceMonumentEffects(member_spy_defense_bonus=0.15, member_infrastructure_war_damage_reduction=0.08, alliance_tax_efficiency_bonus=0.05)
        }
        
        templates[AllianceMonumentType.PROTECTION_AGENCY] = {
            "name": "Protection Agency",
            "description": "Alliance member protection and security service.",
            "category": AllianceMonumentCategory.DEFENSIVE,
            "cash_cost": 580_000_000.0,
            "resource_costs": {ResourceType.GOLD: 57000, ResourceType.LEAD: 52000, ResourceType.IRON: 47000},
            "upkeep": 9500.0,
            "effects": AllianceMonumentEffects(member_spy_defense_bonus=0.12, member_infrastructure_war_damage_reduction=0.10, member_land_war_damage_reduction=0.08)
        }
        
        templates[AllianceMonumentType.DEFENSE_AUTHORITY] = {
            "name": "Defense Authority",
            "description": "Alliance defense planning and coordination body.",
            "category": AllianceMonumentCategory.DEFENSIVE,
            "cash_cost": 680_000_000.0,
            "resource_costs": {ResourceType.GOLD: 62000, ResourceType.IRON: 57000, ResourceType.LIMESTONE: 52000},
            "upkeep": 11000.0,
            "effects": AllianceMonumentEffects(member_military_efficiency_bonus=0.09, member_spy_defense_bonus=0.14, member_infrastructure_war_damage_reduction=0.12)
        }
        
        # TRADE MONUMENTS (8)
        templates[AllianceMonumentType.TRADE_ROUTE_NETWORK] = {
            "name": "Trade Route Network",
            "description": "Alliance network of established trade routes.",
            "category": AllianceMonumentCategory.TRADE,
            "cash_cost": 600_000_000.0,
            "resource_costs": {ResourceType.TIMBER: 55000, ResourceType.IRON: 50000, ResourceType.GOLD: 45000},
            "upkeep": 9500.0,
            "effects": AllianceMonumentEffects(member_trade_bonus=0.18, member_commerce_bonus=0.12, alliance_trade_bonus=0.15)
        }
        
        templates[AllianceMonumentType.COMMERCIAL_FEDERATION] = {
            "name": "Commercial Federation",
            "description": "Alliance federation of commercial enterprises.",
            "category": AllianceMonumentCategory.TRADE,
            "cash_cost": 700_000_000.0,
            "resource_costs": {ResourceType.GOLD: 58000, ResourceType.IRON: 53000, ResourceType.TIMBER: 48000},
            "upkeep": 11000.0,
            "effects": AllianceMonumentEffects(member_commerce_bonus=0.15, member_trade_bonus=0.12, alliance_trade_bonus=0.20)
        }
        
        templates[AllianceMonumentType.MARKET_REGULATORY_BODY] = {
            "name": "Market Regulatory Body",
            "description": "Alliance market regulation and oversight organization.",
            "category": AllianceMonumentCategory.TRADE,
            "cash_cost": 500_000_000.0,
            "resource_costs": {ResourceType.GOLD: 52000, ResourceType.IRON: 47000, ResourceType.LIMESTONE: 42000},
            "upkeep": 8000.0,
            "effects": AllianceMonumentEffects(member_trade_bonus=0.10, member_commerce_bonus=0.08, alliance_tax_efficiency_bonus=0.08)
        }
        
        templates[AllianceMonumentType.SHIPPING_CONSORTIUM] = {
            "name": "Shipping Consortium",
            "description": "Alliance shipping and logistics cooperative.",
            "category": AllianceMonumentCategory.TRADE,
            "cash_cost": 550_000_000.0,
            "resource_costs": {ResourceType.TIMBER: 53000, ResourceType.IRON: 48000, ResourceType.OIL: 43000},
            "upkeep": 8800.0,
            "effects": AllianceMonumentEffects(member_trade_bonus=0.14, member_commerce_bonus=0.10, alliance_trade_bonus=0.12)
        }
        
        templates[AllianceMonumentType.CUSTOMS_UNION] = {
            "name": "Customs Union",
            "description": "Alliance customs union. Standardizes trade regulations.",
            "category": AllianceMonumentCategory.TRADE,
            "cash_cost": 480_000_000.0,
            "resource_costs": {ResourceType.GOLD: 50000, ResourceType.IRON: 45000, ResourceType.LIMESTONE: 40000},
            "upkeep": 7800.0,
            "effects": AllianceMonumentEffects(member_trade_bonus=0.12, member_commerce_bonus=0.08, alliance_treaty_cost_reduction=0.08)
        }
        
        templates[AllianceMonumentType.FREE_TRADE_ZONE] = {
            "name": "Free Trade Zone",
            "description": "Alliance-designated free trade area. Boosts commercial activity.",
            "category": AllianceMonumentCategory.TRADE,
            "cash_cost": 520_000_000.0,
            "resource_costs": {ResourceType.GOLD: 51000, ResourceType.IRON: 46000, ResourceType.TIMBER: 41000},
            "upkeep": 8500.0,
            "effects": AllianceMonumentEffects(member_trade_bonus=0.15, member_commerce_bonus=0.12, alliance_trade_bonus=0.10)
        }
        
        templates[AllianceMonumentType.MERCHANT_NAVY] = {
            "name": "Merchant Navy",
            "description": "Alliance merchant fleet. Facilitates maritime trade.",
            "category": AllianceMonumentCategory.TRADE,
            "cash_cost": 600_000_000.0,
            "resource_costs": {ResourceType.IRON: 55000, ResourceType.TIMBER: 50000, ResourceType.OIL: 45000},
            "upkeep": 9500.0,
            "effects": AllianceMonumentEffects(member_trade_bonus=0.16, member_commerce_bonus=0.10, alliance_trade_bonus=0.14)
        }
        
        templates[AllianceMonumentType.TRADE_EMBASSY] = {
            "name": "Trade Embassy",
            "description": "Alliance trade diplomatic mission. Promotes trade relations.",
            "category": AllianceMonumentCategory.TRADE,
            "cash_cost": 450_000_000.0,
            "resource_costs": {ResourceType.GOLD: 49000, ResourceType.IRON: 44000, ResourceType.LIMESTONE: 39000},
            "upkeep": 7200.0,
            "effects": AllianceMonumentEffects(member_trade_bonus=0.11, member_commerce_bonus=0.09, alliance_diplomatic_power_bonus=0.08)
        }
        
        return templates
    
    def get_monument_template(self, monument_type: AllianceMonumentType) -> Optional[Dict[str, Any]]:
        """Get template for a monument type."""
        return self.monument_templates.get(monument_type)
    
    def create_monument(self, alliance_id: str, monument_type: AllianceMonumentType) -> Optional[AllianceMonument]:
        """Create a new alliance monument from template."""
        template = self.get_monument_template(monument_type)
        if not template:
            return None
        
        monument = AllianceMonument(
            alliance_id=alliance_id,
            monument_type=monument_type,
            name=template["name"],
            description=template["description"],
            category=template["category"],
            total_cash_cost=template["cash_cost"],
            resource_costs=template["resource_costs"],
            upkeep_per_tick=template["upkeep"],
            effects=template["effects"]
        )
        
        self.monuments[monument.monument_id] = monument
        return monument
    
    def get_alliance_monuments(self, alliance_id: str) -> List[AllianceMonument]:
        """Get all monuments for an alliance."""
        return [m for m in self.monuments.values() if m.alliance_id == alliance_id]
    
    def get_completed_monuments(self, alliance_id: str) -> List[AllianceMonument]:
        """Get completed monuments for an alliance."""
        return [m for m in self.monuments.values() 
                if m.alliance_id == alliance_id and m.status == AllianceMonumentStatus.COMPLETED]
    
    def get_monument_effects(self, alliance_id: str) -> AllianceMonumentEffects:
        """Get combined effects of all completed monuments for an alliance."""
        completed = self.get_completed_monuments(alliance_id)
        
        combined_effects = AllianceMonumentEffects()
        
        for monument in completed:
            if monument.is_active:
                effects = monument.effects
                combined_effects.member_income_bonus += effects.member_income_bonus
                combined_effects.member_tax_bonus += effects.member_tax_bonus
                combined_effects.member_commerce_bonus += effects.member_commerce_bonus
                combined_effects.member_trade_bonus += effects.member_trade_bonus
                combined_effects.alliance_trade_bonus += effects.alliance_trade_bonus
                combined_effects.member_military_efficiency_bonus += effects.member_military_efficiency_bonus
                combined_effects.member_soldier_efficiency_bonus += effects.member_soldier_efficiency_bonus
                combined_effects.member_tank_efficiency_bonus += effects.member_tank_efficiency_bonus
                combined_effects.member_aircraft_efficiency_bonus += effects.member_aircraft_efficiency_bonus
                combined_effects.member_ship_efficiency_bonus += effects.member_ship_efficiency_bonus
                combined_effects.member_missile_efficiency_bonus += effects.member_missile_efficiency_bonus
                combined_effects.member_resource_production_bonus += effects.member_resource_production_bonus
                combined_effects.member_spy_defense_bonus += effects.member_spy_defense_bonus
                combined_effects.member_infrastructure_war_damage_reduction += effects.member_infrastructure_war_damage_reduction
                combined_effects.member_land_war_damage_reduction += effects.member_land_war_damage_reduction
                combined_effects.alliance_treaty_cost_reduction += effects.alliance_treaty_cost_reduction
                combined_effects.alliance_diplomatic_power_bonus += effects.alliance_diplomatic_power_bonus
                combined_effects.alliance_bank_interest_bonus += effects.alliance_bank_interest_bonus
                combined_effects.alliance_tax_efficiency_bonus += effects.alliance_tax_efficiency_bonus
                combined_effects.member_infrastructure_repair_bonus += effects.member_infrastructure_repair_bonus
                combined_effects.member_technology_cost_reduction += effects.member_technology_cost_reduction
                
                if effects.enables_alliance_wars:
                    combined_effects.enables_alliance_wars = True
        
        return combined_effects

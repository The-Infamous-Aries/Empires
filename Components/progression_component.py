"""
Progression Component (Merged)

Handles progression tiers, bonuses, and combined bonuses.
Integrates with the new async BaseComponent and GPP infrastructure.
Uses empire_db for all persistence operations.
"""

from typing import List, Dict, Any, Optional
import logging

from .base_component import BaseComponent
from ..Database.empire_db import EmpireDB
from ..Logic.progression import ProgressionTier, Tier, TierRequirements, TierBonuses, ProgressionSystem
from ..Logic.bonuses import BonusSystem

logger = logging.getLogger(__name__)


class ProgressionComponent(BaseComponent):
    """
    Merged component for Progression, Bonuses, and Combined Bonuses operations.
    
    Combines progression tiers, bonuses, and combined bonuses into a single component.
    Uses empire_db for all data persistence.
    """
    
    def __init__(self, name: str = "progression", gpp_manager=None, db_manager: Optional[EmpireDB] = None):
        """Initialize the ProgressionComponent."""
        super().__init__(name, gpp_manager)
        self.db_manager = db_manager
        self.progression_system: Optional[ProgressionSystem] = None
        self.bonus_system: Optional[BonusSystem] = None
    
    async def _initialize(self) -> None:
        """Initialize the progression systems."""
        if not self.db_manager:
            logger.warning("ProgressionComponent: No database manager provided")
        self.progression_system = ProgressionSystem()
        self.bonus_system = BonusSystem()
        logger.info("ProgressionComponent initialized")
    
    async def get_all(self) -> List[Tier]:
        """Get all progression tiers from ProgressionSystem."""
        if self.progression_system:
            return self.progression_system.get_all_tiers()
        return []
    
    async def get_by_name(self, name: str) -> Optional[Tier]:
        """Get a tier by name."""
        for tier in await self.get_all():
            if tier.name == name:
                return tier
        return None
    
    async def get_names(self) -> List[str]:
        """Get all tier names."""
        return [tier.name for tier in await self.get_all()]
    
    # ProgressionSystem Delegation Methods
    
    async def get_nation_tier(self, ns: float, infrastructure: int, cities: int,
                              technology: int, population: int, wonders: int) -> ProgressionTier:
        """Get the current tier for a nation based on its stats."""
        if self.progression_system:
            return self.progression_system.get_nation_tier(ns, infrastructure, cities, technology, population, wonders)
        return ProgressionTier.MICRO
    
    async def get_tier(self, tier: ProgressionTier) -> Tier:
        """Get tier data for a specific tier."""
        if self.progression_system:
            return self.progression_system.get_tier(tier)
        return self.progression_system.get_tier(ProgressionTier.MICRO) if self.progression_system else Tier(
            tier=ProgressionTier.MICRO, name="Micro", description="Default"
        )
    
    async def get_all_tiers(self) -> List[Tier]:
        """Get all tiers in order."""
        if self.progression_system:
            return self.progression_system.get_all_tiers()
        return []
    
    async def get_tier_bonuses(self, tier: ProgressionTier) -> TierBonuses:
        """Get bonuses for a specific tier."""
        if self.progression_system:
            return self.progression_system.get_tier_bonuses(tier)
        return TierBonuses()
    
    async def can_progress_to_tier(self, current_tier: ProgressionTier, target_tier: ProgressionTier,
                                    ns: float, infrastructure: int, cities: int,
                                    technology: int, population: int, wonders: int) -> tuple[bool, str]:
        """Check if nation can progress to a target tier."""
        if self.progression_system:
            return self.progression_system.can_progress_to_tier(
                current_tier, target_tier, ns, infrastructure, cities,
                technology, population, wonders
            )
        return False, "System not initialized"
    
    async def get_tier_progress(self, current_tier: ProgressionTier, ns: float, infrastructure: int,
                                cities: int, technology: int, population: int, wonders: int) -> Dict[str, float]:
        """Get progress percentage toward next tier."""
        if self.progression_system:
            return self.progression_system.get_tier_progress(
                current_tier, ns, infrastructure, cities, technology, population, wonders
            )
        return {"progress": 0.0, "ns_progress": 0.0, "infra_progress": 0.0, "at_max": False}
    
    async def is_protected(self, nation_ns: float, attacker_ns: float) -> bool:
        """Check if nation is protected by new player protection rules."""
        if self.progression_system:
            return self.progression_system.is_protected(nation_ns, attacker_ns)
        return False
    
    async def get_full_data(self) -> List[Dict[str, Any]]:
        """Get full progression data for API responses."""
        data = []
        for tier in await self.get_all():
            tier_data = {
                "tier": tier.tier.value,
                "name": tier.name,
                "description": tier.description,
                "tier_color": tier.tier_color,
                "requirements": {
                    "min_ns": tier.requirements.min_ns,
                    "max_ns": tier.requirements.max_ns,
                    "min_infrastructure": tier.requirements.min_infrastructure,
                    "max_infrastructure": tier.requirements.max_infrastructure,
                    "min_cities": tier.requirements.min_cities,
                    "max_cities": tier.requirements.max_cities,
                    "min_technology": tier.requirements.min_technology,
                    "min_population": tier.requirements.min_population,
                    "min_wonders": tier.requirements.min_wonders
                },
                "bonuses": {
                    "tax_income_bonus": tier.bonuses.tax_income_bonus,
                    "commerce_income_bonus": tier.bonuses.commerce_income_bonus,
                    "trade_income_bonus": tier.bonuses.trade_income_bonus,
                    "tech_income_bonus": tier.bonuses.tech_income_bonus,
                    "infrastructure_cost_bonus": tier.bonuses.infrastructure_cost_bonus,
                    "improvement_cost_bonus": tier.bonuses.improvement_cost_bonus,
                    "wonder_cost_bonus": tier.bonuses.wonder_cost_bonus,
                    "technology_cost_bonus": tier.bonuses.technology_cost_bonus,
                    "military_cost_bonus": tier.bonuses.military_cost_bonus,
                    "military_unit_cap_bonus": tier.bonuses.military_unit_cap_bonus,
                    "soldier_efficiency_bonus": tier.bonuses.soldier_efficiency_bonus,
                    "tank_efficiency_bonus": tier.bonuses.tank_efficiency_bonus,
                    "aircraft_efficiency_bonus": tier.bonuses.aircraft_efficiency_bonus,
                    "ship_efficiency_bonus": tier.bonuses.ship_efficiency_bonus,
                    "population_growth_bonus": tier.bonuses.population_growth_bonus,
                    "happiness_bonus": tier.bonuses.happiness_bonus,
                    "resource_production_bonus": tier.bonuses.resource_production_bonus,
                    "spy_success_bonus": tier.bonuses.spy_success_bonus,
                    "spy_defense_bonus": tier.bonuses.spy_defense_bonus,
                    "war_score_bonus": tier.bonuses.war_score_bonus,
                    "can_form_alliance": tier.bonuses.can_form_alliance,
                    "max_alliance_members": tier.bonuses.max_alliance_members,
                    "can_declare_world_war": tier.bonuses.can_declare_world_war,
                    "can_use_wmds": tier.bonuses.can_use_wmds,
                    "can_build_super_wonders": tier.bonuses.can_build_super_wonders,
                    "new_player_protection": tier.bonuses.new_player_protection,
                    "protected_from_ns_threshold": tier.bonuses.protected_from_ns_threshold
                },
                "unlocked_improvements": tier.unlocked_improvements,
                "unlocked_wonders": tier.unlocked_wonders,
                "unlocked_projects": tier.unlocked_projects
            }
            data.append(tier_data)
        return data
    
    async def get_basic_data(self) -> List[Dict[str, Any]]:
        """Get basic progression data for dropdowns."""
        return [
            {
                "tier": tier.tier.value,
                "name": tier.name,
                "description": tier.description,
                "tier_color": tier.tier_color
            }
            for tier in await self.get_all()
        ]
    
    # Bonus methods (delegated to BonusSystem)
    async def calculate_combined_bonuses(self, nation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate combined bonuses for a nation."""
        if self.combined_bonus_system:
            return self.combined_bonus_system.calculate_all_bonuses(nation_data)
        return {}
    
    # Nation-specific progression methods using empire_db
    async def get_nation_tier_from_db(self, nation_id: str) -> Optional[ProgressionTier]:
        """Get a nation's current tier from database."""
        if not self.db_manager:
            return None
        
        nation = await self.db_manager.get_nation(nation_id)
        if not nation:
            return None
        
        tier_str = nation.get('current_tier', 'MICRO')
        try:
            return ProgressionTier[tier_str]
        except (KeyError, AttributeError):
            return ProgressionTier.MICRO
    
    async def get_nation_tier_progress(self, nation_id: str) -> float:
        """Get a nation's tier progress from database."""
        if not self.db_manager:
            return 0.0
        
        nation = await self.db_manager.get_nation(nation_id)
        if not nation:
            return 0.0
        
        return nation.get('tier_progress', 0.0)
    
    async def update_nation_tier(self, nation_id: str, new_tier: ProgressionTier) -> bool:
        """
        Update a nation's tier in the database.
        
        Args:
            nation_id: Nation ID to update
            new_tier: New progression tier
            
        Returns:
            True if successful, False otherwise
        """
        if not self.db_manager:
            return False
        
        # Check if nation exists
        nation = await self.db_manager.get_nation(nation_id)
        if not nation:
            return False
        
        # Update tier in database
        result = await self.db_manager.update_nation(nation_id, {
            'current_tier': new_tier.name,
            'tier_progress': 0.0  # Reset progress on tier change
        })
        
        if result:
            await self.publish_event('tier_changed', {
                'nation_id': nation_id,
                'new_tier': new_tier.name
            })
        
        return result > 0
    
    async def update_nation_tier_progress(self, nation_id: str, progress: float) -> bool:
        """
        Update a nation's tier progress in the database.
        
        Args:
            nation_id: Nation ID to update
            progress: Progress value (0.0 to 100.0)
            
        Returns:
            True if successful, False otherwise
        """
        if not self.db_manager:
            return False
        
        # Check if nation exists
        nation = await self.db_manager.get_nation(nation_id)
        if not nation:
            return False
        
        # Update tier progress in database
        result = await self.db_manager.update_nation(nation_id, {
            'tier_progress': progress
        })
        
        return result > 0
    
    async def calculate_and_update_nation_tier(self, nation_id: str) -> bool:
        """
        Calculate a nation's tier based on its stats and update in database.
        
        Args:
            nation_id: Nation ID to calculate and update
            
        Returns:
            True if tier changed, False otherwise
        """
        if not self.db_manager or not self.progression_system:
            return False
        
        # Get nation data
        nation = await self.db_manager.get_nation(nation_id)
        if not nation:
            return False
        
        # Calculate current tier based on stats
        current_tier = self.progression_system.get_nation_tier(
            ns=nation.get('total_infrastructure', 0) * nation.get('total_land', 0) / 1000,  # Simplified NS calculation
            infrastructure=nation.get('total_infrastructure', 0),
            cities=len(nation.get('city_ids', '[]')),
            technology=nation.get('technology', 0),
            population=nation.get('total_population', 0),
            wonders=0  # Would need to query wonders table
        )
        
        # Calculate progress toward next tier
        progress_data = self.progression_system.get_tier_progress(
            current_tier=current_tier,
            ns=nation.get('total_infrastructure', 0) * nation.get('total_land', 0) / 1000,
            infrastructure=nation.get('total_infrastructure', 0),
            cities=len(nation.get('city_ids', '[]')),
            technology=nation.get('technology', 0),
            population=nation.get('total_population', 0),
            wonders=0
        )
        
        # Check if tier changed
        old_tier = nation.get('current_tier', 'MICRO')
        if old_tier != current_tier.name:
            await self.update_nation_tier(nation_id, current_tier)
            return True
        
        # Update progress
        await self.update_nation_tier_progress(nation_id, progress_data.get('progress', 0.0))
        
        return False
    
    # Nation bonus methods using empire_db
    async def get_nation_bonuses(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all bonuses for a nation from database."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_nation_bonuses(nation_id)
    
    async def get_active_nation_bonuses(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all active (non-expired) bonuses for a nation."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_active_nation_bonuses(nation_id)
    
    async def create_nation_bonus(self, nation_id: str, bonus_type: str,
                                 expires_at: Optional[str] = None) -> Dict[str, Any]:
        """Create a nation bonus record."""
        if not self.db_manager:
            raise RuntimeError("Database manager not initialized")
        
        import uuid
        bonus_id = str(uuid.uuid4())
        
        await self.db_manager.create_nation_bonus(
            bonus_id=bonus_id,
            nation_id=nation_id,
            bonus_type=bonus_type,
            expires_at=expires_at
        )
        
        await self.publish_event('bonus_activated', {
            'nation_id': nation_id,
            'bonus_type': bonus_type
        })
        
        return await self.db_manager.get_nation_bonus(bonus_id)


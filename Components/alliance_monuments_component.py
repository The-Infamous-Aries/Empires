"""
Alliance Monuments Component for Empire Game System

Provides alliance monument logic and calculations.
Async version integrated with BaseComponent and GPP infrastructure.
"""

from typing import List, Dict, Any, Optional
from .base_component import BaseComponent
from ..Logic.alliance_monuments import (
    AllianceMonument,
    AllianceMonumentType,
    AllianceMonumentCategory,
    AllianceMonumentStatus,
    AllianceMonumentEffects,
    AllianceMonumentSystem
)


class AllianceMonumentsComponent(BaseComponent):
    """Component for managing alliance monument logic."""

    def __init__(self, name: str = "alliance_monuments", gpp_manager=None):
        """Initialize the alliance monuments component."""
        super().__init__(name, gpp_manager)
        self.system: Optional[AllianceMonumentSystem] = None

    async def _initialize(self) -> None:
        """Initialize the alliance monument system."""
        self.system = AllianceMonumentSystem()
        self._data = self.system.monument_templates

    async def _start(self) -> None:
        pass

    async def get_all(self) -> List[Dict[str, Any]]:
        """Get all alliance monument templates."""
        return list(self.system.monument_templates.values())

    async def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Get an alliance monument template by name."""
        for template in await self.get_all():
            if template["name"] == name:
                return template
        return None

    async def get_names(self) -> List[str]:
        """Get all alliance monument names."""
        return [template["name"] for template in await self.get_all()]

    async def get_by_type(self, monument_type: AllianceMonumentType) -> Optional[Dict[str, Any]]:
        """Get an alliance monument template by type enum."""
        if self.system:
            return self.system.get_monument_template(monument_type)
        return None

    async def create_monument(self, alliance_id: str, monument_type: AllianceMonumentType) -> Optional[AllianceMonument]:
        """Create a new alliance monument from template."""
        if self.system:
            return self.system.create_monument(alliance_id, monument_type)
        return None

    async def get_alliance_monuments(self, alliance_id: str) -> List[AllianceMonument]:
        """Get all monuments for an alliance."""
        if self.system:
            return self.system.get_alliance_monuments(alliance_id)
        return []

    async def get_completed_monuments(self, alliance_id: str) -> List[AllianceMonument]:
        """Get completed monuments for an alliance."""
        if self.system:
            return self.system.get_completed_monuments(alliance_id)
        return []

    async def get_monument_effects(self, alliance_id: str) -> Optional[AllianceMonumentEffects]:
        """Get combined effects of all completed monuments for an alliance."""
        if self.system:
            return self.system.get_monument_effects(alliance_id)
        return None

    async def get_full_data(self) -> List[Dict[str, Any]]:
        """Get full alliance monument data for API responses."""
        data = []
        for template in await self.get_all():
            effects = template["effects"]
            bonus_parts = []
            if effects.member_income_bonus != 0:
                bonus_parts.append(f"+{effects.member_income_bonus * 100}% member income")
            if effects.member_tax_bonus != 0:
                bonus_parts.append(f"+{effects.member_tax_bonus * 100}% member tax")
            if effects.member_commerce_bonus != 0:
                bonus_parts.append(f"+{effects.member_commerce_bonus * 100}% member commerce")
            if effects.member_trade_bonus != 0:
                bonus_parts.append(f"+{effects.member_trade_bonus * 100}% member trade")
            if effects.alliance_trade_bonus != 0:
                bonus_parts.append(f"+{effects.alliance_trade_bonus * 100}% alliance trade")
            if effects.alliance_bank_interest_bonus != 0:
                bonus_parts.append(f"+{effects.alliance_bank_interest_bonus * 100}% alliance bank interest")
            if effects.alliance_tax_efficiency_bonus != 0:
                bonus_parts.append(f"+{effects.alliance_tax_efficiency_bonus * 100}% alliance tax efficiency")
            if effects.member_military_efficiency_bonus != 0:
                bonus_parts.append(f"+{effects.member_military_efficiency_bonus * 100}% member military efficiency")
            if effects.member_soldier_efficiency_bonus != 0:
                bonus_parts.append(f"+{effects.member_soldier_efficiency_bonus * 100}% member soldier efficiency")
            if effects.member_tank_efficiency_bonus != 0:
                bonus_parts.append(f"+{effects.member_tank_efficiency_bonus * 100}% member tank efficiency")
            if effects.member_aircraft_efficiency_bonus != 0:
                bonus_parts.append(f"+{effects.member_aircraft_efficiency_bonus * 100}% member aircraft efficiency")
            if effects.member_ship_efficiency_bonus != 0:
                bonus_parts.append(f"+{effects.member_ship_efficiency_bonus * 100}% member ship efficiency")
            if effects.member_missile_efficiency_bonus != 0:
                bonus_parts.append(f"+{effects.member_missile_efficiency_bonus * 100}% member missile efficiency")
            if effects.member_resource_production_bonus != 0:
                bonus_parts.append(f"+{effects.member_resource_production_bonus * 100}% member resource production")
            if effects.member_spy_defense_bonus != 0:
                bonus_parts.append(f"+{effects.member_spy_defense_bonus * 100}% member spy defense")
            if effects.member_infrastructure_war_damage_reduction != 0:
                bonus_parts.append(f"-{effects.member_infrastructure_war_damage_reduction * 100}% infrastructure war damage")
            if effects.member_land_war_damage_reduction != 0:
                bonus_parts.append(f"-{effects.member_land_war_damage_reduction * 100}% land war damage")
            if effects.alliance_treaty_cost_reduction != 0:
                bonus_parts.append(f"-{effects.alliance_treaty_cost_reduction * 100}% treaty cost")
            if effects.alliance_diplomatic_power_bonus != 0:
                bonus_parts.append(f"+{effects.alliance_diplomatic_power_bonus * 100}% diplomatic power")
            if effects.enables_alliance_wars:
                bonus_parts.append("Enables alliance wars")
            if effects.member_infrastructure_repair_bonus != 0:
                bonus_parts.append(f"+{effects.member_infrastructure_repair_bonus * 100}% infrastructure repair")
            if effects.member_technology_cost_reduction != 0:
                bonus_parts.append(f"-{effects.member_technology_cost_reduction * 100}% technology cost")

            bonus_str = ", ".join(bonus_parts) if bonus_parts else "No bonus"
            resource_costs_str = ", ".join([f"{k.value}: {v}" for k, v in template["resource_costs"].items()])

            data.append({
                "name": template["name"],
                "category": template["category"].value,
                "description": template["description"],
                "bonus": bonus_str,
                "cash_cost": template["cash_cost"],
                "upkeep": template["upkeep"],
                "resource_costs": resource_costs_str
            })
        return data

    async def get_basic_data(self) -> List[Dict[str, Any]]:
        """Get basic alliance monument data for dropdowns."""
        return [
            {
                "name": template["name"],
                "category": template["category"].value,
                "description": template["description"]
            }
            for template in await self.get_all()
        ]

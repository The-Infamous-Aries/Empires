"""
City System for Sovereign Nation Game

This module defines the City dataclass that represents
a city within a nation with its own infrastructure, land, and stats.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional
from datetime import datetime
import uuid


@dataclass
class City:
    """Represents a city within a nation with its own infrastructure and land."""
    
    # Identity
    city_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    city_name: str = ""
    nation_id: str = ""  # Reference to the owning nation
    
    # City-Level Stats (purchased per city)
    infrastructure: int = 0  # Infrastructure level (purchased per city)
    land: int = 0  # Land in acres (purchased per city)
    
    # City Status
    is_capital: bool = False  # Whether this is the capital city
    
    # City Ratings (affect population and happiness)
    base_environment: float = 50.0  # Base environment level without bonuses
    environment: float = 50.0  # Environment level (0-100 scale)
    crime: float = 20.0  # Crime level (0-100 scale)
    disease: float = 15.0  # Disease level (0-100 scale)
    pollution: float = 0.0  # Pollution level (0-10+)
    
    # City State
    is_destroyed: bool = False  # Whether city was destroyed in war
    resistance: float = 0.0  # City resistance (bonus to defense)
    
    # Creation timestamp
    created_at: datetime = field(default_factory=datetime.now)
    founding_tick: int = 0  # Tick when city was founded
    
    # Cache for calculated values (recalculated each tick)
    population: int = 0  # Calculated population
    age_in_ticks: int = 0  # Age in ticks (for age bonus)
    improvement_slots: int = 0  # Improvement slots (every 100 infra = +1 slot)
    
    def __post_init__(self):
        """Initialize default values after creation."""
        # Calculate improvement slots based on infrastructure (500 infra = 1 slot + 3 starting slots)
        self.improvement_slots = (self.infrastructure // 500) + 3
    
    def calculate_population(self, nation_happiness: int, nation_environment: int) -> int:
        """Calculate city population based on infrastructure, land, and modifiers."""
        from . import formulas
        
        result = formulas.calculate_city_population(
            self.infrastructure,
            self.land,
            self.age_in_ticks,  # Assuming 1 tick = 1 day
            self.crime,
            self.disease,
            nation_happiness
        )
        
        self.population = result.base_population
        return self.population
    
    def calculate_crime(self, crime_bonus_sum: float, happiness_bonus_sum: int) -> float:
        """Calculate city crime level based on infrastructure, land, population, environment, and bonuses."""
        from . import formulas
        
        self.crime = formulas.calculate_city_crime(
            self.infrastructure,
            self.land,
            self.population,
            self.environment,
            crime_bonus_sum,
            happiness_bonus_sum
        )
        return self.crime
    
    def calculate_disease(self, disease_bonus_sum: float) -> float:
        """Calculate city disease level based on infrastructure, land, population, environment, and bonuses."""
        from . import formulas
        
        self.disease = formulas.calculate_city_disease(
            self.infrastructure,
            self.land,
            self.population,
            self.environment,
            disease_bonus_sum
        )
        return self.disease
    
    def calculate_environment(self, environment_bonus_sum: float) -> float:
        """Calculate city environment level based on infrastructure, land, population, and bonuses."""
        from . import formulas
        
        self.environment = formulas.calculate_city_environment(
            self.infrastructure,
            self.land,
            self.population,
            environment_bonus_sum
        )
        return self.environment
    
    def update_age(self, ticks: int = 1):
        """Update city age in ticks."""
        self.age_in_ticks += ticks
    
    def update_improvement_slots(self):
        """Update improvement slots based on current infrastructure (500 infra = 1 slot + 3 starting slots)."""
        self.improvement_slots = (self.infrastructure // 500) + 3
    
    def get_infrastructure_cost(self, city_count: int) -> float:
        """Get the cost to purchase infrastructure for this city."""
        from . import formulas
        return formulas.calculate_infrastructure_cost(self.infrastructure, city_count)
    
    def get_land_cost(self, city_count: int) -> float:
        """Get the cost to purchase land for this city."""
        from . import formulas
        return formulas.calculate_land_cost(self.land, city_count)
    
    def can_purchase_infrastructure(self, city_count: int, cash: float) -> bool:
        """Check if nation can purchase infrastructure for this city."""
        cost = self.get_infrastructure_cost(city_count)
        return cash >= cost
    
    def can_purchase_land(self, city_count: int, cash: float) -> bool:
        """Check if nation can purchase land for this city."""
        cost = self.get_land_cost(city_count)
        return cash >= cost
    
    def purchase_infrastructure(self, city_count: int, amount: int = 1) -> float:
        """Purchase infrastructure for this city. Returns cost."""
        cost = 0.0
        for _ in range(amount):
            cost += self.get_infrastructure_cost(city_count)
            self.infrastructure += 1
        
        self.update_improvement_slots()
        return cost
    
    def purchase_land(self, city_count: int, amount: int = 10) -> float:
        """Purchase land for this city. Returns cost."""
        cost = 0.0
        for _ in range(amount):
            cost += self.get_land_cost(city_count)
            self.land += 10  # Land purchased in 10-acre increments
        
        return cost
    
    def destroy_infrastructure(self, amount: int = 1):
        """Destroy infrastructure (war damage)."""
        self.infrastructure = max(0, self.infrastructure - amount)
        self.update_improvement_slots()
    
    def destroy_land(self, amount: int = 10):
        """Destroy land (war damage)."""
        self.land = max(0, self.land - amount)
    
    def apply_war_damage(self, infrastructure_damage_percent: float, land_damage_percent: float):
        """Apply war damage to city."""
        infra_loss = int(self.infrastructure * infrastructure_damage_percent / 100)
        land_loss = int(self.land * land_damage_percent / 100)
        
        self.destroy_infrastructure(infra_loss)
        self.destroy_land(land_loss)
    
    def calculate_resistance(self, nation) -> float:
        """Calculate city resistance based on improvements and bonuses."""
        from .improvements import ImprovementType, ImprovementSystem
        from .wonders import WonderType, WonderSystem
        
        base_resistance = 1.0  # Base resistance is 100% (1.0x multiplier)
        
        # Check for Fortifications improvement
        if nation.has_improvement(ImprovementType.FORTIFICATIONS):
            improvement_system = ImprovementSystem()
            fortifications = improvement_system.get_improvement(ImprovementType.FORTIFICATIONS)
            # Convert percentage bonus to multiplier (e.g., 15.0 becomes 1.15)
            base_resistance += (fortifications.city_resistance_bonus / 100.0)
        
        # Check for Fortified Citadel wonder
        if nation.has_wonder(WonderType.FORTIFIED_CITADEL):
            wonder_system = WonderSystem()
            citadel = wonder_system.get_wonder(WonderType.FORTIFIED_CITADEL)
            # Convert percentage bonus to multiplier
            base_resistance += (citadel.city_resistance_bonus / 100.0)
        
        self.resistance = base_resistance
        return base_resistance


class CitySystem:
    """System for managing cities within nations."""
    
    def __init__(self):
        self.cities: Dict[str, City] = {}  # city_id -> City
        self.nation_cities: Dict[str, Dict[str, City]] = {}  # nation_id -> {city_id -> City}
    
    def create_city(self, city_name: str, nation_id: str, is_capital: bool = False,
                   infrastructure: int = 0, land: int = 0) -> City:
        """Create a new city."""
        city = City(
            city_name=city_name,
            nation_id=nation_id,
            is_capital=is_capital,
            infrastructure=infrastructure,
            land=land
        )
        
        self.cities[city.city_id] = city
        
        if nation_id not in self.nation_cities:
            self.nation_cities[nation_id] = {}
        self.nation_cities[nation_id][city.city_id] = city
        
        return city
    
    def get_city(self, city_id: str) -> Optional[City]:
        """Get a city by ID."""
        return self.cities.get(city_id)
    
    def get_nation_cities(self, nation_id: str) -> Dict[str, City]:
        """Get all cities for a nation."""
        return self.nation_cities.get(nation_id, {})
    
    def get_nation_city_count(self, nation_id: str) -> int:
        """Get the number of cities a nation has."""
        return len(self.nation_cities.get(nation_id, {}))
    
    def get_capital_city(self, nation_id: str) -> Optional[City]:
        """Get the capital city for a nation."""
        cities = self.get_nation_cities(nation_id)
        for city in cities.values():
            if city.is_capital:
                return city
        return None
    
    def delete_city(self, city_id: str) -> bool:
        """Delete a city by ID."""
        if city_id in self.cities:
            city = self.cities[city_id]
            nation_id = city.nation_id
            
            del self.cities[city_id]
            if nation_id in self.nation_cities and city_id in self.nation_cities[nation_id]:
                del self.nation_cities[nation_id][city_id]
            
            return True
        return False
    
    def calculate_nation_total_infrastructure(self, nation_id: str) -> int:
        """Calculate total infrastructure across all cities for a nation."""
        cities = self.get_nation_cities(nation_id)
        return sum(city.infrastructure for city in cities.values())
    
    def calculate_nation_total_land(self, nation_id: str) -> int:
        """Calculate total land across all cities for a nation."""
        cities = self.get_nation_cities(nation_id)
        return sum(city.land for city in cities.values())
    
    def calculate_nation_total_population(self, nation_id: str, nation_happiness: int, nation_environment: int) -> int:
        """Calculate total population across all cities for a nation."""
        cities = self.get_nation_cities(nation_id)
        total_population = 0
        for city in cities.values():
            total_population += city.calculate_population(nation_happiness, nation_environment)
        return total_population
    
    def calculate_nation_total_improvement_slots(self, nation_id: str) -> int:
        """Calculate total improvement slots across all cities for a nation."""
        cities = self.get_nation_cities(nation_id)
        return sum(city.improvement_slots for city in cities.values())
    
    def update_all_cities_age(self, nation_id: str, ticks: int = 1):
        """Update age for all cities in a nation."""
        cities = self.get_nation_cities(nation_id)
        for city in cities.values():
            city.update_age(ticks)
    
    def update_all_cities_improvement_slots(self, nation_id: str):
        """Update improvement slots for all cities in a nation."""
        cities = self.get_nation_cities(nation_id)
        for city in cities.values():
            city.update_improvement_slots()


# Singleton instance
city_system = CitySystem()

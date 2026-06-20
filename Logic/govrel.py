"""
Government and Religion System for Sovereign Nation Game

This module defines the Government and Religion components that determine
nation bonuses, penalties, and synergies.
"""

from dataclasses import dataclass
from typing import Optional, List, Dict, Set
from enum import Enum


class GovernmentType(Enum):
    """All available government types in the game."""
    DEMOCRACY = "Democracy"
    REPUBLIC = "Republic"
    MONARCHY = "Monarchy"
    CONSTITUTIONAL_MONARCHY = "Constitutional Monarchy"
    THEOCRACY = "Theocracy"
    DICTATORSHIP = "Dictatorship"
    FASCISM = "Fascism"
    COMMUNIST = "Communist"
    CAPITALIST = "Capitalist"
    FEDERAL = "Federal"
    REVOLUTIONARY = "Revolutionary"
    ANARCHY = "Anarchy"
    OLIGARCHY = "Oligarchy"
    TECHNOCRACY = "Technocracy"
    THEOCRATIC_REPUBLIC = "Theocratic Republic"
    ABSOLUTE_MONARCHY = "Absolute Monarchy"
    PARLIAMENTARY_DEMOCRACY = "Parliamentary Democracy"
    SOCIAL_DEMOCRACY = "Social Democracy"
    LIBERTARIAN_STATE = "Libertarian State"
    IMPERIAL_REGIME = "Imperial Regime"
    CONFEDERATION = "Confederation"
    MILITARY_JUNTA = "Military Junta"
    ISLAMIC_EMIRATE = "Islamic Emirate"
    CALIPHATE = "Caliphate"


class ReligionType(Enum):
    """All available religion types in the game."""
    CHRISTIANITY_CATHOLIC = "Christianity (Catholic)"
    CHRISTIANITY_PROTESTANT = "Christianity (Protestant)"
    CHRISTIANITY_ORTHODOX = "Christianity (Orthodox)"
    CHRISTIANITY_ANGLICAN = "Christianity (Anglican)"
    CHRISTIANITY_COPTIC = "Christianity (Coptic)"
    CHRISTIANITY_EASTERN_ORTHODOX = "Christianity (Eastern Orthodox)"
    ISLAM_SUNNI = "Islam (Sunni)"
    ISLAM_SHIA = "Islam (Shia)"
    ISLAM_IBADI = "Islam (Ibadi)"
    JUDAISM = "Judaism"
    HINDUISM = "Hinduism"
    BUDDHISM = "Buddhism"
    SIKHISM = "Sikhism"
    TAOISM = "Taoism"
    CONFUCIANISM = "Confucianism"
    JAINISM = "Jainism"
    ZOROASTRIANISM = "Zoroastrianism"
    SHINTO = "Shinto"
    ANIMISM = "Animism"
    PAGANISM = "Paganism"
    DEISM = "Deism"
    SPIRITUALISM = "Spiritualism"
    NEW_AGE = "New Age"
    ATHEISM_SECULAR = "Atheism / Secular"
    MIXED_PLURALIST = "Mixed / Pluralist"


@dataclass
class Government:
    """Government type with bonuses and effects."""
    name: str
    income_bonus: float  # Percentage bonus to tax income
    military_bonus: float  # Percentage bonus to ALL military units (soldiers, tanks, aircraft, ships) efficiency
    happiness_bonus: int  # Direct happiness modifier
    citizen_income_bonus: float = 0.0  # Direct bonus to citizen income
    commerce_bonus: float = 0.0  # Percentage bonus to commerce income
    military_upkeep_bonus: float = 0.0  # Percentage bonus to military upkeep
    population_bonus: float = 0.0  # Percentage bonus to population growth
    upkeep_reduction: float = 0.0  # Percentage reduction on all upkeep (improvements, wonders, infra)
    cost_reduction: float = 0.0  # Percentage reduction on all purchase costs (cities, infra, land, tech)
    is_forced: bool = False  # Whether this government is forced (e.g., Anarchy after war)
    description: str = ""  # Flavor text to help players understand the government

    def __str__(self) -> str:
        return self.name


@dataclass
class Religion:
    """Religion type with bonuses and effects."""
    name: str
    income_bonus: float = 0.0  # Percentage bonus to tax income
    military_bonus: float = 0.0  # Percentage bonus to ALL military units efficiency
    happiness_bonus: int = 0  # Direct happiness modifier
    population_bonus: float = 0.0  # Percentage bonus to population growth
    description: str = ""  # Flavor text to help players understand the religion

    def __str__(self) -> str:
        return self.name


class GovernmentSystem:
    """System for managing government types and their effects."""

    def __init__(self):
        self.governments: Dict[GovernmentType, Government] = self._initialize_governments()

    def _initialize_governments(self) -> Dict[GovernmentType, Government]:
        """Initialize all government types with their data."""
        return {
            GovernmentType.DEMOCRACY: Government(
                name="Democracy",
                income_bonus=14.0,
                military_bonus=0.0,
                happiness_bonus=8,
                population_bonus=0.06,
                upkeep_reduction=0.08,
                cost_reduction=-0.04,
                is_forced=False,
                description="A government by the people, for the people. Strong income, happiness, and population with cost reduction, but no military bonus and higher upkeep."
            ),
            GovernmentType.REPUBLIC: Government(
                name="Republic",
                income_bonus=16.0,
                military_bonus=0.22,
                happiness_bonus=6,
                population_bonus=0.0,
                upkeep_reduction=0.08,
                cost_reduction=-0.04,
                is_forced=False,
                description="A representative democracy with balanced approach. Strong income, military, and happiness with cost reduction, but no population bonus and higher upkeep."
            ),
            GovernmentType.MONARCHY: Government(
                name="Monarchy",
                income_bonus=-8.0,
                military_bonus=0.15,
                happiness_bonus=4,
                population_bonus=0.12,
                upkeep_reduction=-0.08,
                cost_reduction=0.0,
                is_forced=False,
                description="Traditional rule by a monarch. Strong population, military, happiness, and upkeep reduction, but lower income."
            ),
            GovernmentType.CONSTITUTIONAL_MONARCHY: Government(
                name="Constitutional Monarchy",
                income_bonus=12.0,
                military_bonus=0.0,
                happiness_bonus=7,
                population_bonus=0.04,
                upkeep_reduction=-0.03,
                cost_reduction=0.06,
                is_forced=False,
                description="A monarchy limited by constitution. Strong income, happiness, and population with slight upkeep reduction, but no military bonus and higher costs."
            ),
            GovernmentType.THEOCRACY: Government(
                name="Theocracy",
                income_bonus=0.0,
                military_bonus=0.15,
                happiness_bonus=9,
                population_bonus=0.10,
                upkeep_reduction=-0.05,
                cost_reduction=-0.04,
                is_forced=False,
                description="Rule by religious authority. Strong happiness, population, military, and upkeep/cost reduction, but no income bonus."
            ),
            GovernmentType.DICTATORSHIP: Government(
                name="Dictatorship",
                income_bonus=6.0,
                military_bonus=0.0,
                happiness_bonus=-6,
                population_bonus=0.10,
                upkeep_reduction=-0.06,
                cost_reduction=-0.04,
                is_forced=False,
                description="Authoritarian rule by a single leader. Strong income, population, and upkeep/cost reduction, but no military bonus and happiness penalty."
            ),
            GovernmentType.FASCISM: Government(
                name="Fascism",
                income_bonus=4.0,
                military_bonus=0.45,
                happiness_bonus=-8,
                population_bonus=0.0,
                upkeep_reduction=-0.07,
                cost_reduction=-0.04,
                is_forced=False,
                description="Ultra-nationalist authoritarian regime. Strong military, income, and upkeep/cost reduction, but severe happiness penalty and no population bonus."
            ),
            GovernmentType.COMMUNIST: Government(
                name="Communist",
                income_bonus=0.0,
                military_bonus=0.22,
                happiness_bonus=5,
                population_bonus=0.10,
                upkeep_reduction=-0.05,
                cost_reduction=0.06,
                is_forced=False,
                description="State-controlled economy and society. Strong military, happiness, and population with slight upkeep reduction, but no income bonus and higher costs."
            ),
            GovernmentType.CAPITALIST: Government(
                name="Capitalist",
                income_bonus=19.0,
                military_bonus=0.25,
                happiness_bonus=-5,
                population_bonus=0.06,
                upkeep_reduction=0.0,
                cost_reduction=-0.08,
                is_forced=False,
                description="Free-market economy focused on wealth generation. Strong income, military, and cost reduction, but happiness penalty and no upkeep reduction."
            ),
            GovernmentType.FEDERAL: Government(
                name="Federal",
                income_bonus=-8.0,
                military_bonus=0.18,
                happiness_bonus=5,
                population_bonus=0.14,
                upkeep_reduction=0.0,
                cost_reduction=-0.04,
                is_forced=False,
                description="A union of states with shared power. Strong population, happiness, and cost reduction, but lower income and no upkeep reduction."
            ),
            GovernmentType.REVOLUTIONARY: Government(
                name="Revolutionary",
                income_bonus=8.0,
                military_bonus=0.38,
                happiness_bonus=0.0,
                population_bonus=0.10,
                upkeep_reduction=-0.06,
                cost_reduction=-0.04,
                is_forced=False,
                description="A government born from revolution. Strong military, income, population, and upkeep/cost reduction, but no happiness bonus."
            ),
            GovernmentType.ANARCHY: Government(
                name="Anarchy",
                income_bonus=-20.0,
                military_bonus=-0.50,
                happiness_bonus=10,
                population_bonus=0.0,
                upkeep_reduction=0.25,
                cost_reduction=0.25,
                is_forced=True,
                description="A state of chaos and disorder. Maximum penalties across income, military, upkeep, and costs with maximum happiness boost. Recover quickly to restore order."
            ),
            GovernmentType.OLIGARCHY: Government(
                name="Oligarchy",
                income_bonus=0.0,
                military_bonus=0.22,
                happiness_bonus=5,
                population_bonus=0.06,
                upkeep_reduction=-0.04,
                cost_reduction=0.06,
                is_forced=False,
                description="Rule by a small wealthy elite. Strong military, happiness, and population with upkeep reduction, but no income bonus and higher costs."
            ),
            GovernmentType.TECHNOCRACY: Government(
                name="Technocracy",
                income_bonus=-6.0,
                military_bonus=0.20,
                happiness_bonus=6,
                population_bonus=0.15,
                upkeep_reduction=-0.10,
                cost_reduction=0.0,
                is_forced=False,
                description="Rule by technical experts and scientists. Strong population, military, happiness, and upkeep reduction, but lower income."
            ),
            GovernmentType.THEOCRATIC_REPUBLIC: Government(
                name="Theocratic Republic",
                income_bonus=-8.0,
                military_bonus=0.18,
                happiness_bonus=9,
                population_bonus=0.09,
                upkeep_reduction=-0.06,
                cost_reduction=0.0,
                is_forced=False,
                description="A blend of religious and republican governance. Strong happiness, population, and military with upkeep reduction, but lower income and higher costs."
            ),
            GovernmentType.ABSOLUTE_MONARCHY: Government(
                name="Absolute Monarchy",
                income_bonus=6.0,
                military_bonus=0.44,
                happiness_bonus=-6,
                population_bonus=0.08,
                upkeep_reduction=0.0,
                cost_reduction=-0.04,
                is_forced=False,
                description="Unlimited royal power with military focus. Strong military, income, population, and cost reduction, but happiness penalty and no upkeep reduction."
            ),
            GovernmentType.PARLIAMENTARY_DEMOCRACY: Government(
                name="Parliamentary Democracy",
                income_bonus=10.0,
                military_bonus=0.20,
                happiness_bonus=0.0,
                population_bonus=-4,
                upkeep_reduction=-0.05,
                cost_reduction=-0.04,
                is_forced=False,
                description="Democratic government with parliamentary system. Strong income, military, and upkeep/cost reduction, but lower population and no happiness bonus."
            ),
            GovernmentType.SOCIAL_DEMOCRACY: Government(
                name="Social Democracy",
                income_bonus=0.0,
                military_bonus=-0.06,
                happiness_bonus=10,
                population_bonus=0.10,
                upkeep_reduction=-0.06,
                cost_reduction=-0.04,
                is_forced=False,
                description="Democratic government with strong social programs. Strong happiness, population, and upkeep/cost reduction, but lower military and no income bonus."
            ),
            GovernmentType.LIBERTARIAN_STATE: Government(
                name="Libertarian State",
                income_bonus=19.0,
                military_bonus=0.0,
                happiness_bonus=-5,
                population_bonus=0.06,
                upkeep_reduction=-0.04,
                cost_reduction=-0.10,
                is_forced=False,
                description="Minimal government with maximum economic freedom. Strong income, population, and cost reduction, but happiness penalty and no military bonus."
            ),
            GovernmentType.IMPERIAL_REGIME: Government(
                name="Imperial Regime",
                income_bonus=7.0,
                military_bonus=0.42,
                happiness_bonus=0.0,
                population_bonus=0.09,
                upkeep_reduction=-0.06,
                cost_reduction=-0.04,
                is_forced=False,
                description="Expansionist imperial rule with military focus. Strong military, income, population, and upkeep/cost reduction, but no happiness bonus."
            ),
            GovernmentType.CONFEDERATION: Government(
                name="Confederation",
                income_bonus=12.0,
                military_bonus=0.20,
                happiness_bonus=7,
                population_bonus=-4,
                upkeep_reduction=0.0,
                cost_reduction=-0.04,
                is_forced=False,
                description="A loose alliance of sovereign states. Strong income, happiness, military, and cost reduction, but lower population and no upkeep reduction."
            ),
            GovernmentType.MILITARY_JUNTA: Government(
                name="Military Junta",
                income_bonus=-8.0,
                military_bonus=0.48,
                happiness_bonus=0.0,
                population_bonus=0.08,
                upkeep_reduction=-0.08,
                cost_reduction=-0.06,
                is_forced=False,
                description="Rule by military leaders. Strong military, population, upkeep reduction, and cost reduction, but lower income and no happiness bonus."
            ),
            GovernmentType.ISLAMIC_EMIRATE: Government(
                name="Islamic Emirate",
                income_bonus=8.0,
                military_bonus=0.34,
                happiness_bonus=-4,
                population_bonus=0.08,
                upkeep_reduction=-0.05,
                cost_reduction=0.0,
                is_forced=False,
                description="Islamic governance under emir rule. Strong military, income, and population with upkeep reduction, but happiness penalty and higher costs."
            ),
            GovernmentType.CALIPHATE: Government(
                name="Caliphate",
                income_bonus=9.0,
                military_bonus=0.48,
                happiness_bonus=-5,
                population_bonus=0.0,
                upkeep_reduction=-0.06,
                cost_reduction=-0.04,
                is_forced=False,
                description="Islamic religious state under caliph rule. Strong military, income, and upkeep/cost reduction, but happiness penalty and no population bonus."
            ),
        }

    def get_government(self, gov_type: GovernmentType) -> Government:
        """Get a government by type."""
        return self.governments[gov_type]

    def get_all_governments(self) -> List[Government]:
        """Get all available governments."""
        return list(self.governments.values())

    def get_playable_governments(self) -> List[Government]:
        """Get all governments that can be chosen (not forced like Anarchy)."""
        return [gov for gov in self.governments.values() if not gov.is_forced]

    def check_synergy(self, government: GovernmentType, religion: Optional[ReligionType]) -> bool:
        """Check if a government and religion have a synergy."""
        if religion is None:
            return False
        return religion in self.governments[government].synergy_religions


class ReligionSystem:
    """System for managing religion types and their effects."""

    def __init__(self):
        self.religions: Dict[ReligionType, Religion] = self._initialize_religions()

    def _initialize_religions(self) -> Dict[ReligionType, Religion]:
        """Initialize all religion types with their data."""
        return {
            ReligionType.CHRISTIANITY_CATHOLIC: Religion(
                name="Christianity (Catholic)",
                income_bonus=13.33,
                military_bonus=0.50,
                happiness_bonus=-10.0,
                population_bonus=0.0,
                description="The largest Christian denomination with traditional values. Strong income and military, no population, but severe happiness penalty."
            ),
            ReligionType.CHRISTIANITY_PROTESTANT: Religion(
                name="Christianity (Protestant)",
                income_bonus=6.67,
                military_bonus=0.50,
                happiness_bonus=-10.0,
                population_bonus=0.0,
                description="Reformed Christian faith emphasizing individual interpretation. Strong military, slight income, no population, but severe happiness penalty."
            ),
            ReligionType.CHRISTIANITY_ORTHODOX: Religion(
                name="Christianity (Orthodox)",
                income_bonus=20.0,
                military_bonus=0.33,
                happiness_bonus=-10.0,
                population_bonus=0.0,
                description="Traditional Eastern Christian faith. Maximum income, strong military, no population, but severe happiness penalty."
            ),
            ReligionType.CHRISTIANITY_ANGLICAN: Religion(
                name="Christianity (Anglican)",
                income_bonus=-20.0,
                military_bonus=0.0,
                happiness_bonus=6.67,
                population_bonus=0.11,
                description="English Christian tradition with economic focus. Strong happiness, slight population, no military, but severe income penalty."
            ),
            ReligionType.CHRISTIANITY_COPTIC: Religion(
                name="Christianity (Coptic)",
                income_bonus=-20.0,
                military_bonus=0.0,
                happiness_bonus=10.0,
                population_bonus=0.11,
                description="Ancient Egyptian Christian tradition. Maximum happiness, slight population, no military, but severe income penalty."
            ),
            ReligionType.CHRISTIANITY_EASTERN_ORTHODOX: Religion(
                name="Christianity (Eastern Orthodox)",
                income_bonus=6.67,
                military_bonus=-0.50,
                happiness_bonus=0.0,
                population_bonus=0.33,
                description="Eastern Christian tradition with economic focus. Maximum population, slight income, no happiness, but severe military penalty."
            ),
            ReligionType.ISLAM_SUNNI: Religion(
                name="Islam (Sunni)",
                income_bonus=13.33,
                military_bonus=0.50,
                happiness_bonus=-10.0,
                population_bonus=0.0,
                description="The largest branch of Islam. Strong income and military, no population, but severe happiness penalty."
            ),
            ReligionType.ISLAM_SHIA: Religion(
                name="Islam (Shia)",
                income_bonus=0.0,
                military_bonus=-0.50,
                happiness_bonus=3.33,
                population_bonus=0.22,
                description="The second-largest branch of Islam. Moderate happiness, strong population, no income, but severe military penalty."
            ),
            ReligionType.ISLAM_IBADI: Religion(
                name="Islam (Ibadi)",
                income_bonus=0.0,
                military_bonus=0.17,
                happiness_bonus=-10.0,
                population_bonus=0.11,
                description="A distinct branch of Islam emphasizing tolerance. Slight population, no income, but severe happiness penalty."
            ),
            ReligionType.JUDAISM: Religion(
                name="Judaism",
                income_bonus=20.0,
                military_bonus=0.50,
                happiness_bonus=0.0,
                population_bonus=-0.33,
                description="Ancient monotheistic faith. Maximum income and military, no happiness, but severe population penalty."
            ),
            ReligionType.HINDUISM: Religion(
                name="Hinduism",
                income_bonus=-20.0,
                military_bonus=0.33,
                happiness_bonus=6.67,
                population_bonus=0.0,
                description="Ancient Indian religion with focus on nature. Strong happiness and military, no population, but severe income penalty."
            ),
            ReligionType.BUDDHISM: Religion(
                name="Buddhism",
                income_bonus=-20.0,
                military_bonus=0.0,
                happiness_bonus=6.67,
                population_bonus=0.33,
                description="Eastern philosophy emphasizing peace and mindfulness. Strong happiness and population, no military, but severe income penalty."
            ),
            ReligionType.SIKHISM: Religion(
                name="Sikhism",
                income_bonus=0.0,
                military_bonus=0.33,
                happiness_bonus=-10.0,
                population_bonus=0.22,
                description="Indian religion with warrior tradition. Strong population, no income, but severe happiness penalty."
            ),
            ReligionType.TAOISM: Religion(
                name="Taoism",
                income_bonus=13.33,
                military_bonus=-0.50,
                happiness_bonus=0.0,
                population_bonus=0.22,
                description="Chinese philosophy emphasizing harmony with nature. Strong income and population, no happiness, but severe military penalty."
            ),
            ReligionType.CONFUCIANISM: Religion(
                name="Confucianism",
                income_bonus=-20.0,
                military_bonus=0.0,
                happiness_bonus=6.67,
                population_bonus=0.11,
                description="Chinese ethical and philosophical system. Strong happiness, slight population, no military, but severe income penalty."
            ),
            ReligionType.JAINISM: Religion(
                name="Jainism",
                income_bonus=0.0,
                military_bonus=-0.50,
                happiness_bonus=3.33,
                population_bonus=0.22,
                description="Indian religion emphasizing non-violence and environmental harmony. Moderate happiness, strong population, no income, but severe military penalty."
            ),
            ReligionType.ZOROASTRIANISM: Religion(
                name="Zoroastrianism",
                income_bonus=0.0,
                military_bonus=0.33,
                happiness_bonus=10.0,
                population_bonus=-0.33,
                description="Ancient Persian religion focusing on fire as sacred. Maximum happiness, slight military, no income, but severe population penalty."
            ),
            ReligionType.SHINTO: Religion(
                name="Shinto",
                income_bonus=6.67,
                military_bonus=0.0,
                happiness_bonus=3.33,
                population_bonus=-0.33,
                description="Japanese indigenous religion. Moderate happiness, slight income, no military, but severe population penalty."
            ),
            ReligionType.ANIMISM: Religion(
                name="Animism",
                income_bonus=20.0,
                military_bonus=0.17,
                happiness_bonus=0.0,
                population_bonus=-0.33,
                description="Belief that objects have spirits. Maximum income, slight military, no happiness, but severe population penalty."
            ),
            ReligionType.PAGANISM: Religion(
                name="Paganism",
                income_bonus=20.0,
                military_bonus=0.17,
                happiness_bonus=0.0,
                population_bonus=-0.33,
                description="Nature-worshipping traditions. Maximum income, slight military, no happiness, but severe population penalty."
            ),
            ReligionType.DEISM: Religion(
                name="Deism",
                income_bonus=0.0,
                military_bonus=-0.50,
                happiness_bonus=6.67,
                population_bonus=0.22,
                description="Belief in a creator who doesn't intervene. Strong happiness and population, no income, but severe military penalty."
            ),
            ReligionType.SPIRITUALISM: Religion(
                name="Spiritualism",
                income_bonus=20.0,
                military_bonus=-0.50,
                happiness_bonus=6.67,
                population_bonus=0.0,
                description="Focus on spiritual well-being and healing. Maximum income and happiness, no population, but severe military penalty."
            ),
            ReligionType.NEW_AGE: Religion(
                name="New Age",
                income_bonus=6.67,
                military_bonus=-0.50,
                happiness_bonus=10.0,
                population_bonus=0.0,
                description="Modern spiritual movement combining various traditions. Maximum happiness, slight income, no population, but severe military penalty."
            ),
            ReligionType.ATHEISM_SECULAR: Religion(
                name="Atheism / Secular",
                income_bonus=-20.0,
                military_bonus=0.33,
                happiness_bonus=0.0,
                population_bonus=0.22,
                description="Rational worldview without religious belief. Strong population, slight military, no happiness, but severe income penalty."
            ),
            ReligionType.MIXED_PLURALIST: Religion(
                name="Mixed / Pluralist",
                income_bonus=13.33,
                military_bonus=0.0,
                happiness_bonus=3.33,
                population_bonus=-0.33,
                description="Diverse society with multiple beliefs. Strong income, moderate happiness, no military, but severe population penalty."
            ),
        }

    def get_religion(self, rel_type: ReligionType) -> Religion:
        """Get a religion by type."""
        return self.religions[rel_type]

    def get_all_religions(self) -> List[Religion]:
        """Get all available religions."""
        return list(self.religions.values())

    def calculate_religion_income_bonus(self, religion: ReligionType) -> float:
        """Calculate income bonus from religion."""
        rel = self.religions[religion]
        return rel.income_bonus

    def calculate_religion_military_bonus(self, religion: ReligionType) -> float:
        """Calculate military bonus from religion."""
        rel = self.religions[religion]
        return rel.military_bonus

    def calculate_religion_happiness_bonus(self, religion: ReligionType) -> int:
        """Calculate happiness bonus from religion."""
        rel = self.religions[religion]
        return rel.happiness_bonus

    def calculate_religion_population_bonus(self, religion: ReligionType) -> float:
        """Calculate population bonus from religion."""
        rel = self.religions[religion]
        return rel.population_bonus


class GovRelSystem:
    """Main system for managing government and religion interactions."""

    def __init__(self):
        self.government_system = GovernmentSystem()
        self.religion_system = ReligionSystem()

    def calculate_tax_income_modifier(self, government: GovernmentType) -> float:
        """Calculate tax income modifier based on government."""
        gov = self.government_system.get_government(government)
        return gov.income_bonus

    def calculate_military_efficiency_modifier(self, government: GovernmentType) -> float:
        """Calculate military efficiency modifier based on government."""
        gov = self.government_system.get_government(government)
        return gov.military_bonus

    def calculate_happiness_modifier(
        self,
        government: GovernmentType,
        religion: Optional[ReligionType] = None,
        religion_matches_citizens: bool = False,
        completed_projects: Optional[list] = None
    ) -> int:
        """
        Calculate happiness modifier based on government and religion.
        
        Args:
            government: The government type
            religion: The endorsed religion (None if secular)
            religion_matches_citizens: Whether the endorsed religion matches citizen desire
            completed_projects: List of completed projects (optional)
            
        Returns:
            Total happiness modifier
        """
        gov = self.government_system.get_government(government)
        total_happiness = gov.happiness_bonus

        # Check if projects remove mismatch penalties
        religion_mismatch_removed = False
        government_mismatch_removed = False
        
        if completed_projects:
            from .projects import ProjectSystem
            project_system = ProjectSystem()
            for project_type in completed_projects:
                project = project_system.get_project(project_type)
                if project.religion_mismatch_penalty_removed:
                    religion_mismatch_removed = True
                if project.government_mismatch_penalty_removed:
                    government_mismatch_removed = True

        # Add religion happiness if religion is endorsed
        if religion and religion != ReligionType.ATHEISM_SECULAR:
            if religion_matches_citizens:
                total_happiness += 2  # Base religion bonus
            elif not religion_mismatch_removed:
                total_happiness -= 1  # Mismatch penalty (removed if project active)

            # Theocracy doubles religion bonuses
            if government == GovernmentType.THEOCRACY and religion_matches_citizens:
                total_happiness += 2  # Double the base bonus

        # Theocracy special case: happiness only applies if religion matches
        if government == GovernmentType.THEOCRACY:
            if not religion or not religion_matches_citizens:
                total_happiness -= 3  # Remove the +3 base if no matching religion

        return total_happiness

    def check_government_religion_synergy(
        self,
        government: GovernmentType,
        religion: Optional[ReligionType]
    ) -> bool:
        """
        Check if government and religion have a synergy (doubles religion bonuses).
        
        Args:
            government: The government type
            religion: The endorsed religion (None if secular)
            
        Returns:
            True if synergy exists, False otherwise
        """
        if religion is None:
            return False

        # Check both directions
        gov_has_rel = self.government_system.check_synergy(government, religion)
        rel_has_gov = self.religion_system.check_synergy(religion, government)

        return gov_has_rel or rel_has_gov

    def calculate_religion_bonus_multiplier(
        self,
        government: GovernmentType,
        religion: Optional[ReligionType]
    ) -> float:
        """
        Calculate the multiplier for religion bonuses based on government.
        
        Args:
            government: The government type
            religion: The endorsed religion
            
        Returns:
            Multiplier (1.0 = normal, 2.0 = doubled, etc.)
        """
        if religion is None:
            return 0.0

        multiplier = 1.0

        # Theocracy doubles religion bonuses
        if government == GovernmentType.THEOCRACY:
            multiplier *= 2.0

        # Theocratic Republic gives +50%
        if government == GovernmentType.THEOCRATIC_REPUBLIC:
            multiplier *= 1.5

        # Islamic Emirate gives +50% if Islam
        if government == GovernmentType.ISLAMIC_EMIRATE:
            if religion in [ReligionType.ISLAM_SUNNI, ReligionType.ISLAM_SHIA, ReligionType.ISLAM_IBADI]:
                multiplier *= 1.5

        # Caliphate doubles if Islam
        if government == GovernmentType.CALIPHATE:
            if religion in [ReligionType.ISLAM_SUNNI, ReligionType.ISLAM_SHIA, ReligionType.ISLAM_IBADI]:
                multiplier *= 2.0

        # Synergy doubles religion bonuses (stacks with other multipliers)
        if self.check_government_religion_synergy(government, religion):
            multiplier *= 2.0

        return multiplier

    def get_government_special_effects(self, government: GovernmentType) -> List[str]:
        """Get list of special effects for a government."""
        gov = self.government_system.get_government(government)
        effects = [gov.special_effect]
        
        # Add synergy information
        if gov.synergy_religions:
            rel_names = [r.value for r in gov.synergy_religions]
            effects.append(f"Synergy: {', '.join(rel_names)}")
        else:
            effects.append("Synergy: None")
            
        return effects

    def get_religion_special_effects(self, religion: ReligionType) -> List[str]:
        """Get list of special effects for a religion."""
        rel = self.religion_system.get_religion(religion)
        effects = [rel.passive_bonus, rel.special_effect]
        
        # Add synergy information
        if rel.synergy_governments:
            gov_names = [g.value for g in rel.synergy_governments]
            effects.append(f"Synergy: {', '.join(gov_names)}")
        else:
            effects.append("Synergy: None")
            
        return effects


# Singleton instance
govrel_system = GovRelSystem()

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set
from enum import Enum
from datetime import datetime, timedelta
import uuid


class DiplomaticRelationType(Enum):
    HOSTILE = "Hostile"
    UNFRIENDLY = "Unfriendly"
    NEUTRAL = "Neutral"
    FRIENDLY = "Friendly"
    ALLIED = "Allied"
    PROTECTORATE = "Protectorate"
    VASSAL = "Vassal"
    PUPPET_STATE = "Puppet State"
    FEDERATED = "Federated"


class DiplomaticActionType(Enum):
    GIFT_CASH = "Gift Cash"
    GIFT_RESOURCE = "Gift Resource"
    GIFT_TECH = "Gift Technology"
    SEND_EMISSARY = "Send Emissary"
    ESTABLISH_EMBASSY = "Establish Embassy"
    IMPROVE_RELATIONS = "Improve Relations"
    WORSEN_RELATIONS = "Worsen Relations"
    PROPOSE_ALLIANCE = "Propose Alliance"
    DEMAND_TRIBUTE = "Demand Tribute"
    INSULT = "Insult"
    PRAISE = "Praise"
    TRADE_AGREEMENT = "Trade Agreement"
    RESEARCH_AGREEMENT = "Research Agreement"
    DEFENSE_PACT = "Defense Pact"
    NON_AGGRESSION_PACT = "Non-Aggression Pact"


class CasusBelliType(Enum):
    TERRITORIAL_CLAIM = "Territorial Claim"
    IDEOLOGICAL_DIFFERENCES = "Ideological Differences"
    RESOURCE_CONFLICT = "Resource Conflict"
    ALLIANCE_OBLIGATION = "Alliance Obligation"
    HONOR_DEFENSE = "Honor Defense"
    PREEMPTIVE_STRIKE = "Preemptive Strike"
    LIBERATION = "Liberation"
    RECONQUEST = "Reconquest"
    HOLY_WAR = "Holy War"
    TRADE_DISPUTE = "Trade Dispute"
    BORDER_INCIDENT = "Border Incident"
    SPY_CAUGHT = "Spy Caught"
    TREATY_VIOLATION = "Treaty Violation"
    SANCTION_VIOLATION = "Sanction Violation"
    PROTECTORATE_DEFENSE = "Protectorate Defense"
    VASSAL_REBELLION = "Vassal Rebellion"


class TreatyStatus(Enum):
    ACTIVE = "Active"
    EXPIRED = "Expired"
    BROKEN = "Broken"
    PENDING = "Pending"
    PROPOSED = "Proposed"
    NEGOTIATING = "Negotiating"


class TreatyType(Enum):
    NAP = "Non-Aggression Pact"
    MDP = "Mutual Defense Pact"
    ODP = "Optional Defense Pact"
    PROTECTORATE = "Protectorate"
    VASSALAGE = "Vassalage"
    TRADE_AGREEMENT = "Trade Agreement"
    RESEARCH_AGREEMENT = "Research Agreement"
    PEACE_TREATY = "Peace Treaty"
    ALLIANCE = "Alliance"
    FEDERATION = "Federation"


class ResolutionType(Enum):
    SANCTION_NATION = "Sanction Nation"
    DECLARE_GLOBAL_WAR = "Declare Global War"
    SET_TRADE_TARIFFS = "Set Trade Tariffs"
    BAN_WMDS = "Ban WMDs"
    LIFT_SANCTIONS = "Lift Sanctions"
    PEACE_TREATY = "Peace Treaty"
    HUMANITARIAN_AID = "Humanitarian Aid"
    EMBARGO = "Embargo"
    RECOGNIZE_BORDER = "Recognize Border"
    ECONOMIC_SANCTIONS = "Economic Sanctions"
    MILITARY_SANCTIONS = "Military Sanctions"
    DIPLOMATIC_ISOLATION = "Diplomatic Isolation"


class ResolutionStatus(Enum):
    PROPOSED = "Proposed"
    VOTING = "Voting"
    PASSED = "Passed"
    FAILED = "Failed"
    VETOED = "Vetoed"
    WITHDRAWN = "Withdrawn"


@dataclass
class DiplomaticRelation:
    relation_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    nation_a_id: str = ""
    nation_b_id: str = ""
    
    relation: DiplomaticRelationType = DiplomaticRelationType.NEUTRAL
    relation_score: float = 0.0
    
    influence_a_on_b: float = 0.0
    influence_b_on_a: float = 0.0
    trust_level: float = 0.0
    
    has_embassy_a: bool = False
    has_embassy_b: bool = False
    embassy_level_a: int = 0
    embassy_level_b: int = 0
    
    active_casus_belli: List[CasusBelliType] = field(default_factory=list)
    casus_belli_expiration: Dict[CasusBelliType, datetime] = field(default_factory=dict)
    
    relation_history: List[Dict[str, float]] = field(default_factory=list)
    
    established_at: datetime = field(default_factory=datetime.now)
    last_updated: datetime = field(default_factory=datetime.now)
    
    def update_relation(self, delta: float):
        self.relation_score = max(-100.0, min(100.0, self.relation_score + delta))
        self.last_updated = datetime.now()
        
        if self.relation_score >= 80:
            self.relation = DiplomaticRelationType.FEDERATED
        elif self.relation_score >= 70:
            self.relation = DiplomaticRelationType.ALLIED
        if self.relation_score >= 60:
            self.relation = DiplomaticRelationType.FRIENDLY
        elif self.relation_score >= 40:
            self.relation = DiplomaticRelationType.FRIENDLY
        elif self.relation_score >= -20:
            self.relation = DiplomaticRelationType.NEUTRAL
        elif self.relation_score >= -50:
            self.relation = DiplomaticRelationType.UNFRIENDLY
        elif self.relation_score >= -80:
            self.relation = DiplomaticRelationType.HOSTILE
        else:
            self.relation = DiplomaticRelationType.HOSTILE
    
    def record_event(self, event_type: str, impact: float):
        self.relation_history.append({
            "event_type": event_type,
            "impact": impact,
            "timestamp": datetime.now()
        })
    
    def add_casus_belli(self, cb_type: CasusBelliType, expires_at: Optional[datetime] = None):
        if cb_type not in self.active_casus_belli:
            self.active_casus_belli.append(cb_type)
        if expires_at:
            self.casus_belli_expiration[cb_type] = expires_at
    
    def remove_casus_belli(self, cb_type: CasusBelliType):
        if cb_type in self.active_casus_belli:
            self.active_casus_belli.remove(cb_type)
        if cb_type in self.casus_belli_expiration:
            del self.casus_belli_expiration[cb_type]
    
    def has_casus_belli(self) -> bool:
        return len(self.active_casus_belli) > 0
    
    def check_expired_casus_belli(self):
        now = datetime.now()
        expired = [cb for cb, exp in self.casus_belli_expiration.items() if exp < now]
        for cb in expired:
            self.remove_casus_belli(cb)


@dataclass
class DiplomaticAction:
    action_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    actor_nation_id: str = ""
    target_nation_id: str = ""
    
    action_type: DiplomaticActionType = DiplomaticActionType.GIFT_CASH
    
    cash_amount: float = 0.0
    resource_type: Optional[str] = None
    resource_amount: float = 0.0
    tech_amount: int = 0
    land_amount: int = 0
    message: str = ""
    
    success: bool = False
    relation_impact: float = 0.0
    timestamp: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


@dataclass
class Embassy:
    embassy_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    host_nation_id: str = ""
    guest_nation_id: str = ""
    
    embassy_level: int = 1
    
    relation_bonus: float = 0.05
    spy_defense_bonus: float = 0.02
    trade_bonus: float = 0.02
    
    established_at: datetime = field(default_factory=datetime.now)
    last_upgraded_at: Optional[datetime] = None
    
    def upgrade(self):
        if self.embassy_level < 5:
            self.embassy_level += 1
            self.staff_count += 5
            self.relation_bonus += 0.05
            self.spy_defense_bonus += 0.02
            self.trade_bonus += 0.02
            self.last_upgraded_at = datetime.now()


@dataclass
class Treaty:
    treaty_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    party_a_id: str = ""
    party_b_id: str = ""
    party_a_type: str = "nation"
    party_b_type: str = "nation"
    
    treaty_type: TreatyType = TreatyType.NAP
    status: TreatyStatus = TreatyStatus.PROPOSED
    
    terms: Dict[str, float] = field(default_factory=dict)
    
    cash_transfer_a_to_b: float = 0.0
    cash_transfer_b_to_a: float = 0.0
    land_transfer_a_to_b: int = 0
    land_transfer_b_to_a: int = 0
    resource_transfer_a_to_b: Dict[str, float] = field(default_factory=dict)
    resource_transfer_b_to_a: Dict[str, float] = field(default_factory=dict)
    technology_transfer_a_to_b: int = 0
    technology_transfer_b_to_a: int = 0
    
    duration_ticks: int = 0
    expires_at: Optional[datetime] = None
    
    conditions: List[str] = field(default_factory=list)
    violation_count: int = 0
    last_violation_at: Optional[datetime] = None
    
    proposed_at: datetime = field(default_factory=datetime.now)
    activated_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    
    def is_valid(self) -> bool:
        if self.status != TreatyStatus.ACTIVE:
            return False
        
        if self.is_violated:
            return False
        
        if self.expires_at and datetime.now() > self.expires_at:
            return False
        
        return True
    
    def activate(self):
        if self.duration_ticks > 0:
            self.expires_at = datetime.now() + timedelta(seconds=self.duration_ticks * 86400)
        self.status = TreatyStatus.ACTIVE
        self.activated_at = datetime.now()
    
    def record_violation(self, violating_party: str):
        self.violation_count += 1
        self.last_violation_at = datetime.now()
        self.status = TreatyStatus.BROKEN
        self.ended_at = datetime.now()


@dataclass
class Sanction:
    sanction_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    target_nation_id: str = ""
    imposing_alliance_id: str = ""
    imposing_nation_id: str = ""
    
    sanction_type: str = "ECONOMIC"
    
    income_penalty: float = -0.10
    spy_success_bonus: float = 0.20
    military_penalty: float = -0.05
    diplomatic_penalty: float = -0.10
    technology_penalty: float = -0.05
    
    status: str = "ACTIVE"
    imposed_at: datetime = field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None
    
    reason: str = ""
    justification: str = ""
    severity: int = 1
    
    def is_valid(self) -> bool:
        if self.status != "ACTIVE":
            return False
        
        if self.expires_at and datetime.now() > self.expires_at:
            self.status = "EXPIRED"
            return False
        
        return True
    
    def lift(self):
        self.status = "LIFTED"
        self.expires_at = datetime.now()


@dataclass
class AllianceCongress:
    congress_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    member_ids: List[str] = field(default_factory=list)
    voting_weights: Dict[str, float] = field(default_factory=dict)
    active_resolutions: Dict[str, 'Resolution'] = field(default_factory=dict)
    voting_history: List[Dict[str, any]] = field(default_factory=list)
    
    current_session_start: Optional[datetime] = None
    current_session_end: Optional[datetime] = None
    
    voting_threshold: float = 0.51
    veto_power: bool = True
    veto_threshold: int = 3
    
    def start_session(self):
        self.current_session_start = datetime.now()
        self.current_session_end = None
        self.session_end = None
    
    def end_session(self):
        self.session_end = datetime.now()
    
    def update_voting_weights(self, alliance_scores: Dict[str, float]):
        total_score = sum(alliance_scores.values())
        if total_score > 0:
            for alliance_id, score in alliance_scores.items():
                if alliance_id in self.member_ids:
                    self.voting_weights[alliance_id] = score / total_score
    
    def get_voting_weight(self, alliance_id: str) -> float:
        return self.voting_weights.get(alliance_id, 0.0)


@dataclass
class WorldAssembly:
    assembly_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    member_ids: List[str] = field(default_factory=list)
    
    active_resolutions: Dict[str, 'AssemblyResolution'] = field(default_factory=dict)
    
    voting_history: List[Dict[str, str]] = field(default_factory=list)
    
    session_number: int = 0
    session_start: datetime = field(default_factory=datetime.now)
    session_end: Optional[datetime] = None
    
    voting_threshold: float = 0.51
    veto_power: bool = False
    
    def start_session(self):
        self.session_number += 1
        self.session_start = datetime.now()
        self.session_end = None
    
    def end_session(self):
        self.session_end = datetime.now()
    
    def get_voting_weight(self, nation_id: str) -> float:
        return 1.0 if nation_id in self.member_ids else 0.0


class AssemblyResolutionType(Enum):
    HUMANITARIAN_AID = "Humanitarian Aid"
    TECHNOLOGY_SHARING = "Technology Sharing"
    ENVIRONMENTAL_PROTECTION = "Environmental Protection"
    TRADE_FACILITATION = "Trade Facilitation"
    DISEASE_PREVENTION = "Disease Prevention"
    CULTURAL_EXCHANGE = "Cultural Exchange"
    INFRASTRUCTURE_FUND = "Infrastructure Development Fund"
    MEDICAL_RESEARCH = "Medical Research Grants"


class AssemblyResolutionStatus(Enum):
    PROPOSED = "Proposed"
    VOTING = "Voting"
    PASSED = "Passed"
    FAILED = "Failed"
    EXPIRED = "Expired"


class BenefitType(Enum):
    TRADE_INCOME_BOOST = "Trade Income Boost"
    CASH_INCOME_BOOST = "Cash Income Boost"
    RESOURCE_PRODUCTION_BOOST = "Resource Production Boost"
    INFRASTRUCTURE_COST_REDUCTION = "Infrastructure Cost Reduction"
    LAND_COST_REDUCTION = "Land Cost Reduction"
    CITY_COST_REDUCTION = "City Cost Reduction"
    MILITARY_EFFICIENCY_BOOST = "Military Efficiency Boost"
    DEFENSE_STRENGTH_BOOST = "Defense Strength Boost"
    ATTACK_STRENGTH_BOOST = "Attack Strength Boost"
    SPY_SUCCESS_BOOST = "Spy Success Boost"
    TECH_COST_REDUCTION = "Tech Cost Reduction"
    TECH_SPEED_BOOST = "Tech Speed Boost"
    POPULATION_GROWTH_BOOST = "Population Growth Boost"
    HAPPINESS_BOOST = "Happiness Boost"
    DISEASE_REDUCTION = "Disease Reduction"
    ENVIRONMENT_BOOST = "Environment Boost"
    TRADE_SLOT_INCREASE = "Trade Slot Increase"
    IMPORT_COST_REDUCTION = "Import Cost Reduction"
    RESOURCE_STOCKPILE_BOOST = "Resource Stockpile Boost"
    RESOURCE_COST_REDUCTION = "Resource Cost Reduction"


class DownfallType(Enum):
    TRADE_INCOME_PENALTY = "Trade Income Penalty"
    CASH_INCOME_PENALTY = "Cash Income Penalty"
    RESOURCE_PRODUCTION_PENALTY = "Resource Production Penalty"
    INFRASTRUCTURE_COST_INCREASE = "Infrastructure Cost Increase"
    LAND_COST_INCREASE = "Land Cost Increase"
    CITY_COST_INCREASE = "City Cost Increase"
    MILITARY_EFFICIENCY_PENALTY = "Military Efficiency Penalty"
    DEFENSE_STRENGTH_PENALTY = "Defense Strength Penalty"
    ATTACK_STRENGTH_PENALTY = "Attack Strength Penalty"
    SPY_SUCCESS_PENALTY = "Spy Success Penalty"
    TECH_COST_INCREASE = "Tech Cost Increase"
    TECH_SPEED_PENALTY = "Tech Speed Penalty"
    POPULATION_GROWTH_PENALTY = "Population Growth Penalty"
    HAPPINESS_PENALTY = "Happiness Penalty"
    DISEASE_INCREASE = "Disease Increase"
    ENVIRONMENT_PENALTY = "Environment Penalty"
    TRADE_SLOT_DECREASE = "Trade Slot Decrease"
    IMPORT_COST_INCREASE = "Import Cost Increase"
    RESOURCE_STOCKPILE_PENALTY = "Resource Stockpile Penalty"
    RESOURCE_COST_INCREASE = "Resource Cost Increase"


BENEFIT_BASE_DATA = {
    BenefitType.TRADE_INCOME_BOOST: {
        "name": "Trade Revenue Enhancement",
        "description": "Increases global trade income through favorable policies"
    },
    BenefitType.CASH_INCOME_BOOST: {
        "name": "Fiscal Stimulus Package",
        "description": "Boosts national treasury through tax incentives"
    },
    BenefitType.RESOURCE_PRODUCTION_BOOST: {
        "name": "Resource Efficiency Initiative",
        "description": "Improves extraction and processing efficiency"
    },
    BenefitType.INFRASTRUCTURE_COST_REDUCTION: {
        "name": "Infrastructure Investment Fund",
        "description": "Reduces costs for building and maintaining infrastructure"
    },
    BenefitType.LAND_COST_REDUCTION: {
        "name": "Land Development Grant",
        "description": "Provides subsidies for land acquisition"
    },
    BenefitType.CITY_COST_REDUCTION: {
        "name": "Urban Development Initiative",
        "description": "Supports expansion of new cities"
    },
    BenefitType.MILITARY_EFFICIENCY_BOOST: {
        "name": "Military Modernization Program",
        "description": "Enhances military training and equipment"
    },
    BenefitType.DEFENSE_STRENGTH_BOOST: {
        "name": "National Defense Enhancement",
        "description": "Strengthens defensive capabilities"
    },
    BenefitType.ATTACK_STRENGTH_BOOST: {
        "name": "Offensive Capability Expansion",
        "description": "Improves offensive military operations"
    },
    BenefitType.SPY_SUCCESS_BOOST: {
        "name": "Intelligence Agency Support",
        "description": "Enhances espionage and intelligence gathering"
    },
    BenefitType.TECH_COST_REDUCTION: {
        "name": "Research Funding Initiative",
        "description": "Provides grants for technological research"
    },
    BenefitType.TECH_SPEED_BOOST: {
        "name": "Innovation Acceleration Program",
        "description": "Accelerates technological advancement"
    },
    BenefitType.POPULATION_GROWTH_BOOST: {
        "name": "Population Growth Incentive",
        "description": "Encourages population expansion"
    },
    BenefitType.HAPPINESS_BOOST: {
        "name": "Citizen Welfare Program",
        "description": "Improves citizen satisfaction"
    },
    BenefitType.DISEASE_REDUCTION: {
        "name": "Public Health Initiative",
        "description": "Reduces disease prevalence"
    },
    BenefitType.ENVIRONMENT_BOOST: {
        "name": "Environmental Protection Act",
        "description": "Improves environmental quality"
    },
    BenefitType.TRADE_SLOT_INCREASE: {
        "name": "Trade Expansion Agreement",
        "description": "Increases capacity for trade routes"
    },
    BenefitType.IMPORT_COST_REDUCTION: {
        "name": "Import Tariff Reduction",
        "description": "Lowers costs for imported goods"
    },
    BenefitType.RESOURCE_STOCKPILE_BOOST: {
        "name": "Strategic Reserve Expansion",
        "description": "Increases storage capacity for resources"
    },
    BenefitType.RESOURCE_COST_REDUCTION: {
        "name": "Resource Acquisition Subsidy",
        "description": "Reduces costs for obtaining resources"
    }
}

DOWNFALL_BASE_DATA = {
    DownfallType.TRADE_INCOME_PENALTY: {
        "name": "Trade Revenue Reduction",
        "description": "Reduces trade income through restrictive policies"
    },
    DownfallType.CASH_INCOME_PENALTY: {
        "name": "Fiscal Austerity Measures",
        "description": "Reduces tax income through budget cuts"
    },
    DownfallType.RESOURCE_PRODUCTION_PENALTY: {
        "name": "Resource Efficiency Reduction",
        "description": "Decreases extraction and processing efficiency"
    },
    DownfallType.INFRASTRUCTURE_COST_INCREASE: {
        "name": "Infrastructure Tax Hike",
        "description": "Increases costs for building infrastructure"
    },
    DownfallType.LAND_COST_INCREASE: {
        "name": "Land Development Tax",
        "description": "Imposes taxes on land acquisition"
    },
    DownfallType.CITY_COST_INCREASE: {
        "name": "Urban Development Tax",
        "description": "Increases costs for creating new cities"
    },
    DownfallType.MILITARY_EFFICIENCY_PENALTY: {
        "name": "Military Funding Cuts",
        "description": "Reduces military readiness and capability"
    },
    DownfallType.DEFENSE_STRENGTH_PENALTY: {
        "name": "Defense Budget Reduction",
        "description": "Weakens defensive capabilities"
    },
    DownfallType.ATTACK_STRENGTH_PENALTY: {
        "name": "Offensive Capability Reduction",
        "description": "Diminishes offensive military operations"
    },
    DownfallType.SPY_SUCCESS_PENALTY: {
        "name": "Intelligence Budget Cuts",
        "description": "Reduces espionage and intelligence capabilities"
    },
    DownfallType.TECH_COST_INCREASE: {
        "name": "Research Funding Cuts",
        "description": "Reduces funding for technological research"
    },
    DownfallType.TECH_SPEED_PENALTY: {
        "name": "Innovation Stagnation Policy",
        "description": "Slows technological advancement"
    },
    DownfallType.POPULATION_GROWTH_PENALTY: {
        "name": "Population Control Measures",
        "description": "Restricts population expansion"
    },
    DownfallType.HAPPINESS_PENALTY: {
        "name": "Citizen Discontent Policy",
        "description": "Reduces citizen satisfaction"
    },
    DownfallType.DISEASE_INCREASE: {
        "name": "Public Health Funding Cuts",
        "description": "Increases disease prevalence"
    },
    DownfallType.ENVIRONMENT_PENALTY: {
        "name": "Environmental Deregulation",
        "description": "Degrades environmental quality"
    },
    DownfallType.TRADE_SLOT_DECREASE: {
        "name": "Trade Restriction Act",
        "description": "Reduces capacity for trade routes"
    },
    DownfallType.IMPORT_COST_INCREASE: {
        "name": "Import Tariff Hike",
        "description": "Increases costs for imported goods"
    },
    DownfallType.RESOURCE_STOCKPILE_PENALTY: {
        "name": "Strategic Reserve Reduction",
        "description": "Decreases storage capacity for resources"
    },
    DownfallType.RESOURCE_COST_INCREASE: {
        "name": "Resource Acquisition Tax",
        "description": "Increases costs for obtaining resources"
    }
}


@dataclass
class AssemblyResolution:
    resolution_id: str = field(default_factory=lambda: str(uuid.uuid4))
    
    resolution_type: AssemblyResolutionType = AssemblyResolutionType.HUMANITARIAN_AID
    title: str = ""
    description: str = ""
    
    proposer_id: str = ""
    proposer_type: str = "nation"
    
    status: AssemblyResolutionStatus = AssemblyResolutionStatus.PROPOSED
    
    votes_for: int = 0
    votes_against: int = 0
    votes_abstain: int = 0
    total_voters: int = 0
    
    vote_records: Dict[str, str] = field(default_factory=dict)
    
    benefits: List[Dict[str, any]] = field(default_factory=list)
    downfalls: List[Dict[str, any]] = field(default_factory=list)
    
    terms: Dict[str, float] = field(default_factory=dict)
    
    priority: int = 1
    
    proposed_at: datetime = field(default_factory=datetime.now)
    voted_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    effect_ends_at: Optional[datetime] = None
    
    def vote(self, voter_id: str, vote: str, voting_weight: float = 1.0) -> bool:
        if voter_id in self.vote_records:
            return False
        
        self.vote_records[voter_id] = vote
        
        if vote == "for":
            self.votes_for += 1
        elif vote == "against":
            self.votes_against += 1
        elif vote == "abstain":
            self.votes_abstain += 1
        
        self.total_voters += 1
        return True
    
    def calculate_result(self) -> bool:
        if self.total_voters == 0:
            return False
        
        percentage_for = self.votes_for / self.total_voters
        
        if percentage_for >= 0.51:
            self.status = AssemblyResolutionStatus.PASSED
            return True
        else:
            self.status = AssemblyResolutionStatus.FAILED
            return False


@dataclass
class GlobalEffect:
    effect_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    source_type: str = "congress"
    source_id: str = ""
    
    effect_type: str = ""
    effect_value: float = 0.0
    
    starts_at: datetime = field(default_factory=datetime.now)
    ends_at: Optional[datetime] = None
    
    target_type: str = "global"
    target_id: str = ""
    
    is_active: bool = True


@dataclass
class Resolution:
    resolution_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    resolution_type: ResolutionType = ResolutionType.SANCTION_NATION
    title: str = ""
    description: str = ""
    
    proposer_id: str = ""
    proposer_type: str = "alliance"
    
    target_id: str = ""
    target_type: str = "nation"
    
    status: ResolutionStatus = ResolutionStatus.PROPOSED
    
    votes_for: float = 0.0
    votes_against: float = 0.0
    votes_abstain: float = 0.0
    
    vote_records: Dict[str, str] = field(default_factory=dict)
    
    vetoed_by: List[str] = field(default_factory=list)
    
    benefits: List[Dict[str, any]] = field(default_factory=list)
    downfalls: List[Dict[str, any]] = field(default_factory=list)
    
    terms: Dict[str, float] = field(default_factory=dict)
    
    priority: int = 1
    
    proposed_at: datetime = field(default_factory=datetime.now)
    voted_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    effect_ends_at: Optional[datetime] = None
    
    def vote(self, voter_id: str, vote: str, voting_weight: float = 1.0) -> bool:
        if voter_id in self.vote_records:
            return False
        
        self.vote_records[voter_id] = vote
        
        if vote == "for":
            self.votes_for += voting_weight
        elif vote == "against":
            self.votes_against += voting_weight
        elif vote == "abstain":
            self.votes_abstain += voting_weight
        
        self.total_voters += 1
        return True
    
    def veto(self, voter_id: str) -> bool:
        if self.is_vetoed:
            return False
        
        self.is_vetoed = True
        self.vetoed_by = voter_id
        self.status = ResolutionStatus.VETOED
        return True
    
    def calculate_result(self, voting_threshold: float = 0.51) -> tuple[bool, str]:
        if self.is_vetoed:
            return False, "Resolution vetoed"
        
        total_votes = self.votes_for + self.votes_against
        if total_votes == 0:
            return False, "No votes cast"
        
        for_percentage = self.votes_for / total_votes
        
        if for_percentage >= voting_threshold:
            return True, "Resolution passed"
        else:
            return False, "Resolution failed"


@dataclass
class WorldWar:
    war_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    warring_alliances: List[str] = field(default_factory=list)
    supporting_alliances: Dict[str, List[str]] = field(default_factory=dict)
    
    status: str = "ACTIVE"
    started_at: datetime = field(default_factory=datetime.now)
    ended_at: Optional[datetime] = None
    
    patriotism_bonus: int = 5
    war_economy_bonus: float = 0.10
    trade_penalty: float = -0.15
    spy_defense_bonus: float = 0.10
    
    casualties: Dict[str, int] = field(default_factory=dict)
    destruction: Dict[str, float] = field(default_factory=dict)
    
    winner: Optional[str] = None
    loser: Optional[str] = None
    peace_terms: Dict[str, any] = field(default_factory=dict)
    
    def add_supporting_alliance(self, alliance_id: str, side: str):
        if side not in self.supporting_alliances:
            self.supporting_alliances[side] = []
        if alliance_id not in self.supporting_alliances[side]:
            self.supporting_alliances[side].append(alliance_id)
    
    def end_war(self, winner_alliance: str, loser_alliance: str, peace_terms: Dict[str, any]):
        self.winner = winner_alliance
        self.loser = loser_alliance
        self.peace_terms = peace_terms
        self.status = "ENDED"
        self.ended_at = datetime.now()


@dataclass
class Leaderboard:
    leaderboard_id: str = field(default_factory=lambda: str(uuid.uuid4))
    
    leaderboard_type: str = "nation_ns"
    
    entries: Dict[str, float] = field(default_factory=dict)
    
    last_updated: datetime = field(default_factory=datetime.now)
    
    def update_entry(self, entity_id: str, score: float):
        self.entries[entity_id] = score
        self.last_updated = datetime.now()
    
    def get_top_n(self, n: int = 10) -> List[tuple[str, float]]:
        sorted_entries = sorted(self.entries.items(), key=lambda x: x[1], reverse=True)
        return sorted_entries[:n]


class DiplomacySystem:
    def __init__(self):
        self.relations: Dict[str, DiplomaticRelation] = {}
        self.nation_relations: Dict[str, Dict[str, str]] = {}
        
        self.treaties: Dict[str, Treaty] = {}
        self.nation_treaties: Dict[str, List[str]] = {}
        self.alliance_treaties: Dict[str, List[str]] = {}
        
        self.sanctions: Dict[str, Sanction] = {}
        self.nation_sanctions: Dict[str, List[str]] = {}
        
        self.alliance_congress: AllianceCongress = AllianceCongress()
        self.world_assembly: WorldAssembly = WorldAssembly()
        self.resolutions: Dict[str, Resolution] = {}
        self.assembly_resolutions: Dict[str, AssemblyResolution] = {}
        self.global_effects: Dict[str, GlobalEffect] = {}
        
        self.world_wars: Dict[str, WorldWar] = {}
        self.active_world_war: Optional[WorldWar] = None
        
        self.leaderboards: Dict[str, Leaderboard] = {}
        
        self.diplomatic_actions: Dict[str, DiplomaticAction] = {}
        
        self.embassies: Dict[str, Embassy] = {}
        self.nation_embassies: Dict[str, Dict[str, str]] = {}
    
    def establish_relation(self, nation_a_id: str, nation_b_id: str) -> DiplomaticRelation:
        relation = DiplomaticRelation(
            nation_a_id=nation_a_id,
            nation_b_id=nation_b_id
        )
        
        self.relations[relation.relation_id] = relation
        
        if nation_a_id not in self.nation_relations:
            self.nation_relations[nation_a_id] = {}
        self.nation_relations[nation_a_id][nation_b_id] = relation.relation_id
        
        if nation_b_id not in self.nation_relations:
            self.nation_relations[nation_b_id] = {}
        self.nation_relations[nation_b_id][nation_a_id] = relation.relation_id
        
        return relation
    
    def get_relation(self, nation_a_id: str, nation_b_id: str) -> Optional[DiplomaticRelation]:
        if nation_a_id not in self.nation_relations:
            return None
        if nation_b_id not in self.nation_relations[nation_a_id]:
            return None
        relation_id = self.nation_relations[nation_a_id][nation_b_id]
        return self.relations.get(relation_id)
    
    def update_relation(self, nation_a_id: str, nation_b_id: str, delta: float):
        relation = self.get_relation(nation_a_id, nation_b_id)
        if relation:
            relation.update_relation(delta)
    
    def get_all_relations(self, nation_id: str) -> Dict[str, DiplomaticRelation]:
        if nation_id not in self.nation_relations:
            return {}
        relations = {}
        for other_nation_id, relation_id in self.nation_relations[nation_id].items():
            if relation_id in self.relations:
                relations[other_nation_id] = self.relations[relation_id]
        return relations
    
    def add_casus_belli(self, nation_a_id: str, nation_b_id: str, cb_type: CasusBelliType, expires_at: Optional[datetime] = None):
        relation = self.get_relation(nation_a_id, nation_b_id)
        if relation:
            relation.add_casus_belli(cb_type, expires_at)
    
    def remove_casus_belli(self, nation_a_id: str, nation_b_id: str, cb_type: CasusBelliType):
        relation = self.get_relation(nation_a_id, nation_b_id)
        if relation:
            relation.remove_casus_belli(cb_type)
    
    def has_casus_belli(self, nation_a_id: str, nation_b_id: str) -> bool:
        relation = self.get_relation(nation_a_id, nation_b_id)
        if relation:
            return relation.has_casus_belli()
        return False
    
    def perform_diplomatic_action(self, actor_nation_id: str, target_nation_id: str, action_type: DiplomaticActionType,
                                cash_amount: float = 0.0, resource_type: Optional[str] = None,
                                resource_amount: float = 0.0, technology_amount: int = 0) -> DiplomaticAction:
        action = DiplomaticAction(
            actor_nation_id=actor_nation_id,
            target_nation_id=target_nation_id,
            action_type=action_type,
            cash_amount=cash_amount,
            resource_type=resource_type,
            resource_amount=resource_amount,
            technology_amount=technology_amount
        )
        
        relation = self.get_relation(actor_nation_id, target_nation_id)
        if relation:
            if action_type == DiplomaticActionType.GIFT_CASH:
                action.relation_score_change = min(10.0, cash_amount / 100000.0)
                action.influence_gained = action.relation_score_change * 0.5
            elif action_type == DiplomaticActionType.GIFT_RESOURCE:
                action.relation_score_change = min(8.0, resource_amount / 1000.0)
                action.influence_gained = action.relation_score_change * 0.5
            elif action_type == DiplomaticActionType.GIFT_TECH:
                action.relation_score_change = min(15.0, technology_amount / 100.0)
                action.influence_gained = action.relation_score_change * 0.5
            elif action_type == DiplomaticActionType.INSULT:
                action.relation_score_change = -5.0
            elif action_type == DiplomaticActionType.PRAISE:
                action.relation_score_change = 3.0
            elif action_type == DiplomaticActionType.IMPROVE_RELATIONS:
                action.relation_score_change = 5.0
            elif action_type == DiplomaticActionType.WORSEN_RELATIONS:
                action.relation_score_change = -5.0
            
            action.success = True
            action.relation_score_change = action.relation_score_change
            relation.update_relation(action.relation_score_change)
            relation.record_event(action_type.value, action.relation_score_change)
        
        action.completed_at = datetime.now()
        self.diplomatic_actions[action.action_id] = action
        return action
    
    def establish_embassy(self, guest_nation_id: str, host_nation_id: str) -> Optional[Embassy]:
        if guest_nation_id in self.nation_embassies and host_nation_id in self.nation_embassies[guest_nation_id]:
            return None
        
        embassy = Embassy(
            guest_nation_id=guest_nation_id,
            host_nation_id=host_nation_id
        )
        
        self.embassies[embassy.embassy_id] = embassy
        
        if guest_nation_id not in self.nation_embassies:
            self.nation_embassies[guest_nation_id] = {}
        self.nation_embassies[guest_nation_id][host_nation_id] = embassy.embassy_id
        
        relation = self.get_relation(guest_nation_id, host_nation_id)
        if relation:
            relation.has_embassy_a = True
            relation.update_relation(5.0)
        
        return embassy
    
    def upgrade_embassy(self, guest_nation_id: str, host_nation_id: str) -> bool:
        if guest_nation_id not in self.nation_embassies:
            return False
        if host_nation_id not in self.nation_embassies[guest_nation_id]:
            return False
        
        embassy_id = self.nation_embassies[guest_nation_id][host_nation_id]
        embassy = self.embassies.get(embassy_id)
        if embassy:
            embassy.upgrade()
            return True
        return False
    
    def get_embassy(self, guest_nation_id: str, host_nation_id: str) -> Optional[Embassy]:
        if guest_nation_id not in self.nation_embassies:
            return None
        if host_nation_id not in self.nation_embassies[guest_nation_id]:
            return None
        
        embassy_id = self.nation_embassies[guest_nation_id][host_nation_id]
        return self.embassies.get(embassy_id)
    
    def get_all_embassies(self, nation_id: str) -> List[Embassy]:
        if nation_id not in self.nation_embassies:
            return []
        
        embassies = []
        for embassy_id in self.nation_embassies[nation_id].values():
            if embassy_id in self.embassies:
                embassies.append(self.embassies[embassy_id])
        return embassies
    
    def propose_treaty(self, party_a_id: str, party_b_id: str, treaty_type: TreatyType,
                      terms: Dict[str, float], duration_ticks: int = 0,
                      cash_transfer_a_to_b: float = 0.0, cash_transfer_b_to_a: float = 0.0,
                      land_transfer_a_to_b: int = 0, land_transfer_b_to_a: int = 0,
                      resource_transfer_a_to_b: Dict[str, float] = None, 
                      resource_transfer_b_to_a: Dict[str, float] = None,
                      technology_transfer_a_to_b: int = 0, technology_transfer_b_to_a: int = 0) -> Treaty:
        if resource_transfer_a_to_b is None:
            resource_transfer_a_to_b = {}
        if resource_transfer_b_to_a is None:
            resource_transfer_b_to_a = {}
            
        treaty = Treaty(
            party_a_id=party_a_id,
            party_b_id=party_b_id,
            treaty_type=treaty_type,
            terms=terms,
            duration_ticks=duration_ticks,
            cash_transfer_a_to_b=cash_transfer_a_to_b,
            cash_transfer_b_to_a=cash_transfer_b_to_a,
            land_transfer_a_to_b=land_transfer_a_to_b,
            land_transfer_b_to_a=land_transfer_b_to_a,
            resource_transfer_a_to_b=resource_transfer_a_to_b,
            resource_transfer_b_to_a=resource_transfer_b_to_a,
            technology_transfer_a_to_b=technology_transfer_a_to_b,
            technology_transfer_b_to_a=technology_transfer_b_to_a
        )
        
        self.treaties[treaty.treaty_id] = treaty
        
        if party_a_id not in self.nation_treaties:
            self.nation_treaties[party_a_id] = []
        self.nation_treaties[party_a_id].append(treaty.treaty_id)
        
        if party_b_id not in self.nation_treaties:
            self.nation_treaties[party_b_id] = []
        self.nation_treaties[party_b_id].append(treaty.treaty_id)
        
        return treaty
    
    def execute_treaty_transfers(self, treaty: Treaty, nation_system) -> bool:
        """Execute all transfers specified in a treaty when it is accepted/activated."""
        try:
            # Execute cash transfers
            if treaty.cash_transfer_a_to_b > 0:
                self._transfer_cash(treaty.party_a_id, treaty.party_b_id, treaty.cash_transfer_a_to_b, nation_system)
            if treaty.cash_transfer_b_to_a > 0:
                self._transfer_cash(treaty.party_b_id, treaty.party_a_id, treaty.cash_transfer_b_to_a, nation_system)
            
            # Execute land transfers
            if treaty.land_transfer_a_to_b > 0:
                self._transfer_land(treaty.party_a_id, treaty.party_b_id, treaty.land_transfer_a_to_b, nation_system)
            if treaty.land_transfer_b_to_a > 0:
                self._transfer_land(treaty.party_b_id, treaty.party_a_id, treaty.land_transfer_b_to_a, nation_system)
            
            # Execute resource transfers
            if treaty.resource_transfer_a_to_b:
                self._transfer_resources(treaty.party_a_id, treaty.party_b_id, treaty.resource_transfer_a_to_b, nation_system)
            if treaty.resource_transfer_b_to_a:
                self._transfer_resources(treaty.party_b_id, treaty.party_a_id, treaty.resource_transfer_b_to_a, nation_system)
            
            # Execute technology transfers
            if treaty.technology_transfer_a_to_b > 0:
                self._transfer_technology(treaty.party_a_id, treaty.party_b_id, treaty.technology_transfer_a_to_b, nation_system)
            if treaty.technology_transfer_b_to_a > 0:
                self._transfer_technology(treaty.party_b_id, treaty.party_a_id, treaty.technology_transfer_b_to_a, nation_system)
            
            return True
        except Exception as e:
            import logging
            logging.getLogger("Reaper.DiplomacySystem").error(f"Failed to execute treaty transfers: {e}")
            return False
    
    def _transfer_cash(self, from_nation_id: str, to_nation_id: str, amount: float, nation_system) -> bool:
        """Transfer cash between nations."""
        from_nation = nation_system.nations.get(from_nation_id)
        to_nation = nation_system.nations.get(to_nation_id)
        
        if not from_nation or not to_nation:
            return False
        
        if from_nation.cash < amount:
            return False  # Not enough cash
        
        from_nation.cash -= amount
        to_nation.cash += amount
        return True
    
    def _transfer_land(self, from_nation_id: str, to_nation_id: str, amount: int, nation_system) -> bool:
        """Transfer land between nations."""
        from_nation = nation_system.nations.get(from_nation_id)
        to_nation = nation_system.nations.get(to_nation_id)
        
        if not from_nation or not to_nation:
            return False
        
        if from_nation.land < amount:
            return False  # Not enough land
        
        from_nation.land -= amount
        to_nation.land += amount
        return True
    
    def _transfer_resources(self, from_nation_id: str, to_nation_id: str, resources: Dict[str, float], nation_system) -> bool:
        """Transfer resources between nations."""
        from_nation = nation_system.nations.get(from_nation_id)
        to_nation = nation_system.nations.get(to_nation_id)
        
        if not from_nation or not to_nation:
            return False
        
        # Transfer each resource type
        for resource_type, amount in resources.items():
            if amount <= 0:
                continue
            
            # Check if sender has enough of this resource
            if resource_type not in from_nation.owned_resources or from_nation.owned_resources[resource_type] < amount:
                continue  # Skip this resource if not enough
            
            # Transfer the resource
            from_nation.owned_resources[resource_type] -= amount
            if resource_type not in to_nation.owned_resources:
                to_nation.owned_resources[resource_type] = 0.0
            to_nation.owned_resources[resource_type] += amount
        
        return True
    
    def _transfer_technology(self, from_nation_id: str, to_nation_id: str, amount: int, nation_system) -> bool:
        """Transfer technology between nations."""
        from_nation = nation_system.nations.get(from_nation_id)
        to_nation = nation_system.nations.get(to_nation_id)
        
        if not from_nation or not to_nation:
            return False
        
        if from_nation.technology < amount:
            return False  # Not enough technology
        
        from_nation.technology -= amount
        to_nation.technology += amount
        return True
    
    def accept_treaty(self, treaty_id: str) -> bool:
        if treaty_id in self.treaties:
            treaty = self.treaties[treaty_id]
            treaty.activate()
            return True
        return False
    
    def reject_treaty(self, treaty_id: str) -> bool:
        if treaty_id in self.treaties:
            treaty = self.treaties[treaty_id]
            treaty.status = TreatyStatus.REJECTED
            return True
        return False
    
    def break_treaty(self, treaty_id: str) -> bool:
        if treaty_id in self.treaties:
            treaty = self.treaties[treaty_id]
            treaty.status = TreatyStatus.BROKEN
            treaty.ended_at = datetime.now()
            return True
        return False
    
    def record_treaty_violation(self, treaty_id: str, violating_party: str) -> bool:
        if treaty_id in self.treaties:
            treaty = self.treaties[treaty_id]
            treaty.record_violation(violating_party)
            return True
        return False
    
    def get_nation_treaties(self, nation_id: str) -> List[Treaty]:
        if nation_id not in self.nation_treaties:
            return []
        
        treaties = []
        for treaty_id in self.nation_treaties[nation_id]:
            if treaty_id in self.treaties:
                treaties.append(self.treaties[treaty_id])
        return treaties
    
    def get_alliance_treaties(self, alliance_id: str) -> List[Treaty]:
        if alliance_id not in self.alliance_treaties:
            return []
        
        treaties = []
        for treaty_id in self.alliance_treaties[alliance_id]:
            if treaty_id in self.treaties:
                treaties.append(self.treaties[treaty_id])
        return treaties
    
    def impose_sanction(self, target_nation_id: str, imposing_alliance_id: str = "",
                       imposing_nation_id: str = "", sanction_type: str = "ECONOMIC",
                       income_penalty: float = -0.10, spy_success_bonus: float = 0.20,
                       military_penalty: float = -0.05, diplomatic_penalty: float = -0.10,
                       technology_penalty: float = -0.05, duration_ticks: int = 0,
                       reason: str = "", justification: str = "", severity: int = 1) -> Sanction:
        sanction = Sanction(
            target_nation_id=target_nation_id,
            imposing_alliance_id=imposing_alliance_id,
            imposing_nation_id=imposing_nation_id,
            sanction_type=sanction_type,
            income_penalty=income_penalty,
            spy_success_bonus=spy_success_bonus,
            military_penalty=military_penalty,
            diplomatic_penalty=diplomatic_penalty,
            technology_penalty=technology_penalty,
            reason=reason,
            justification=justification,
            severity=severity
        )
        
        if severity > 1:
            sanction.income_penalty = -0.10 * severity
            sanction.spy_success_bonus = 0.20 * severity
            sanction.military_penalty = -0.05 * severity
            sanction.diplomatic_penalty = -0.10 * severity
            sanction.technology_penalty = -0.05 * severity
        
        if duration_ticks > 0:
            sanction.expires_at = datetime.now() + timedelta(seconds=duration_ticks * 86400)
        
        self.sanctions[sanction.sanction_id] = sanction
        
        if target_nation_id not in self.nation_sanctions:
            self.nation_sanctions[target_nation_id] = []
        self.nation_sanctions[target_nation_id].append(sanction.sanction_id)
        
        return sanction
    
    def lift_sanction(self, sanction_id: str) -> bool:
        if sanction_id in self.sanctions:
            sanction = self.sanctions[sanction_id]
            sanction.lift()
            return True
        return False
    
    def get_nation_sanctions(self, nation_id: str) -> List[Sanction]:
        sanction_ids = self.nation_sanctions.get(nation_id, [])
        return [self.sanctions[sanction_id] for sanction_id in sanction_ids if sanction_id in self.sanctions and self.sanctions[sanction_id].is_valid()]
    
    def calculate_sanction_effects(self, nation_id: str) -> Dict[str, float]:
        sanctions = self.get_nation_sanctions(nation_id)
        
        effects = {
            "trade_ban": False,
            "income_penalty": 0.0,
            "spy_success_bonus": 0.0,
            "military_penalty": 0.0,
            "diplomatic_penalty": 0.0,
            "technology_penalty": 0.0
        }
        
        for sanction in sanctions:
            if sanction.sanction_type == "COMPLETE":
                effects["trade_ban"] = True
            effects["income_penalty"] += sanction.income_penalty
            effects["spy_success_bonus"] += sanction.spy_success_bonus
            effects["military_penalty"] += sanction.military_penalty
            effects["diplomatic_penalty"] += sanction.diplomatic_penalty
            effects["technology_penalty"] += sanction.technology_penalty
        
        return effects
    
    def propose_resolution(self, proposer_id: str, proposer_type: str, resolution_type: ResolutionType, title: str,
                         description: str, target_id: str = "",
                         target_type: str = "", terms: Dict[str, float] = None,
                         priority: int = 1, benefits: List[Dict[str, any]] = None,
                         downfalls: List[Dict[str, any]] = None) -> Resolution:
        resolution = Resolution(
            proposer_id=proposer_id,
            proposer_type=proposer_type,
            resolution_type=resolution_type,
            title=title,
            description=description,
            target_id=target_id,
            target_type=target_type,
            terms=terms or {},
            priority=priority,
            benefits=benefits or [],
            downfalls=downfalls or []
        )
        
        self.resolutions[resolution.resolution_id] = resolution
        self.alliance_congress.active_resolutions[resolution.resolution_id] = resolution
        
        return resolution
    
    def vote_on_resolution(self, resolution_id: str, voter_id: str, vote: str) -> bool:
        if resolution_id not in self.resolutions:
            return False
        
        resolution = self.resolutions[resolution_id]
        
        voting_weight = self.alliance_congress.get_voting_weight(voter_id)
        if voting_weight == 0:
            voting_weight = 1.0
        
        return resolution.vote(voter_id, vote, voting_weight)
    
    def veto_resolution(self, resolution_id: str, voter_id: str) -> bool:
        if resolution_id not in self.resolutions:
            return False
        
        resolution = self.resolutions[resolution_id]
        return resolution.veto(voter_id)
    
    def finalize_resolution(self, resolution_id: str) -> tuple[bool, str]:
        if resolution_id not in self.resolutions:
            return False, "Resolution not found"
        
        resolution = self.resolutions[resolution_id]
        resolution.status = ResolutionStatus.VOTING
        resolution.voted_at = datetime.now()
        
        passed, result = resolution.calculate_result(self.alliance_congress.voting_threshold)
        
        if passed:
            resolution.status = ResolutionStatus.PASSED
            self._apply_resolution_effects(resolution)
        else:
            resolution.status = ResolutionStatus.FAILED
        
        return passed, result
    
    def update_voting_weights(self, alliance_scores: Dict[str, float]):
        self.alliance_congress.update_voting_weights(alliance_scores)
    
    def propose_assembly_resolution(self, proposer_id: str, proposer_type: str,
                                   resolution_type: AssemblyResolutionType, title: str,
                                   description: str, terms: Dict[str, float] = None,
                                   priority: int = 1, benefits: List[Dict[str, any]] = None,
                                   downfalls: List[Dict[str, any]] = None,
                                   duration_ticks: int = 90) -> AssemblyResolution:
        resolution = AssemblyResolution(
            proposer_id=proposer_id,
            proposer_type=proposer_type,
            resolution_type=resolution_type,
            title=title,
            description=description,
            terms=terms or {},
            priority=priority,
            benefits=benefits or [],
            downfalls=downfalls or [],
            effect_ends_at=datetime.now() + timedelta(seconds=duration_ticks * 86400)
        )
        
        self.assembly_resolutions[resolution.resolution_id] = resolution
        self.world_assembly.active_resolutions[resolution.resolution_id] = resolution
        
        return resolution
    
    def vote_on_assembly_resolution(self, resolution_id: str, voter_id: str, vote: str) -> bool:
        if resolution_id not in self.assembly_resolutions:
            return False
        
        resolution = self.assembly_resolutions[resolution_id]
        
        voting_weight = self.world_assembly.get_voting_weight(voter_id)
        if voting_weight == 0:
            return False
        
        return resolution.vote(voter_id, vote, voting_weight)
    
    def finalize_assembly_resolution(self, resolution_id: str) -> tuple[bool, str]:
        if resolution_id not in self.assembly_resolutions:
            return False, "Resolution not found"
        
        resolution = self.assembly_resolutions[resolution_id]
        resolution.status = AssemblyResolutionStatus.VOTING
        resolution.voted_at = datetime.now()
        
        passed = resolution.calculate_result()
        
        if passed:
            resolution.status = AssemblyResolutionStatus.PASSED
            self._apply_assembly_resolution_effects(resolution)
        else:
            resolution.status = AssemblyResolutionStatus.FAILED
        
        self.world_assembly.active_resolutions.pop(resolution_id, None)
        return passed, "Resolution passed" if passed else "Resolution failed"
    
    def _apply_assembly_resolution_effects(self, resolution: AssemblyResolution):
        effect = GlobalEffect(
            source_type="assembly",
            source_id=resolution.resolution_id,
            effect_type=resolution.resolution_type.value,
            effect_value=1.0,
            ends_at=resolution.effect_ends_at,
            target_type="global"
        )
        
        self.global_effects[effect.effect_id] = effect
        
        for downfall in resolution.downfalls:
            effect = GlobalEffect(
                source_type="assembly",
                source_id=resolution.resolution_id,
                effect_type=downfall.get("type", ""),
                effect_value=downfall.get("magnitude", 0.0),
                ends_at=resolution.effect_ends_at,
                target_type="global"
            )
            self.global_effects[effect.effect_id] = effect
    
    def get_active_effects(self, nation_id: str = "") -> List[GlobalEffect]:
        current_time = datetime.now()
        active_effects = []
        
        for effect in self.global_effects.values():
            if effect.is_active and (effect.ends_at is None or effect.ends_at > current_time):
                if effect.target_type == "global" or effect.target_id == nation_id:
                    active_effects.append(effect)
        
        return active_effects
    
    def _apply_resolution_effects(self, resolution: Resolution):
        if resolution.resolution_type == ResolutionType.SANCTION_NATION:
            self.impose_sanction(
                target_nation_id=resolution.target_id,
                imposing_alliance_id=resolution.proposer_id,
                reason=f"World Congress resolution: {resolution.title}",
                sanction_type="ECONOMIC",
                severity=2
            )
        
        elif resolution.resolution_type == ResolutionType.ECONOMIC_SANCTIONS:
            self.impose_sanction(
                target_nation_id=resolution.target_id,
                imposing_alliance_id=resolution.proposer_id,
                reason=f"World Congress resolution: {resolution.title}",
                sanction_type="ECONOMIC",
                severity=3
            )
        
        elif resolution.resolution_type == ResolutionType.MILITARY_SANCTIONS:
            self.impose_sanction(
                target_nation_id=resolution.target_id,
                imposing_alliance_id=resolution.proposer_id,
                reason=f"World Congress resolution: {resolution.title}",
                sanction_type="MILITARY",
                severity=3
            )
        
        elif resolution.resolution_type == ResolutionType.DIPLOMATIC_ISOLATION:
            self.impose_sanction(
                target_nation_id=resolution.target_id,
                imposing_alliance_id=resolution.proposer_id,
                reason=f"World Congress resolution: {resolution.title}",
                sanction_type="DIPLOMATIC",
                severity=5
            )
        
        elif resolution.resolution_type == ResolutionType.TRADE_EMBARGO:
            self.impose_sanction(
                target_nation_id=resolution.target_id,
                imposing_alliance_id=resolution.proposer_id,
                reason=f"World Congress resolution: {resolution.title}",
                sanction_type="TRADE",
                severity=4
            )
        
        elif resolution.resolution_type == ResolutionType.DECLARE_GLOBAL_WAR:
            self._declare_world_war(resolution.target_id)
        
        elif resolution.resolution_type == ResolutionType.BAN_WMDS:
            self._apply_wmd_ban(resolution)
        
        elif resolution.resolution_type == ResolutionType.LIFT_SANCTIONS:
            sanctions = self.get_nation_sanctions(resolution.target_id)
            for sanction in sanctions:
                self.lift_sanction(sanction.sanction_id)
        
        elif resolution.resolution_type == ResolutionType.WMD_BAN:
            self._apply_wmd_ban()
        
        for benefit in resolution.benefits:
            effect = GlobalEffect(
                source_type="congress",
                source_id=resolution.resolution_id,
                effect_type=benefit.get("type", ""),
                effect_value=benefit.get("magnitude", 0.0),
                target_type="global"
            )
            self.global_effects[effect.effect_id] = effect
        
        for downfall in resolution.downfalls:
            effect = GlobalEffect(
                source_type="congress",
                source_id=resolution.resolution_id,
                effect_type=downfall.get("type", ""),
                effect_value=downfall.get("magnitude", 0.0),
                target_type="global"
            )
            self.global_effects[effect.effect_id] = effect
    
    def _declare_world_war(self, target_alliance_id: str):
        if self.active_world_war:
            return
        
        world_war = WorldWar(
            alliance_b_id=target_alliance_id
        )
        
        self.world_wars[world_war.war_id] = world_war
        self.active_world_war = world_war
    
    def _apply_wmd_ban(self, resolution: Resolution):
        # WMD ban would persist via EmpireDB when integrated
        pass
    
    def check_wmd_ban_violations(self, current_tick: int):
        # WMD ban violation checking requires DB integration
        pass
    
    def end_world_war(self, winner_alliance: str, loser_alliance: str, peace_terms: Dict[str, any]):
        if self.active_world_war:
            self.active_world_war.end_war(winner_alliance, loser_alliance, peace_terms)
            self.active_world_war = None
    
    def update_leaderboard(self, leaderboard_type: str, entries: List[Dict[str, float]]):
        if leaderboard_type not in self.leaderboards:
            self.leaderboards[leaderboard_type] = Leaderboard(leaderboard_type=leaderboard_type)
        
        self.leaderboards[leaderboard_type].update_entries(entries)
    
    def get_leaderboard(self, leaderboard_type: str, top_n: int = 10) -> List[Dict[str, float]]:
        if leaderboard_type in self.leaderboards:
            return self.leaderboards[leaderboard_type].get_top_n(top_n)
        return []
    
    def cleanup_expired_effects(self, all_nations: dict):
        current_time = datetime.now()
        
        for nation_id, nation_data in all_nations.items():
            if hasattr(nation_data, 'active_assembly_effects'):
                nation_data.active_assembly_effects = [
                    effect_id for effect_id in nation_data.active_assembly_effects
                    if effect_id in self.global_effects and 
                    (self.global_effects[effect_id].ends_at is None or 
                     self.global_effects[effect_id].ends_at > current_time)
                ]
            
            if hasattr(nation_data, 'active_congress_effects'):
                nation_data.active_congress_effects = [
                    effect_id for effect_id in nation_data.active_congress_effects
                    if effect_id in self.global_effects and 
                    (self.global_effects[effect_id].ends_at is None or 
                     self.global_effects[effect_id].ends_at > current_time)
                ]
    
    def process_session_management(self, current_tick: int):
        if current_tick % 30 == 0:
            self.alliance_congress.start_session()
        
        if (current_tick + 7) % 15 == 0:
            self.world_assembly.start_session()
    
    def tick(self, current_tick: int):
        for treaty in self.treaties.values():
            if not treaty.is_valid():
                if treaty.treaty_id in self.treaties:
                    del self.treaties[treaty.treaty_id]
        
        for sanction in self.sanctions.values():
            if not sanction.is_valid():
                sanction.lift()
        
        self.check_wmd_ban_violations(current_tick)
        self.process_session_management(current_tick)
        
        if self.active_world_war:
            self.active_world_war.current_tick = current_tick
        
        for relation in self.relations.values():
            relation.check_expired_casus_belli()
        
        for resolution in self.resolutions.values():
            if resolution.expires_at and datetime.now() > resolution.expires_at:
                resolution.status = ResolutionStatus.WITHDRAWN


diplomacy_system = DiplomacySystem()

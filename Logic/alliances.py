"""
Alliance System for Sovereign Nation Game

This module defines the alliance system including alliance creation,
management, treaties, and bonuses.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Any
from enum import Enum, Flag, auto
from datetime import datetime, timedelta
import uuid

from .resources import ResourceType


class AllianceRole(Enum):
    """Base roles within an alliance."""
    LEADER = "Leader"
    OFFICER = "Officer"
    MEMBER = "Member"
    APPLICANT = "Applicant"


class AlliancePermission(Flag):
    """Permissions for alliance roles."""
    # Alliance Management
    EDIT_ALLIANCE_INFO = auto()
    EDIT_ALLIANCE_SETTINGS = auto()
    EDIT_ALLIANCE_REQUIREMENTS = auto()
    DELETE_ALLIANCE = auto()
    
    # Member Management
    INVITE_MEMBERS = auto()
    KICK_MEMBERS = auto()
    ACCEPT_APPLICATIONS = auto()
    REJECT_APPLICATIONS = auto()
    PROMOTE_MEMBERS = auto()
    DEMOTE_MEMBERS = auto()
    TRANSFER_LEADERSHIP = auto()
    
    # Bank Management
    VIEW_BANK = auto()
    DEPOSIT_TO_BANK = auto()
    WITHDRAW_FROM_BANK = auto()
    EDIT_BANK_SETTINGS = auto()
    
    # Treaty Management
    PROPOSE_TREATIES = auto()
    ACCEPT_TREATIES = auto()
    REJECT_TREATIES = auto()
    BREAK_TREATIES = auto()
    
    # Diplomacy
    DECLARE_WAR = auto()
    MAKE_PEACE = auto()
    SANCTION_NATIONS = auto()
    
    # Communication
    SEND_ALLIANCE_MESSAGE = auto()
    EDIT_ALLIANCE_DESCRIPTION = auto()
    
    # Intelligence
    VIEW_MEMBER_STATS = auto()
    VIEW_ALLIANCE_STATS = auto()
    
    # All permissions (for leader)
    ALL = (
        EDIT_ALLIANCE_INFO | EDIT_ALLIANCE_SETTINGS | EDIT_ALLIANCE_REQUIREMENTS | DELETE_ALLIANCE |
        INVITE_MEMBERS | KICK_MEMBERS | ACCEPT_APPLICATIONS | REJECT_APPLICATIONS |
        PROMOTE_MEMBERS | DEMOTE_MEMBERS | TRANSFER_LEADERSHIP |
        VIEW_BANK | DEPOSIT_TO_BANK | WITHDRAW_FROM_BANK | EDIT_BANK_SETTINGS |
        PROPOSE_TREATIES | ACCEPT_TREATIES | REJECT_TREATIES | BREAK_TREATIES |
        DECLARE_WAR | MAKE_PEACE | SANCTION_NATIONS |
        SEND_ALLIANCE_MESSAGE | EDIT_ALLIANCE_DESCRIPTION |
        VIEW_MEMBER_STATS | VIEW_ALLIANCE_STATS
    )


class TreatyType(Enum):
    """Types of alliance treaties."""
    NAP = "Non-Aggression Pact"  # NAP
    MDP = "Mutual Defense Pact"  # MDP
    ODP = "Optional Defense Pact"  # ODP
    PROTECTORATE = "Protectorate"


class AllianceWarStatus(Enum):
    """Status of an alliance war."""
    ACTIVE = "Active"
    ENDED = "Ended"
    EXPIRED = "Expired"
    CANCELLED = "Cancelled"


class VoteStatus(Enum):
    """Status of an alliance vote."""
    PENDING = "Pending"
    PASSED = "Passed"
    FAILED = "Failed"
    CANCELLED = "Cancelled"
    EXECUTED = "Executed"
    VETOED = "Vetoed"


@dataclass
class AllianceVotingSettings:
    """Settings for alliance voting system."""
    enable_voting: bool = True
    vote_duration_hours: int = 72  # 3 days default
    required_percentage: float = 0.51  # 51% default
    minimum_voters: int = 3
    leader_veto_power: bool = False  # Leader can veto passed votes
    officer_vote_weight: float = 1.5  # Officers' votes count 1.5x
    member_vote_weight: float = 1.0
    auto_approve_trivial_actions: bool = True  # Small actions don't need votes


@dataclass
class AllianceVote:
    """Represents a vote within an alliance."""

    vote_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    alliance_id: str = ""

    # Vote topic
    action_type: str = ""  # "DECLARE_WAR", "PEACE_TREATY", "WONDER_BUILD", etc.
    action_data: Dict[str, Any] = field(default_factory=dict)

    # Vote status
    status: VoteStatus = VoteStatus.PENDING
    proposed_by: str = ""
    proposed_at: datetime = field(default_factory=datetime.now)
    voting_ends_at: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=3))

    # Vote results
    votes_for: List[str] = field(default_factory=list)
    votes_against: List[str] = field(default_factory=list)
    votes_abstain: List[str] = field(default_factory=list)

    # Vote requirements
    required_percentage: float = 0.51  # 51% to pass
    minimum_voters: int = 3  # Minimum number of voters required

    # Vote weights (for weighted voting)
    vote_weights: Dict[str, float] = field(default_factory=dict)  # nation_id -> weight

    # Veto
    vetoed_by: Optional[str] = None  # nation_id who vetoed

    def is_passed(self) -> bool:
        """Check if the vote has passed."""
        if self.status != VoteStatus.PENDING:
            return self.status == VoteStatus.PASSED

        total_votes = len(self.votes_for) + len(self.votes_against)
        if total_votes < self.minimum_voters:
            return False

        return (len(self.votes_for) / total_votes) >= self.required_percentage

    def is_expired(self) -> bool:
        """Check if the voting period has expired."""
        return datetime.now() >= self.voting_ends_at

    def get_vote_count(self, nation_id: str, weight: float = 1.0) -> float:
        """Get the weighted vote count for a nation."""
        if nation_id in self.votes_for:
            return 1.0 * weight
        elif nation_id in self.votes_against:
            return -1.0 * weight
        elif nation_id in self.votes_abstain:
            return 0.0
        return 0.0

    def get_total_weighted_votes(self) -> Dict[str, float]:
        """Calculate total weighted votes."""
        total_for = 0.0
        total_against = 0.0
        total_abstain = 0.0

        for nation_id in self.votes_for:
            weight = self.vote_weights.get(nation_id, 1.0)
            total_for += weight

        for nation_id in self.votes_against:
            weight = self.vote_weights.get(nation_id, 1.0)
            total_against += weight

        for nation_id in self.votes_abstain:
            weight = self.vote_weights.get(nation_id, 1.0)
            total_abstain += weight

        return {
            "for": total_for,
            "against": total_against,
            "abstain": total_abstain
        }

    def get_result(self) -> Dict[str, Any]:
        """Get the vote result."""
        weighted = self.get_total_weighted_votes()
        total = weighted["for"] + weighted["against"] + weighted["abstain"]

        if total < self.minimum_voters:
            return {
                "passed": False,
                "reason": "Insufficient voters",
                "for": weighted["for"],
                "against": weighted["against"],
                "abstain": weighted["abstain"],
                "total": total,
                "percentage": 0.0
            }

        if weighted["against"] + weighted["abstain"] == 0:
            percentage = 1.0
        else:
            percentage = weighted["for"] / (weighted["for"] + weighted["against"])

        passed = percentage >= self.required_percentage

        return {
            "passed": passed,
            "reason": "Vote passed" if passed else "Vote failed",
            "for": weighted["for"],
            "against": weighted["against"],
            "abstain": weighted["abstain"],
            "total": total,
            "percentage": percentage
        }


@dataclass
class AllianceWarStatistics:
    """Statistics for an alliance in an alliance war."""
    alliance_id: str = ""
    
    # Damage statistics
    total_damage_dealt: float = 0.0
    total_infrastructure_destroyed: float = 0.0
    total_land_destroyed: float = 0.0
    
    # Loot statistics
    total_loot_stolen: float = 0.0
    total_cash_looted: float = 0.0
    total_resources_looted: Dict[ResourceType, float] = field(default_factory=dict)
    
    # War statistics
    wars_fought: int = 0
    wars_won: int = 0
    wars_lost: int = 0


@dataclass
class AllianceWar:
    """Represents a war between two alliances."""
    
    war_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    # Warring alliances
    alliance_a_id: str = ""
    alliance_b_id: str = ""
    
    # War status
    status: AllianceWarStatus = AllianceWarStatus.ACTIVE
    started_at: datetime = field(default_factory=datetime.now)
    ends_at: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=30))
    ended_at: Optional[datetime] = None
    
    # Bonuses (configurable)
    damage_multiplier: float = 1.5  # 50% increased damage
    loot_multiplier: float = 2.0  # 100% increased loot
    infrastructure_damage_bonus: float = 0.25  # 25% additional infra damage
    land_damage_bonus: float = 0.25  # 25% additional land damage
    
    # Statistics
    alliance_a_statistics: AllianceWarStatistics = field(default_factory=AllianceWarStatistics)
    alliance_b_statistics: AllianceWarStatistics = field(default_factory=AllianceWarStatistics)
    
    # Peace terms (if applicable)
    peace_terms: Dict[str, Any] = field(default_factory=dict)
    
    def is_active(self) -> bool:
        """Check if the war is currently active."""
        return self.status == AllianceWarStatus.ACTIVE and datetime.now() < self.ends_at
    
    def is_expired(self) -> bool:
        """Check if the war has expired."""
        return datetime.now() >= self.ends_at
    
    def extend(self, days: int = 30) -> bool:
        """Extend the war duration."""
        if not self.is_active():
            return False
        self.ends_at = self.ends_at + timedelta(days=days)
        return True
    
    def end(self, reason: str = "Peace Treaty") -> bool:
        """End the war."""
        if not self.is_active():
            return False
        self.status = AllianceWarStatus.ENDED
        self.ended_at = datetime.now()
        self.peace_terms["reason"] = reason
        return True


@dataclass
class CustomRole:
    """Custom role with specific permissions."""
    
    role_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    role_name: str = ""
    description: str = ""
    
    # Role permissions
    permissions: AlliancePermission = AlliancePermission(0)
    
    # Role settings
    can_be_assigned: bool = True
    max_members: int = 0  # 0 = unlimited
    priority: int = 0  # Higher priority roles appear first in UI
    
    # Timestamp
    created_at: datetime = field(default_factory=datetime.now)
    
    def has_permission(self, permission: AlliancePermission) -> bool:
        """Check if role has a specific permission."""
        return (self.permissions & permission) == permission
    
    def add_permission(self, permission: AlliancePermission):
        """Add a permission to the role."""
        self.permissions |= permission
    
    def remove_permission(self, permission: AlliancePermission):
        """Remove a permission from the role."""
        self.permissions &= ~permission


@dataclass
class AllianceBank:
    """Alliance bank for shared resources and cash."""
    
    alliance_id: str = ""
    
    # Bank holdings
    cash: float = 0.0
    resources: Dict[ResourceType, float] = field(default_factory=dict)
    
    # Bank settings
    daily_withdrawal_limit: float = 0.0  # 0 = unlimited
    member_deposit_minimum: float = 0.0
    tax_rate: float = 0.0  # Optional alliance tax on member income
    
    # Spending permissions (nation_id -> can_spend_alliance_funds)
    spending_permissions: Dict[str, bool] = field(default_factory=dict)
    
    # Transaction history
    deposit_history: List[Dict[str, float]] = field(default_factory=list)
    withdrawal_history: List[Dict[str, float]] = field(default_factory=list)
    spending_history: List[Dict[str, Any]] = field(default_factory=list)  # For monument/treaty spending
    
    def deposit_cash(self, nation_id: str, amount: float) -> bool:
        """Deposit cash into alliance bank."""
        if amount <= 0:
            return False
        
        if amount < self.member_deposit_minimum:
            return False
        
        self.cash += amount
        self.deposit_history.append({
            "nation_id": nation_id,
            "type": "cash",
            "amount": amount,
            "timestamp": datetime.now()
        })
        return True
    
    def withdraw_cash(self, nation_id: str, amount: float, daily_withdrawn: float = 0.0) -> bool:
        """Withdraw cash from alliance bank."""
        if amount <= 0 or amount > self.cash:
            return False
        
        if self.daily_withdrawal_limit > 0 and (daily_withdrawn + amount) > self.daily_withdrawal_limit:
            return False
        
        self.cash -= amount
        self.withdrawal_history.append({
            "nation_id": nation_id,
            "type": "cash",
            "amount": amount,
            "timestamp": datetime.now()
        })
        return True
    
    def deposit_resource(self, nation_id: str, resource_type: ResourceType, amount: float) -> bool:
        """Deposit resource into alliance bank."""
        if amount <= 0:
            return False
        
        if resource_type not in self.resources:
            self.resources[resource_type] = 0.0
        
        self.resources[resource_type] += amount
        self.deposit_history.append({
            "nation_id": nation_id,
            "type": "resource",
            "resource": resource_type.value,
            "amount": amount,
            "timestamp": datetime.now()
        })
        return True
    
    def withdraw_resource(self, nation_id: str, resource_type: ResourceType, amount: float) -> bool:
        """Withdraw resource from alliance bank."""
        if amount <= 0:
            return False
        
        if resource_type not in self.resources or self.resources[resource_type] < amount:
            return False
        
        self.resources[resource_type] -= amount
        self.withdrawal_history.append({
            "nation_id": nation_id,
            "type": "resource",
            "resource": resource_type.value,
            "amount": amount,
            "timestamp": datetime.now()
        })
        return True
    
    def grant_spending_permission(self, nation_id: str) -> bool:
        """Grant permission for a nation to spend alliance funds."""
        self.spending_permissions[nation_id] = True
        return True
    
    def revoke_spending_permission(self, nation_id: str) -> bool:
        """Revoke permission for a nation to spend alliance funds."""
        if nation_id in self.spending_permissions:
            del self.spending_permissions[nation_id]
        return True
    
    def has_spending_permission(self, nation_id: str) -> bool:
        """Check if a nation has permission to spend alliance funds."""
        return self.spending_permissions.get(nation_id, False)
    
    def spend_on_monument(self, nation_id: str, monument_id: str, cash_amount: float,
                         resources: Dict[ResourceType, float],
                         holdings_cash: float, holdings_resources: Dict[ResourceType, float]) -> bool:
        """Spend alliance funds on monument construction."""
        if not self.has_spending_permission(nation_id):
            return False

        # Check if enough cash in holdings
        if cash_amount > 0 and cash_amount > holdings_cash:
            return False

        # Check if enough resources in holdings
        for resource_type, amount in resources.items():
            if resource_type not in holdings_resources or holdings_resources[resource_type] < amount:
                return False

        # Deduct cash from holdings (caller will update holdings)
        # Deduct resources from holdings (caller will update holdings)

        # Record spending
        self.spending_history.append({
            "nation_id": nation_id,
            "type": "monument",
            "monument_id": monument_id,
            "cash_amount": cash_amount,
            "resources": {rt.value: amt for rt, amt in resources.items()},
            "timestamp": datetime.now()
        })

        return True

    def spend_on_treaty(self, nation_id: str, treaty_id: str, cash_amount: float,
                       resources: Dict[ResourceType, float],
                       holdings_cash: float, holdings_resources: Dict[ResourceType, float]) -> bool:
        """Spend alliance funds on treaty costs."""
        if not self.has_spending_permission(nation_id):
            return False

        # Check if enough cash in holdings
        if cash_amount > 0 and cash_amount > holdings_cash:
            return False

        # Check if enough resources in holdings
        for resource_type, amount in resources.items():
            if resource_type not in holdings_resources or holdings_resources[resource_type] < amount:
                return False

        # Deduct cash from holdings (caller will update holdings)
        # Deduct resources from holdings (caller will update holdings)

        # Record spending
        self.spending_history.append({
            "nation_id": nation_id,
            "type": "treaty",
            "treaty_id": treaty_id,
            "cash_amount": cash_amount,
            "resources": {rt.value: amt for rt, amt in resources.items()},
            "timestamp": datetime.now()
        })

        return True


@dataclass
class Treaty:
    """Represents a treaty between alliances."""
    
    treaty_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    alliance_a_id: str = ""
    alliance_b_id: str = ""
    
    treaty_type: TreatyType = TreatyType.NAP
    
    # Treaty status
    is_active: bool = True
    is_broken: bool = False
    
    # Treaty terms
    terms: Dict[str, float] = field(default_factory=dict)
    
    # Timestamp
    created_at: datetime = field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None
    
    def is_valid(self) -> bool:
        """Check if treaty is still valid."""
        if not self.is_active or self.is_broken:
            return False
        
        if self.expires_at and datetime.now() > self.expires_at:
            return False
        
        return True


@dataclass
class Alliance:
    """Represents an alliance."""
    
    alliance_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    # Alliance identity
    name: str = ""
    acronym: str = ""
    color: str = ""
    flag: str = ""
    description: str = ""
    
    # Alliance members
    leader_id: str = ""
    officer_ids: List[str] = field(default_factory=list)
    member_ids: List[str] = field(default_factory=list)
    applicant_ids: List[str] = field(default_factory=list)
    
    # Custom roles (role_id -> CustomRole)
    custom_roles: Dict[str, CustomRole] = field(default_factory=dict)
    
    # Member role assignments (nation_id -> role_id or AllianceRole)
    member_role_assignments: Dict[str, str] = field(default_factory=dict)  # nation_id -> role_id or "LEADER"/"OFFICER"/"MEMBER"
    
    # Alliance settings
    membership_requirements: Dict[str, str] = field(default_factory=dict)
    is_public: bool = True
    max_members: int = 50
    min_ns_requirement: float = 0.0
    min_infrastructure_requirement: int = 0
    require_application: bool = True
    
    # Alliance bank
    bank: AllianceBank = field(default_factory=AllianceBank)
    
    # Alliance holdings (cash + resources from taxes and donations)
    holdings_cash: float = 0.0
    holdings_resources: Dict[ResourceType, float] = field(default_factory=dict)
    
    # Alliance tax collection
    tax_collection_history: List[Dict[str, Any]] = field(default_factory=list)
    
    # Member spending permissions (nation_id -> can_spend_alliance_funds)
    member_spending_permissions: Dict[str, bool] = field(default_factory=dict)
    
    # Alliance treaties
    treaties: Dict[str, Treaty] = field(default_factory=dict)
    
    # Alliance monuments (monument_id -> AllianceMonument)
    monuments: Dict[str, Any] = field(default_factory=dict)

    # Alliance wars (war_id -> AllianceWar)
    alliance_wars: Dict[str, AllianceWar] = field(default_factory=dict)
    active_alliance_war_ids: List[str] = field(default_factory=list)

    # Alliance voting system
    voting_settings: AllianceVotingSettings = field(default_factory=AllianceVotingSettings)
    active_votes: Dict[str, AllianceVote] = field(default_factory=dict)  # vote_id -> AllianceVote
    vote_history: List[AllianceVote] = field(default_factory=list)

    # Alliance stats
    alliance_score: float = 0.0  # Sum of member NS scores
    member_count: int = 0
    
    # Alliance activity
    last_activity: datetime = field(default_factory=datetime.now)
    message_board: List[Dict[str, str]] = field(default_factory=list)
    
    # Creation timestamp
    created_at: datetime = field(default_factory=datetime.now)
    
    def __post_init__(self):
        """Initialize alliance bank with alliance ID and calculate member count."""
        self.bank.alliance_id = self.alliance_id
        # Calculate initial member count
        self.member_count = len(self.member_ids) + (1 if self.leader_id else 0) + len(self.officer_ids)
    
    # ROLE MANAGEMENT
    
    def get_default_permissions(self, role: AllianceRole) -> AlliancePermission:
        """Get default permissions for a base role."""
        if role == AllianceRole.LEADER:
            return AlliancePermission.ALL
        elif role == AllianceRole.OFFICER:
            return (
                AlliancePermission.INVITE_MEMBERS |
                AlliancePermission.ACCEPT_APPLICATIONS |
                AlliancePermission.REJECT_APPLICATIONS |
                AlliancePermission.VIEW_BANK |
                AlliancePermission.DEPOSIT_TO_BANK |
                AlliancePermission.PROPOSE_TREATIES |
                AlliancePermission.DECLARE_WAR |
                AlliancePermission.SEND_ALLIANCE_MESSAGE |
                AlliancePermission.EDIT_ALLIANCE_DESCRIPTION |
                AlliancePermission.VIEW_MEMBER_STATS |
                AlliancePermission.VIEW_ALLIANCE_STATS
            )
        elif role == AllianceRole.MEMBER:
            return (
                AlliancePermission.VIEW_BANK |
                AlliancePermission.DEPOSIT_TO_BANK |
                AlliancePermission.SEND_ALLIANCE_MESSAGE |
                AlliancePermission.VIEW_MEMBER_STATS |
                AlliancePermission.VIEW_ALLIANCE_STATS
            )
        return AlliancePermission(0)
    
    def create_custom_role(self, role_name: str, description: str, permissions: AlliancePermission,
                          max_members: int = 0, priority: int = 0) -> CustomRole:
        """Create a new custom role."""
        custom_role = CustomRole(
            role_name=role_name,
            description=description,
            permissions=permissions,
            max_members=max_members,
            priority=priority
        )
        self.custom_roles[custom_role.role_id] = custom_role
        return custom_role
    
    def delete_custom_role(self, role_id: str) -> bool:
        """Delete a custom role."""
        if role_id in self.custom_roles:
            # Reassign all members with this role to MEMBER
            for nation_id, assigned_role in self.member_role_assignments.items():
                if assigned_role == role_id:
                    self.member_role_assignments[nation_id] = "MEMBER"
            
            del self.custom_roles[role_id]
            return True
        return False
    
    def assign_role(self, nation_id: str, role_id: str) -> bool:
        """Assign a custom role to a member."""
        if role_id not in self.custom_roles:
            return False
        
        custom_role = self.custom_roles[role_id]
        
        if not custom_role.can_be_assigned:
            return False
        
        # Check max members limit
        if custom_role.max_members > 0:
            current_count = sum(1 for assigned in self.member_role_assignments.values() if assigned == role_id)
            if current_count >= custom_role.max_members:
                return False
        
        self.member_role_assignments[nation_id] = role_id
        return True
    
    def remove_role_assignment(self, nation_id: str) -> bool:
        """Remove custom role assignment from a member (reverts to MEMBER)."""
        if nation_id in self.member_role_assignments:
            self.member_role_assignments[nation_id] = "MEMBER"
            return True
        return False
    
    def get_member_permissions(self, nation_id: str) -> AlliancePermission:
        """Get permissions for a nation based on their role."""
        role = self.get_role(nation_id)
        
        if role == AllianceRole.LEADER:
            return self.get_default_permissions(AllianceRole.LEADER)
        elif role == AllianceRole.OFFICER:
            return self.get_default_permissions(AllianceRole.OFFICER)
        elif role == AllianceRole.MEMBER:
            return self.get_default_permissions(AllianceRole.MEMBER)
        
        # Check for custom role
        if nation_id in self.member_role_assignments:
            role_id = self.member_role_assignments[nation_id]
            if role_id in self.custom_roles:
                return self.custom_roles[role_id].permissions
        
        return AlliancePermission(0)
    
    def has_permission(self, nation_id: str, permission: AlliancePermission) -> bool:
        """Check if a nation has a specific permission."""
        permissions = self.get_member_permissions(nation_id)
        return (permissions & permission) == permission
    
    # ALLIANCE EDITING
    
    def edit_alliance_info(self, nation_id: str, name: Optional[str] = None, 
                         acronym: Optional[str] = None, color: Optional[str] = None,
                         flag: Optional[str] = None, description: Optional[str] = None) -> bool:
        """Edit alliance information."""
        if not self.has_permission(nation_id, AlliancePermission.EDIT_ALLIANCE_INFO):
            return False
        
        if name:
            self.name = name
        if acronym:
            self.acronym = acronym
        if color:
            self.color = color
        if flag:
            self.flag = flag
        if description:
            self.description = description
        
        return True
    
    def edit_alliance_settings(self, nation_id: str, is_public: Optional[bool] = None,
                             max_members: Optional[int] = None, require_application: Optional[bool] = None) -> bool:
        """Edit alliance settings."""
        if not self.has_permission(nation_id, AlliancePermission.EDIT_ALLIANCE_SETTINGS):
            return False
        
        if is_public is not None:
            self.is_public = is_public
        if max_members is not None:
            self.max_members = max_members
        if require_application is not None:
            self.require_application = require_application
        
        return True
    
    def edit_membership_requirements(self, nation_id: str, min_ns: Optional[float] = None,
                                   min_infrastructure: Optional[int] = None) -> bool:
        """Edit membership requirements."""
        if not self.has_permission(nation_id, AlliancePermission.EDIT_ALLIANCE_REQUIREMENTS):
            return False
        
        if min_ns is not None:
            self.min_ns_requirement = min_ns
        if min_infrastructure is not None:
            self.min_infrastructure_requirement = min_infrastructure
        
        return True
    
    def edit_bank_settings(self, nation_id: str, daily_withdrawal_limit: Optional[float] = None,
                         member_deposit_minimum: Optional[float] = None, tax_rate: Optional[float] = None) -> bool:
        """Edit bank settings."""
        if not self.has_permission(nation_id, AlliancePermission.EDIT_BANK_SETTINGS):
            return False
        
        if daily_withdrawal_limit is not None:
            self.bank.daily_withdrawal_limit = daily_withdrawal_limit
        if member_deposit_minimum is not None:
            self.bank.member_deposit_minimum = member_deposit_minimum
        if tax_rate is not None:
            self.bank.tax_rate = tax_rate
        
        return True
    
    # MEMBER MANAGEMENT (Enhanced with permission checks)
    
    def add_member(self, nation_id: str, role: AllianceRole = AllianceRole.MEMBER) -> bool:
        """Add a member to the alliance."""
        if nation_id in self.member_ids or nation_id in self.applicant_ids:
            return False
        
        if role == AllianceRole.LEADER:
            if self.leader_id:
                return False  # Already has leader
            self.leader_id = nation_id
            self.member_role_assignments[nation_id] = "LEADER"
        elif role == AllianceRole.OFFICER:
            self.officer_ids.append(nation_id)
            self.member_role_assignments[nation_id] = "OFFICER"
        elif role == AllianceRole.MEMBER:
            self.member_ids.append(nation_id)
            self.member_role_assignments[nation_id] = "MEMBER"
        elif role == AllianceRole.APPLICANT:
            self.applicant_ids.append(nation_id)
            self.member_role_assignments[nation_id] = "APPLICANT"
        
        self.member_count = len(self.member_ids) + (1 if self.leader_id else 0) + len(self.officer_ids)
        return True
    
    def remove_member(self, nation_id: str, removing_nation_id: str) -> bool:
        """Remove a member from the alliance."""
        # Allow self-removal without permission check
        if nation_id != removing_nation_id:
            if not self.has_permission(removing_nation_id, AlliancePermission.KICK_MEMBERS):
                return False
        
        if nation_id == self.leader_id:
            # Cannot remove leader directly
            return False
        
        if nation_id in self.officer_ids:
            self.officer_ids.remove(nation_id)
        elif nation_id in self.member_ids:
            self.member_ids.remove(nation_id)
        elif nation_id in self.applicant_ids:
            self.applicant_ids.remove(nation_id)
        else:
            return False
        
        if nation_id in self.member_role_assignments:
            del self.member_role_assignments[nation_id]
        
        self.member_count = len(self.member_ids) + (1 if self.leader_id else 0) + len(self.officer_ids)
        return True
    
    def promote_to_officer(self, nation_id: str, promoting_nation_id: str) -> bool:
        """Promote a member to officer."""
        if not self.has_permission(promoting_nation_id, AlliancePermission.PROMOTE_MEMBERS):
            return False
        
        if nation_id not in self.member_ids:
            return False
        
        self.member_ids.remove(nation_id)
        self.officer_ids.append(nation_id)
        self.member_role_assignments[nation_id] = "OFFICER"
        return True
    
    def demote_to_member(self, nation_id: str, demoting_nation_id: str) -> bool:
        """Demote an officer to member."""
        if not self.has_permission(demoting_nation_id, AlliancePermission.DEMOTE_MEMBERS):
            return False
        
        if nation_id not in self.officer_ids:
            return False
        
        self.officer_ids.remove(nation_id)
        self.member_ids.append(nation_id)
        self.member_role_assignments[nation_id] = "MEMBER"
        return True
    
    def transfer_leadership(self, new_leader_id: str, current_leader_id: str) -> bool:
        """Transfer leadership to another member."""
        if not self.has_permission(current_leader_id, AlliancePermission.TRANSFER_LEADERSHIP):
            return False
        
        if current_leader_id != self.leader_id:
            return False
        
        if new_leader_id not in self.officer_ids and new_leader_id not in self.member_ids:
            return False
        
        # Demote current leader to officer
        self.officer_ids.append(current_leader_id)
        self.member_role_assignments[current_leader_id] = "OFFICER"
        
        # Promote new leader
        if new_leader_id in self.officer_ids:
            self.officer_ids.remove(new_leader_id)
        elif new_leader_id in self.member_ids:
            self.member_ids.remove(new_leader_id)
        
        self.leader_id = new_leader_id
        self.member_role_assignments[new_leader_id] = "LEADER"
        
        return True
    
    def accept_application(self, nation_id: str, accepting_nation_id: str) -> bool:
        """Accept an applicant into the alliance."""
        if not self.has_permission(accepting_nation_id, AlliancePermission.ACCEPT_APPLICATIONS):
            return False
        
        if nation_id not in self.applicant_ids:
            return False
        
        self.applicant_ids.remove(nation_id)
        self.add_member(nation_id, AllianceRole.MEMBER)
        return True
    
    def reject_application(self, nation_id: str, rejecting_nation_id: str) -> bool:
        """Reject an applicant."""
        if not self.has_permission(rejecting_nation_id, AlliancePermission.REJECT_APPLICATIONS):
            return False
        
        if nation_id not in self.applicant_ids:
            return False
        
        self.applicant_ids.remove(nation_id)
        if nation_id in self.member_role_assignments:
            del self.member_role_assignments[nation_id]
        return True
    
    # EXISTING METHODS (Preserved)
    
    def is_member(self, nation_id: str) -> bool:
        """Check if a nation is a member of the alliance."""
        return (nation_id == self.leader_id or 
                nation_id in self.officer_ids or 
                nation_id in self.member_ids)
    
    def is_officer(self, nation_id: str) -> bool:
        """Check if a nation is an officer of the alliance."""
        return nation_id == self.leader_id or nation_id in self.officer_ids
    
    def is_leader(self, nation_id: str) -> bool:
        """Check if a nation is the leader of the alliance."""
        return nation_id == self.leader_id
    
    def get_role(self, nation_id: str) -> Optional[AllianceRole]:
        """Get the role of a nation in the alliance."""
        if nation_id == self.leader_id:
            return AllianceRole.LEADER
        elif nation_id in self.officer_ids:
            return AllianceRole.OFFICER
        elif nation_id in self.member_ids:
            return AllianceRole.MEMBER
        elif nation_id in self.applicant_ids:
            return AllianceRole.APPLICANT
        return None
    
    def add_treaty(self, treaty: Treaty) -> bool:
        """Add a treaty to the alliance."""
        if treaty.alliance_a_id != self.alliance_id and treaty.alliance_b_id != self.alliance_id:
            return False
        
        self.treaties[treaty.treaty_id] = treaty
        return True
    
    def remove_treaty(self, treaty_id: str, removing_nation_id: str) -> bool:
        """Remove a treaty from the alliance."""
        if not self.has_permission(removing_nation_id, AlliancePermission.BREAK_TREATIES):
            return False
        
        if treaty_id in self.treaties:
            del self.treaties[treaty_id]
            return True
        return False
    
    def calculate_color_trade_bloc_bonus(self, nation_color: str, 
                                       total_nations_on_color: int) -> float:
        """Calculate color trade bloc bonus."""
        if self.color != nation_color:
            return 0.0
        
        # Bonus scales with number of nations on the color
        # Base: $0.10 per citizen per 10 nations on the color
        bonus_per_citizen = (total_nations_on_color / 10.0) * 0.10
        
        return bonus_per_citizen
    
    def collect_member_tax(self, nation_id: str, income: float) -> float:
        """Collect tax from a member nation's income."""
        if self.bank.tax_rate <= 0:
            return 0.0
        
        tax_amount = income * self.bank.tax_rate
        
        # Add to holdings
        self.holdings_cash += tax_amount
        
        # Record tax collection
        self.tax_collection_history.append({
            "nation_id": nation_id,
            "amount": tax_amount,
            "timestamp": datetime.now()
        })
        
        return tax_amount
    
    def donate_to_alliance(self, nation_id: str, cash_amount: float = 0.0,
                          resources: Dict[ResourceType, float] = None) -> bool:
        """Member donates cash/resources to alliance holdings."""
        if resources is None:
            resources = {}
        
        # Add cash to holdings
        if cash_amount > 0:
            self.holdings_cash += cash_amount
        
        # Add resources to holdings
        for resource_type, amount in resources.items():
            if amount > 0:
                if resource_type not in self.holdings_resources:
                    self.holdings_resources[resource_type] = 0.0
                self.holdings_resources[resource_type] += amount
        
        # Record in bank deposit history
        if cash_amount > 0:
            self.bank.deposit_cash(nation_id, cash_amount)
        
        for resource_type, amount in resources.items():
            if amount > 0:
                self.bank.deposit_resource(nation_id, resource_type, amount)
        
        return True
    
    def grant_spending_permission(self, nation_id: str, granting_nation_id: str) -> bool:
        """Grant permission for a nation to spend alliance funds."""
        # Only leader can grant spending permissions
        if granting_nation_id != self.leader_id:
            return False
        
        self.bank.grant_spending_permission(nation_id)
        self.member_spending_permissions[nation_id] = True
        return True
    
    def revoke_spending_permission(self, nation_id: str, revoking_nation_id: str) -> bool:
        """Revoke permission for a nation to spend alliance funds."""
        # Only leader can revoke spending permissions
        if revoking_nation_id != self.leader_id:
            return False
        
        self.bank.revoke_spending_permission(nation_id)
        if nation_id in self.member_spending_permissions:
            del self.member_spending_permissions[nation_id]
        return True
    
    def spend_on_monument(self, nation_id: str, monument_id: str, cash_amount: float = 0.0,
                         resources: Dict[ResourceType, float] = None) -> bool:
        """Spend alliance holdings on monument construction."""
        if resources is None:
            resources = {}

        # Check spending permission
        if not self.bank.has_spending_permission(nation_id):
            return False

        # Use bank spending method to check permissions and record history
        if not self.bank.spend_on_monument(nation_id, monument_id, cash_amount, resources,
                                          self.holdings_cash, self.holdings_resources):
            return False

        # Deduct from holdings
        if cash_amount > 0:
            self.holdings_cash -= cash_amount

        for resource_type, amount in resources.items():
            if amount > 0:
                if resource_type in self.holdings_resources:
                    self.holdings_resources[resource_type] -= amount

        return True

    def spend_on_treaty(self, nation_id: str, treaty_id: str, cash_amount: float = 0.0,
                       resources: Dict[ResourceType, float] = None) -> bool:
        """Spend alliance holdings on treaty costs."""
        if resources is None:
            resources = {}

        # Check spending permission
        if not self.bank.has_spending_permission(nation_id):
            return False

        # Use bank spending method to check permissions and record history
        if not self.bank.spend_on_treaty(nation_id, treaty_id, cash_amount, resources,
                                        self.holdings_cash, self.holdings_resources):
            return False

        # Deduct from holdings
        if cash_amount > 0:
            self.holdings_cash -= cash_amount

        for resource_type, amount in resources.items():
            if amount > 0:
                if resource_type in self.holdings_resources:
                    self.holdings_resources[resource_type] -= amount

        return True

    # ALLIANCE WAR METHODS

    def declare_alliance_war(self, target_alliance_id: str, declaring_nation_id: str,
                            damage_multiplier: float = 1.5, loot_multiplier: float = 2.0,
                            infrastructure_damage_bonus: float = 0.25, land_damage_bonus: float = 0.25,
                            duration_days: int = 30) -> Optional[AllianceWar]:
        """Declare war on another alliance."""
        # Check permission
        if not self.has_permission(declaring_nation_id, AlliancePermission.DECLARE_WAR):
            return None

        # Check if already at war with this alliance
        for war_id, war in self.alliance_wars.items():
            if war.is_active() and (war.alliance_a_id == target_alliance_id or war.alliance_b_id == target_alliance_id):
                return None

        # Create alliance war
        war = AllianceWar(
            alliance_a_id=self.alliance_id,
            alliance_b_id=target_alliance_id,
            damage_multiplier=damage_multiplier,
            loot_multiplier=loot_multiplier,
            infrastructure_damage_bonus=infrastructure_damage_bonus,
            land_damage_bonus=land_damage_bonus
        )

        # Set custom duration
        war.ends_at = war.started_at + timedelta(days=duration_days)

        # Initialize statistics
        war.alliance_a_statistics.alliance_id = self.alliance_id
        war.alliance_b_statistics.alliance_id = target_alliance_id

        # Add to alliance wars
        self.alliance_wars[war.war_id] = war
        self.active_alliance_war_ids.append(war.war_id)

        return war

    def end_alliance_war(self, war_id: str, ending_nation_id: str, reason: str = "Peace Treaty") -> bool:
        """End an alliance war."""
        # Check permission
        if not self.has_permission(ending_nation_id, AlliancePermission.MAKE_PEACE):
            return False

        # Check if war exists and is active
        if war_id not in self.alliance_wars:
            return False

        war = self.alliance_wars[war_id]
        if not war.is_active():
            return False

        # End the war
        if not war.end(reason):
            return False

        # Remove from active wars
        if war_id in self.active_alliance_war_ids:
            self.active_alliance_war_ids.remove(war_id)

        return True

    def extend_alliance_war(self, war_id: str, extending_nation_id: str, days: int = 30) -> bool:
        """Extend the duration of an alliance war."""
        # Check permission
        if not self.has_permission(extending_nation_id, AlliancePermission.DECLARE_WAR):
            return False

        # Check if war exists and is active
        if war_id not in self.alliance_wars:
            return False

        war = self.alliance_wars[war_id]
        if not war.is_active():
            return False

        # Extend the war
        return war.extend(days)

    def get_alliance_war_bonus(self, target_alliance_id: str) -> Optional[Dict[str, float]]:
        """Get alliance war bonuses against a specific target alliance."""
        for war_id in self.active_alliance_war_ids:
            if war_id not in self.alliance_wars:
                continue

            war = self.alliance_wars[war_id]
            if not war.is_active():
                continue

            # Check if the target alliance is the enemy
            if war.alliance_a_id == self.alliance_id and war.alliance_b_id == target_alliance_id:
                return {
                    "damage_multiplier": war.damage_multiplier,
                    "loot_multiplier": war.loot_multiplier,
                    "infrastructure_damage_bonus": war.infrastructure_damage_bonus,
                    "land_damage_bonus": war.land_damage_bonus
                }
            elif war.alliance_b_id == self.alliance_id and war.alliance_a_id == target_alliance_id:
                return {
                    "damage_multiplier": war.damage_multiplier,
                    "loot_multiplier": war.loot_multiplier,
                    "infrastructure_damage_bonus": war.infrastructure_damage_bonus,
                    "land_damage_bonus": war.land_damage_bonus
                }

        return None

    def record_war_damage(self, war_id: str, damage_dealt: float, infrastructure_destroyed: float = 0.0,
                          land_destroyed: float = 0.0, loot_stolen: float = 0.0,
                          cash_looted: float = 0.0, resources_looted: Dict[ResourceType, float] = None) -> bool:
        """Record war statistics for an alliance war."""
        if war_id not in self.alliance_wars:
            return False

        war = self.alliance_wars[war_id]

        # Determine which alliance is recording (this alliance)
        if war.alliance_a_id == self.alliance_id:
            stats = war.alliance_a_statistics
        elif war.alliance_b_id == self.alliance_id:
            stats = war.alliance_b_statistics
        else:
            return False

        # Update statistics
        stats.total_damage_dealt += damage_dealt
        stats.total_infrastructure_destroyed += infrastructure_destroyed
        stats.total_land_destroyed += land_destroyed
        stats.total_loot_stolen += loot_stolen
        stats.total_cash_looted += cash_looted

        if resources_looted:
            for resource_type, amount in resources_looted.items():
                if resource_type not in stats.total_resources_looted:
                    stats.total_resources_looted[resource_type] = 0.0
                stats.total_resources_looted[resource_type] += amount

        return True

    # ALLIANCE VOTING METHODS

    def propose_vote(self, proposing_nation_id: str, action_type: str, action_data: Dict[str, Any] = None,
                    required_percentage: Optional[float] = None, minimum_voters: Optional[int] = None,
                    duration_hours: Optional[int] = None) -> Optional[AllianceVote]:
        """Propose a vote for alliance members to vote on."""
        if action_data is None:
            action_data = {}

        # Check if voting is enabled
        if not self.voting_settings.enable_voting:
            return None

        # Check permission (leader or officers can propose)
        if not self.has_permission(proposing_nation_id, AlliancePermission.DECLARE_WAR):
            # Officers can propose votes, so check if they're an officer
            if not self.is_officer(proposing_nation_id):
                return None

        # Create vote
        vote = AllianceVote(
            alliance_id=self.alliance_id,
            action_type=action_type,
            action_data=action_data,
            proposed_by=proposing_nation_id,
            required_percentage=required_percentage if required_percentage is not None else self.voting_settings.required_percentage,
            minimum_voters=minimum_voters if minimum_voters is not None else self.voting_settings.minimum_voters
        )

        # Set custom duration if provided
        if duration_hours is not None:
            vote.voting_ends_at = vote.proposed_at + timedelta(hours=duration_hours)
        else:
            vote.voting_ends_at = vote.proposed_at + timedelta(hours=self.voting_settings.vote_duration_hours)

        # Add to active votes
        self.active_votes[vote.vote_id] = vote

        return vote

    def cast_vote(self, vote_id: str, nation_id: str, vote_choice: str) -> bool:
        """Cast a vote on a proposal."""
        # Check if vote exists and is active
        if vote_id not in self.active_votes:
            return False

        vote = self.active_votes[vote_id]

        # Check if vote is still pending and not expired
        if vote.status != VoteStatus.PENDING:
            return False

        if vote.is_expired():
            return False

        # Check if nation is a member
        if not self.is_member(nation_id):
            return False

        # Determine vote weight
        weight = self.voting_settings.member_vote_weight
        if self.is_officer(nation_id):
            weight = self.voting_settings.officer_vote_weight

        # Remove existing vote if any
        if nation_id in vote.votes_for:
            vote.votes_for.remove(nation_id)
        if nation_id in vote.votes_against:
            vote.votes_against.remove(nation_id)
        if nation_id in vote.votes_abstain:
            vote.votes_abstain.remove(nation_id)

        # Add new vote
        if vote_choice == "for":
            vote.votes_for.append(nation_id)
            vote.vote_weights[nation_id] = weight
        elif vote_choice == "against":
            vote.votes_against.append(nation_id)
            vote.vote_weights[nation_id] = weight
        elif vote_choice == "abstain":
            vote.votes_abstain.append(nation_id)
            vote.vote_weights[nation_id] = weight
        else:
            return False

        # Don't auto-update vote status - let it be checked when needed
        return True

    def get_vote_result(self, vote_id: str) -> Optional[Dict[str, Any]]:
        """Get the result of a vote."""
        if vote_id not in self.active_votes:
            return None

        vote = self.active_votes[vote_id]
        return vote.get_result()

    def execute_passed_vote(self, vote_id: str, executing_nation_id: str) -> bool:
        """Execute a passed vote."""
        # Check if vote exists
        if vote_id not in self.active_votes:
            return False

        vote = self.active_votes[vote_id]

        # Check if vote is still pending
        if vote.status != VoteStatus.PENDING:
            return False

        # Check if vote has passed
        result = vote.get_result()
        if not result["passed"]:
            return False

        # Check permission (leader can execute)
        if executing_nation_id != self.leader_id:
            return False

        # Check for leader veto
        if self.voting_settings.leader_veto_power:
            vote.status = VoteStatus.VETOED
            vote.vetoed_by = executing_nation_id
            # Remove from active votes and add to history
            del self.active_votes[vote_id]
            self.vote_history.append(vote)
            return False

        # Execute the vote
        vote.status = VoteStatus.EXECUTED

        # Remove from active votes and add to history
        del self.active_votes[vote_id]
        self.vote_history.append(vote)

        # Execute the action based on action_type
        # This would typically call the appropriate method
        # For now, just mark as executed
        return True

    def cancel_vote(self, vote_id: str, cancelling_nation_id: str) -> bool:
        """Cancel a pending vote."""
        # Check if vote exists
        if vote_id not in self.active_votes:
            return False

        vote = self.active_votes[vote_id]

        # Only the proposer or leader can cancel
        if cancelling_nation_id != vote.proposed_by and cancelling_nation_id != self.leader_id:
            return False

        # Only pending votes can be cancelled
        if vote.status != VoteStatus.PENDING:
            return False

        # Cancel the vote
        vote.status = VoteStatus.CANCELLED

        # Remove from active votes and add to history
        del self.active_votes[vote_id]
        self.vote_history.append(vote)

        return True

    def update_alliance_score(self, member_scores: Dict[str, float]):
        """Update alliance score based on member NS scores."""
        total_score = 0.0
        
        if self.leader_id and self.leader_id in member_scores:
            total_score += member_scores[self.leader_id]
        
        for officer_id in self.officer_ids:
            if officer_id in member_scores:
                total_score += member_scores[officer_id]
        
        for member_id in self.member_ids:
            if member_id in member_scores:
                total_score += member_scores[member_id]
        
        self.alliance_score = total_score


class AllianceSystem:
    """System for managing alliances."""
    
    def __init__(self):
        self.alliances: Dict[str, Alliance] = {}  # alliance_id -> Alliance
        self.nation_alliances: Dict[str, str] = {}  # nation_id -> alliance_id
        
        self.treaties: Dict[str, Treaty] = {}  # treaty_id -> Treaty
    
    def can_create_alliance(self, nation_id: str, cash: float) -> tuple[bool, str]:
        """Check if a nation can create an alliance."""
        founding_cost = 1000000.0  # $1,000,000
        
        if cash < founding_cost:
            return False, f"Insufficient cash (need ${founding_cost})"
        
        if nation_id in self.nation_alliances:
            return False, "Already in an alliance"
        
        return True, ""
    
    def create_alliance(self, founder_nation_id: str, name: str, acronym: str,
                      color: str = "", flag: str = "", description: str = "",
                      is_public: bool = True, max_members: int = 50,
                      min_ns_requirement: float = 0.0, min_infrastructure_requirement: int = 0) -> Alliance:
        """Create a new alliance with enhanced settings."""
        alliance = Alliance(
            name=name,
            acronym=acronym,
            color=color,
            flag=flag,
            description=description,
            is_public=is_public,
            max_members=max_members,
            min_ns_requirement=min_ns_requirement,
            min_infrastructure_requirement=min_infrastructure_requirement
        )
        
        # Add founder as leader
        alliance.add_member(founder_nation_id, AllianceRole.LEADER)
        
        self.alliances[alliance.alliance_id] = alliance
        self.nation_alliances[founder_nation_id] = alliance.alliance_id
        
        return alliance
    
    def can_join_alliance(self, nation_id: str, alliance_id: str, nation_ns: float = 0.0,
                        nation_infrastructure: int = 0) -> tuple[bool, str]:
        """Check if a nation can join an alliance."""
        if nation_id in self.nation_alliances:
            return False, "Already in an alliance"
        
        if alliance_id not in self.alliances:
            return False, "Alliance not found"
        
        alliance = self.alliances[alliance_id]
        
        # Check if alliance is at max capacity
        if alliance.member_count >= alliance.max_members:
            return False, "Alliance is at maximum capacity"
        
        # Check membership requirements
        if nation_ns < alliance.min_ns_requirement:
            return False, f"NS requirement not met (need {alliance.min_ns_requirement})"
        
        if nation_infrastructure < alliance.min_infrastructure_requirement:
            return False, f"Infrastructure requirement not met (need {alliance.min_infrastructure_requirement})"
        
        return True, ""
    
    def apply_to_alliance(self, nation_id: str, alliance_id: str, nation_ns: float = 0.0,
                        nation_infrastructure: int = 0) -> bool:
        """Apply to join an alliance."""
        can_join, reason = self.can_join_alliance(nation_id, alliance_id, nation_ns, nation_infrastructure)
        if not can_join:
            return False
        
        alliance = self.alliances[alliance_id]
        return alliance.add_member(nation_id, AllianceRole.APPLICANT)
    
    def join_alliance(self, nation_id: str, alliance_id: str, nation_ns: float = 0.0,
                    nation_infrastructure: int = 0) -> bool:
        """Join an alliance directly (as member, not applicant)."""
        can_join, reason = self.can_join_alliance(nation_id, alliance_id, nation_ns, nation_infrastructure)
        if not can_join:
            return False
        
        alliance = self.alliances[alliance_id]
        success = alliance.add_member(nation_id, AllianceRole.MEMBER)
        
        if success:
            self.nation_alliances[nation_id] = alliance_id
        
        return success
    
    def leave_alliance(self, nation_id: str) -> bool:
        """Leave current alliance."""
        if nation_id not in self.nation_alliances:
            return False
        
        alliance_id = self.nation_alliances[nation_id]
        alliance = self.alliances.get(alliance_id)
        
        if alliance:
            # Cannot leave if leader (must transfer leadership first)
            if alliance.is_leader(nation_id):
                return False
            
            success = alliance.remove_member(nation_id, nation_id)
            if success:
                del self.nation_alliances[nation_id]
                return True
        
        return False
    
    # ALLIANCE EDITING (Enhanced)
    
    def edit_alliance_info(self, nation_id: str, alliance_id: str, name: Optional[str] = None,
                         acronym: Optional[str] = None, color: Optional[str] = None,
                         flag: Optional[str] = None, description: Optional[str] = None) -> bool:
        """Edit alliance information."""
        alliance = self.get_alliance(alliance_id)
        if not alliance:
            return False
        
        return alliance.edit_alliance_info(nation_id, name, acronym, color, flag, description)
    
    def edit_alliance_settings(self, nation_id: str, alliance_id: str, is_public: Optional[bool] = None,
                             max_members: Optional[int] = None, require_application: Optional[bool] = None) -> bool:
        """Edit alliance settings."""
        alliance = self.get_alliance(alliance_id)
        if not alliance:
            return False
        
        return alliance.edit_alliance_settings(nation_id, is_public, max_members, require_application)
    
    def edit_membership_requirements(self, nation_id: str, alliance_id: str, min_ns: Optional[float] = None,
                                   min_infrastructure: Optional[int] = None) -> bool:
        """Edit membership requirements."""
        alliance = self.get_alliance(alliance_id)
        if not alliance:
            return False
        
        return alliance.edit_membership_requirements(nation_id, min_ns, min_infrastructure)
    
    def edit_bank_settings(self, nation_id: str, alliance_id: str, daily_withdrawal_limit: Optional[float] = None,
                         member_deposit_minimum: Optional[float] = None, tax_rate: Optional[float] = None) -> bool:
        """Edit bank settings."""
        alliance = self.get_alliance(alliance_id)
        if not alliance:
            return False
        
        return alliance.edit_bank_settings(nation_id, daily_withdrawal_limit, member_deposit_minimum, tax_rate)
    
    # CUSTOM ROLE MANAGEMENT
    
    def create_custom_role(self, nation_id: str, alliance_id: str, role_name: str, description: str,
                          permissions: AlliancePermission, max_members: int = 0, priority: int = 0) -> Optional[CustomRole]:
        """Create a custom role in an alliance."""
        alliance = self.get_alliance(alliance_id)
        if not alliance:
            return None
        
        if not alliance.has_permission(nation_id, AlliancePermission.EDIT_ALLIANCE_SETTINGS):
            return None
        
        return alliance.create_custom_role(role_name, description, permissions, max_members, priority)
    
    def delete_custom_role(self, nation_id: str, alliance_id: str, role_id: str) -> bool:
        """Delete a custom role from an alliance."""
        alliance = self.get_alliance(alliance_id)
        if not alliance:
            return False
        
        if not alliance.has_permission(nation_id, AlliancePermission.EDIT_ALLIANCE_SETTINGS):
            return False
        
        return alliance.delete_custom_role(role_id)
    
    def assign_custom_role(self, nation_id: str, alliance_id: str, target_nation_id: str, role_id: str) -> bool:
        """Assign a custom role to a member."""
        alliance = self.get_alliance(alliance_id)
        if not alliance:
            return False
        
        if not alliance.has_permission(nation_id, AlliancePermission.PROMOTE_MEMBERS):
            return False
        
        return alliance.assign_role(target_nation_id, role_id)
    
    def remove_custom_role(self, nation_id: str, alliance_id: str, target_nation_id: str) -> bool:
        """Remove custom role assignment from a member."""
        alliance = self.get_alliance(alliance_id)
        if not alliance:
            return False
        
        if not alliance.has_permission(nation_id, AlliancePermission.DEMOTE_MEMBERS):
            return False
        
        return alliance.remove_role_assignment(target_nation_id)
    
    def get_alliance_custom_roles(self, alliance_id: str) -> List[CustomRole]:
        """Get all custom roles for an alliance."""
        alliance = self.get_alliance(alliance_id)
        if not alliance:
            return []
        
        # Sort by priority (higher priority first)
        roles = list(alliance.custom_roles.values())
        roles.sort(key=lambda r: r.priority, reverse=True)
        return roles
    
    # MEMBER MANAGEMENT (Enhanced with permission checks)
    
    def kick_member(self, nation_id: str, alliance_id: str, target_nation_id: str) -> bool:
        """Kick a member from an alliance."""
        alliance = self.get_alliance(alliance_id)
        if not alliance:
            return False
        
        return alliance.remove_member(target_nation_id, nation_id)
    
    def promote_to_officer(self, nation_id: str, alliance_id: str, target_nation_id: str) -> bool:
        """Promote a member to officer."""
        alliance = self.get_alliance(alliance_id)
        if not alliance:
            return False
        
        return alliance.promote_to_officer(target_nation_id, nation_id)
    
    def demote_to_member(self, nation_id: str, alliance_id: str, target_nation_id: str) -> bool:
        """Demote an officer to member."""
        alliance = self.get_alliance(alliance_id)
        if not alliance:
            return False
        
        return alliance.demote_to_member(target_nation_id, nation_id)
    
    def transfer_leadership(self, nation_id: str, alliance_id: str, new_leader_id: str) -> bool:
        """Transfer alliance leadership."""
        alliance = self.get_alliance(alliance_id)
        if not alliance:
            return False
        
        return alliance.transfer_leadership(new_leader_id, nation_id)
    
    def accept_application(self, nation_id: str, alliance_id: str, applicant_nation_id: str) -> bool:
        """Accept an alliance application."""
        alliance = self.get_alliance(alliance_id)
        if not alliance:
            return False
        
        success = alliance.accept_application(applicant_nation_id, nation_id)
        if success:
            self.nation_alliances[applicant_nation_id] = alliance_id
        return success
    
    def reject_application(self, nation_id: str, alliance_id: str, applicant_nation_id: str) -> bool:
        """Reject an alliance application."""
        alliance = self.get_alliance(alliance_id)
        if not alliance:
            return False
        
        return alliance.reject_application(applicant_nation_id, nation_id)
    
    # EXISTING METHODS (Preserved)
    
    def get_nation_alliance(self, nation_id: str) -> Optional[Alliance]:
        """Get the alliance a nation is in."""
        if nation_id in self.nation_alliances:
            alliance_id = self.nation_alliances[nation_id]
            return self.alliances.get(alliance_id)
        return None
    
    def get_alliance(self, alliance_id: str) -> Optional[Alliance]:
        """Get an alliance by ID."""
        return self.alliances.get(alliance_id)
    
    def get_all_alliances(self) -> List[Alliance]:
        """Get all alliances."""
        return list(self.alliances.values())
    
    def get_public_alliances(self) -> List[Alliance]:
        """Get all public alliances."""
        return [alliance for alliance in self.alliances.values() if alliance.is_public]
    
    def create_treaty(self, alliance_a_id: str, alliance_b_id: str,
                     treaty_type: TreatyType, terms: Dict[str, float],
                     duration_days: Optional[int] = None) -> Treaty:
        """Create a treaty between two alliances."""
        treaty = Treaty(
            alliance_a_id=alliance_a_id,
            alliance_b_id=alliance_b_id,
            treaty_type=treaty_type,
            terms=terms
        )
        
        if duration_days:
            from datetime import timedelta
            treaty.expires_at = datetime.now() + timedelta(days=duration_days)
        
        self.treaties[treaty.treaty_id] = treaty
        
        # Add to both alliances
        alliance_a = self.get_alliance(alliance_a_id)
        alliance_b = self.get_alliance(alliance_b_id)
        
        if alliance_a:
            alliance_a.add_treaty(treaty)
        if alliance_b:
            alliance_b.add_treaty(treaty)
        
        return treaty
    
    def break_treaty(self, treaty_id: str, breaking_nation_id: str) -> bool:
        """Break a treaty."""
        if treaty_id not in self.treaties:
            return False
        
        treaty = self.treaties[treaty_id]
        
        # Check if breaking nation has permission
        alliance_a = self.get_alliance(treaty.alliance_a_id)
        alliance_b = self.get_alliance(treaty.alliance_b_id)
        
        has_permission = False
        if alliance_a and alliance_a.is_member(breaking_nation_id):
            if alliance_a.has_permission(breaking_nation_id, AlliancePermission.BREAK_TREATIES):
                has_permission = True
        
        if alliance_b and alliance_b.is_member(breaking_nation_id):
            if alliance_b.has_permission(breaking_nation_id, AlliancePermission.BREAK_TREATIES):
                has_permission = True
        
        if not has_permission:
            return False
        
        treaty.is_broken = True
        treaty.is_active = False
        
        # Remove from both alliances
        if alliance_a:
            alliance_a.remove_treaty(treaty_id, breaking_nation_id)
        if alliance_b:
            alliance_b.remove_treaty(treaty_id, breaking_nation_id)
        
        return True
    
    def get_treaty(self, treaty_id: str) -> Optional[Treaty]:
        """Get a treaty by ID."""
        return self.treaties.get(treaty_id)
    
    def get_alliance_treaties(self, alliance_id: str) -> List[Treaty]:
        """Get all treaties for an alliance."""
        alliance = self.get_alliance(alliance_id)
        if alliance:
            return list(alliance.treaties.values())
        return []
    
    def update_all_alliance_scores(self, nation_scores: Dict[str, float]):
        """Update alliance scores for all alliances."""
        for alliance in self.alliances.values():
            member_scores = {}
            
            if alliance.leader_id and alliance.leader_id in nation_scores:
                member_scores[alliance.leader_id] = nation_scores[alliance.leader_id]
            
            for officer_id in alliance.officer_ids:
                if officer_id in nation_scores:
                    member_scores[officer_id] = nation_scores[officer_id]
            
            for member_id in alliance.member_ids:
                if member_id in nation_scores:
                    member_scores[member_id] = nation_scores[member_id]
            
            alliance.update_alliance_score(member_scores)


# Singleton instance
alliance_system = AllianceSystem()

"""
Trade System for Sovereign Nation Game

This module defines the trade circle mechanics, global market,
and tech deals for the game.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from enum import Enum
from datetime import datetime
import uuid

from .resources import ResourceType, ResourceSystem
from .improvements import ImprovementType, ImprovementSystem
from .projects import ProjectType, ProjectSystem


class TradeCircleStatus(Enum):
    """Status of a trade circle."""
    FORMING = "Forming"
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    DISSOLVED = "Dissolved"


@dataclass
class TradeCircle:
    """Represents a trade circle of nations."""
    
    circle_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    # Circle members (max 5)
    member_ids: List[str] = field(default_factory=list)
    
    # Member resources (3 resources per member)
    member_resources: Dict[str, List[ResourceType]] = field(default_factory=dict)  # nation_id -> resources
    
    # Bonus resources unlocked by the circle
    active_bonus_resources: List[ResourceType] = field(default_factory=list)
    
    # Circle status
    status: TradeCircleStatus = TradeCircleStatus.FORMING
    
    # Creation timestamp
    created_at: datetime = field(default_factory=datetime.now)
    last_activity_tick: int = 0
    
    def add_member(self, nation_id: str, resources: List[ResourceType]) -> bool:
        """Add a member to the trade circle."""
        if len(self.member_ids) >= 5:
            return False
        
        if nation_id in self.member_ids:
            return False
        
        self.member_ids.append(nation_id)
        self.member_resources[nation_id] = resources
        self.last_activity_tick = 0  # Reset activity tracker
        
        # Check if circle is now full (5 members)
        if len(self.member_ids) == 5:
            self.status = TradeCircleStatus.ACTIVE
            self._calculate_bonus_resources()
        
        return True
    
    def remove_member(self, nation_id: str) -> bool:
        """Remove a member from the trade circle."""
        if nation_id not in self.member_ids:
            return False
        
        self.member_ids.remove(nation_id)
        if nation_id in self.member_resources:
            del self.member_resources[nation_id]
        
        # If circle loses members, recalculate bonus resources
        if len(self.member_ids) < 5:
            self.status = TradeCircleStatus.FORMING
            self.active_bonus_resources = []
        else:
            self._calculate_bonus_resources()
        
        return True
    
    def _calculate_bonus_resources(self):
        """Calculate which bonus resources are unlocked by the circle's resource pool."""
        resource_system = ResourceSystem()
        
        # Collect all resources from all members
        all_resources = []
        for resources in self.member_resources.values():
            all_resources.extend(resources)
        
        # Check which bonus resources are unlocked
        self.active_bonus_resources = resource_system.get_unlocked_bonus_resources(all_resources)
    
    def is_full(self) -> bool:
        """Check if the trade circle is full (5 members)."""
        return len(self.member_ids) >= 5
    
    def is_member(self, nation_id: str) -> bool:
        """Check if a nation is a member of the circle."""
        return nation_id in self.member_ids
    
    def get_member_resources(self, nation_id: str) -> Optional[List[ResourceType]]:
        """Get the resources a member contributes to the circle."""
        return self.member_resources.get(nation_id)
    
    def check_inactive_members(self, current_tick: int, inactive_threshold: int = 168) -> List[str]:
        """Check for inactive members (no activity for 168 ticks)."""
        inactive = []
        
        for nation_id in self.member_ids:
            pass
        
        return inactive


@dataclass
class MarketListing:
    """Represents a resource listing on the global market."""
    
    listing_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    seller_nation_id: str = ""
    
    resource_type: ResourceType = ResourceType.GRAIN
    quantity: float = 0.0
    price_per_unit: float = 0.0
    
    # Listing status
    is_active: bool = True
    is_sold: bool = False
    
    # Timestamp
    created_at: datetime = field(default_factory=datetime.now)
    
    def total_price(self) -> float:
        """Calculate total price for the listing."""
        return self.quantity * self.price_per_unit


@dataclass
class LandMarketListing:
    """Represents a land listing on the global market."""
    
    listing_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    seller_nation_id: str = ""
    
    land_amount: int = 0
    price_per_unit: float = 0.0
    
    # Listing status
    is_active: bool = True
    is_sold: bool = False
    
    # Timestamp
    created_at: datetime = field(default_factory=datetime.now)
    
    def total_price(self) -> float:
        """Calculate total price for the listing."""
        return self.land_amount * self.price_per_unit


@dataclass
class TechMarketListing:
    """Represents a technology listing on the global market."""
    
    listing_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    seller_nation_id: str = ""
    
    tech_amount: int = 0
    price_per_unit: float = 0.0
    
    # Listing status
    is_active: bool = True
    is_sold: bool = False
    
    # Timestamp
    created_at: datetime = field(default_factory=datetime.now)
    
    def total_price(self) -> float:
        """Calculate total price for the listing."""
        return self.tech_amount * self.price_per_unit


@dataclass
class TechDeal:
    """Represents a technology deal between nations."""
    
    deal_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    seller_nation_id: str = ""
    buyer_nation_id: str = ""
    
    tech_levels: int = 0
    cash_price: float = 3000000.0  # Standard price: $3,000,000
    required_resources: Dict[ResourceType, float] = field(default_factory=dict)
    
    # Deal status
    is_active: bool = True
    is_completed: bool = False
    is_cancelled: bool = False
    
    # Timestamp
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


class TradeSystem:
    """System for managing trade circles, global market, and tech deals."""
    
    def __init__(self):
        self.trade_circles: Dict[str, TradeCircle] = {}  # circle_id -> TradeCircle
        self.nation_circles: Dict[str, str] = {}  # nation_id -> circle_id (one circle per nation)
        
        self.market_listings: Dict[str, MarketListing] = {}  # listing_id -> MarketListing
        self.resource_listings: Dict[ResourceType, List[str]] = {}  # resource_type -> [listing_ids]
        
        self.land_market_listings: Dict[str, LandMarketListing] = {}  # listing_id -> LandMarketListing
        self.tech_market_listings: Dict[str, TechMarketListing] = {}  # listing_id -> TechMarketListing
        
        self.tech_deals: Dict[str, TechDeal] = {}  # deal_id -> TechDeal
        self.nation_tech_deals: Dict[str, List[str]] = {}  # nation_id -> [deal_ids]
    
    def can_join_trade_circle(self, nation_id: str, trade_posts: int, 
                            resources_producing: List[ResourceType]) -> tuple[bool, str]:
        """Check if a nation can join a trade circle."""
        # Check if already in a circle
        if nation_id in self.nation_circles:
            return False, "Already in a trade circle"
        
        # Check if has trade post
        if trade_posts < 1:
            return False, "Need at least 1 Trade Post to join a trade circle"
        
        # Check if has resources to contribute
        if not resources_producing:
            return False, "No resources to contribute to trade circle"
        
        return True, ""
    
    def create_trade_circle(self, creator_nation_id: str, 
                          creator_resources: List[ResourceType]) -> TradeCircle:
        """Create a new trade circle."""
        circle = TradeCircle()
        circle.add_member(creator_nation_id, creator_resources)
        
        self.trade_circles[circle.circle_id] = circle
        self.nation_circles[creator_nation_id] = circle.circle_id
        
        return circle
    
    def join_trade_circle(self, circle_id: str, nation_id: str, 
                        resources: List[ResourceType]) -> tuple[bool, str]:
        """Join an existing trade circle."""
        if circle_id not in self.trade_circles:
            return False, "Trade circle not found"
        
        circle = self.trade_circles[circle_id]
        
        # Check if can join
        can_join, reason = self.can_join_trade_circle(nation_id, 1, resources)
        if not can_join:
            return False, reason
        
        # Add to circle
        success = circle.add_member(nation_id, resources)
        if success:
            self.nation_circles[nation_id] = circle_id
            return True, ""
        
        return False, "Failed to join trade circle"
    
    def leave_trade_circle(self, nation_id: str) -> bool:
        """Leave the current trade circle."""
        if nation_id not in self.nation_circles:
            return False
        
        circle_id = self.nation_circles[nation_id]
        circle = self.trade_circles.get(circle_id)
        
        if circle:
            circle.remove_member(nation_id)
            del self.nation_circles[nation_id]
            
            # If circle is empty, dissolve it
            if len(circle.member_ids) == 0:
                circle.status = TradeCircleStatus.DISSOLVED
                del self.trade_circles[circle_id]
            
            return True
        
        return False
    
    def get_nation_circle(self, nation_id: str) -> Optional[TradeCircle]:
        """Get the trade circle a nation is in."""
        if nation_id in self.nation_circles:
            circle_id = self.nation_circles[nation_id]
            return self.trade_circles.get(circle_id)
        return None
    
    def get_circle_bonus_resources(self, nation_id: str) -> List[ResourceType]:
        """Get the bonus resources a nation receives from their trade circle."""
        circle = self.get_nation_circle(nation_id)
        if circle and circle.status == TradeCircleStatus.ACTIVE:
            return circle.active_bonus_resources
        return []
    
    # Global Market Methods
    
    def can_list_on_market(self, nation_id: str, has_harbor: bool, 
                         resource_type: ResourceType, quantity: float) -> tuple[bool, str]:
        """Check if a nation can list a resource on the market."""
        # Check if has harbor
        if not has_harbor:
            return False, "Need National Harbor to access global market"
        
        # Check if has quantity to sell
        if quantity <= 0:
            return False, "Must list positive quantity"
        
        return True, ""
    
    def create_market_listing(self, seller_nation_id: str, resource_type: ResourceType,
                           quantity: float, price_per_unit: float, nation_system) -> tuple[bool, str, Optional[MarketListing]]:
        """Create a new market listing and remove resources from seller."""
        # Check if seller has enough resources
        from_nation = nation_system.nations.get(seller_nation_id)
        if not from_nation:
            return False, "Nation not found", None
        
        if resource_type not in from_nation.resource_inventory or from_nation.resource_inventory[resource_type] < quantity:
            return False, "Not enough resources to list", None
        
        # Remove resources from seller
        from_nation.resource_inventory[resource_type] -= quantity
        
        # Create listing
        listing = MarketListing(
            seller_nation_id=seller_nation_id,
            resource_type=resource_type,
            quantity=quantity,
            price_per_unit=price_per_unit
        )
        
        self.market_listings[listing.listing_id] = listing
        
        if resource_type not in self.resource_listings:
            self.resource_listings[resource_type] = []
        self.resource_listings[resource_type].append(listing.listing_id)
        
        return True, "", listing
    
    def buy_from_market(self, buyer_nation_id: str, listing_id: str, 
                       quantity: float, nation_system) -> tuple[bool, str, float]:
        """Buy from a market listing."""
        if listing_id not in self.market_listings:
            return False, "Listing not found", 0.0
        
        listing = self.market_listings[listing_id]
        
        if not listing.is_active or listing.is_sold:
            return False, "Listing not available", 0.0
        
        if listing.seller_nation_id == buyer_nation_id:
            return False, "Cannot buy from yourself", 0.0
        
        if quantity > listing.quantity:
            return False, "Requested quantity exceeds available", 0.0
        
        # Calculate cost
        total_cost = quantity * listing.price_per_unit
        
        # Check if buyer has enough cash
        buyer_nation = nation_system.nations.get(buyer_nation_id)
        if not buyer_nation:
            return False, "Buyer nation not found", 0.0
        
        if buyer_nation.cash < total_cost:
            return False, "Not enough cash", 0.0
        
        # Transfer cash from buyer to seller
        seller_nation = nation_system.nations.get(listing.seller_nation_id)
        if not seller_nation:
            return False, "Seller nation not found", 0.0
        
        buyer_nation.cash -= total_cost
        seller_nation.cash += total_cost
        
        # Add resources to buyer
        if listing.resource_type not in buyer_nation.resource_inventory:
            buyer_nation.resource_inventory[listing.resource_type] = 0.0
        buyer_nation.resource_inventory[listing.resource_type] += quantity
        
        # Update listing
        listing.quantity -= quantity
        if listing.quantity <= 0:
            listing.is_sold = True
            listing.is_active = False
        
        # Remove from resource listings if sold
        if listing.is_sold:
            if listing.resource_type in self.resource_listings:
                if listing.listing_id in self.resource_listings[listing.resource_type]:
                    self.resource_listings[listing.resource_type].remove(listing.listing_id)
        
        return True, "", total_cost
    
    def get_market_listings(self, resource_type: Optional[ResourceType] = None) -> List[MarketListing]:
        """Get market listings, optionally filtered by resource type."""
        if resource_type:
            listing_ids = self.resource_listings.get(resource_type, [])
            return [self.market_listings[lid] for lid in listing_ids if self.market_listings[lid].is_active]
        
        return [listing for listing in self.market_listings.values() if listing.is_active]
    
    def calculate_market_price(self, resource_type: ResourceType) -> float:
        """Calculate average market price for a resource."""
        listings = self.get_market_listings(resource_type)
        
        if not listings:
            return 0.0
        
        total_price = sum(listing.price_per_unit for listing in listings)
        return total_price / len(listings)
    
    # Tech Deals Methods
    
    def create_tech_deal(self, seller_nation_id: str, buyer_nation_id: str,
                       tech_levels: int, cash_price: float = 3000000.0,
                       required_resources: Optional[Dict[ResourceType, float]] = None) -> TechDeal:
        """Create a new tech deal."""
        deal = TechDeal(
            seller_nation_id=seller_nation_id,
            buyer_nation_id=buyer_nation_id,
            tech_levels=tech_levels,
            cash_price=cash_price,
            required_resources=required_resources or {}
        )
        
        self.tech_deals[deal.deal_id] = deal
        
        if seller_nation_id not in self.nation_tech_deals:
            self.nation_tech_deals[seller_nation_id] = []
        self.nation_tech_deals[seller_nation_id].append(deal.deal_id)
        
        if buyer_nation_id not in self.nation_tech_deals:
            self.nation_tech_deals[buyer_nation_id] = []
        self.nation_tech_deals[buyer_nation_id].append(deal.deal_id)
        
        return deal
    
    def complete_tech_deal(self, deal_id: str) -> bool:
        """Complete a tech deal."""
        if deal_id not in self.tech_deals:
            return False
        
        deal = self.tech_deals[deal_id]
        deal.is_completed = True
        deal.is_active = False
        deal.completed_at = datetime.now()
        
        return True
    
    def cancel_tech_deal(self, deal_id: str) -> bool:
        """Cancel a tech deal."""
        if deal_id not in self.tech_deals:
            return False
        
        deal = self.tech_deals[deal_id]
        deal.is_cancelled = True
        deal.is_active = False
        
        return True
    
    def get_nation_tech_deals(self, nation_id: str) -> List[TechDeal]:
        """Get all tech deals for a nation."""
        deal_ids = self.nation_tech_deals.get(nation_id, [])
        return [self.tech_deals[deal_id] for deal_id in deal_ids]
    
    def calculate_transaction_fee(self, has_free_trade_agreement: bool) -> float:
        """Calculate transaction fee for market trades."""
        base_fee = 0.02  # 2%
        if has_free_trade_agreement:
            base_fee = 0.01  # 1%
        return base_fee
    
    def calculate_sell_price_bonus(self, has_merchant_exchange: bool) -> float:
        """Calculate sell price bonus."""
        if has_merchant_exchange:
            return 0.08  # 8%
        return 0.0
    
    # Land Market Methods
    
    def can_list_land_on_market(self, nation_id: str, land_amount: int) -> tuple[bool, str]:
        """Check if a nation can list land on the market."""
        if land_amount <= 0:
            return False, "Must list positive land amount"
        return True, ""
    
    def create_land_market_listing(self, seller_nation_id: str, land_amount: int,
                                   price_per_unit: float, nation_system) -> tuple[bool, str, Optional[LandMarketListing]]:
        """Create a new land market listing and remove land from seller."""
        # Check if seller has enough land
        from_nation = nation_system.nations.get(seller_nation_id)
        if not from_nation:
            return False, "Nation not found", None
        
        if from_nation.land < land_amount:
            return False, "Not enough land to list", None
        
        # Remove land from seller
        from_nation.land -= land_amount
        
        # Create listing
        listing = LandMarketListing(
            seller_nation_id=seller_nation_id,
            land_amount=land_amount,
            price_per_unit=price_per_unit
        )
        
        self.land_market_listings[listing.listing_id] = listing
        return True, "", listing
    
    def buy_land_from_market(self, buyer_nation_id: str, listing_id: str,
                            land_amount: int, nation_system) -> tuple[bool, str, float]:
        """Buy land from a market listing."""
        if listing_id not in self.land_market_listings:
            return False, "Listing not found", 0.0
        
        listing = self.land_market_listings[listing_id]
        
        if not listing.is_active or listing.is_sold:
            return False, "Listing not available", 0.0
        
        if listing.seller_nation_id == buyer_nation_id:
            return False, "Cannot buy from yourself", 0.0
        
        if land_amount > listing.land_amount:
            return False, "Requested amount exceeds available", 0.0
        
        # Calculate cost
        total_cost = land_amount * listing.price_per_unit
        
        # Check if buyer has enough cash
        buyer_nation = nation_system.nations.get(buyer_nation_id)
        if not buyer_nation:
            return False, "Buyer nation not found", 0.0
        
        if buyer_nation.cash < total_cost:
            return False, "Not enough cash", 0.0
        
        # Transfer cash from buyer to seller
        seller_nation = nation_system.nations.get(listing.seller_nation_id)
        if not seller_nation:
            return False, "Seller nation not found", 0.0
        
        buyer_nation.cash -= total_cost
        seller_nation.cash += total_cost
        
        # Add land to buyer
        buyer_nation.land += land_amount
        
        # Update listing
        listing.land_amount -= land_amount
        if listing.land_amount <= 0:
            listing.is_sold = True
            listing.is_active = False
        
        return True, "", total_cost
    
    def get_land_market_listings(self) -> List[LandMarketListing]:
        """Get all active land market listings."""
        return [listing for listing in self.land_market_listings.values() if listing.is_active]
    
    # Tech Market Methods
    
    def can_list_tech_on_market(self, nation_id: str, tech_amount: int) -> tuple[bool, str]:
        """Check if a nation can list tech on the market."""
        if tech_amount <= 0:
            return False, "Must list positive tech amount"
        return True, ""
    
    def create_tech_market_listing(self, seller_nation_id: str, tech_amount: int,
                                   price_per_unit: float, nation_system) -> tuple[bool, str, Optional[TechMarketListing]]:
        """Create a new tech market listing and remove tech from seller."""
        # Check if seller has enough tech
        from_nation = nation_system.nations.get(seller_nation_id)
        if not from_nation:
            return False, "Nation not found", None
        
        if from_nation.technology < tech_amount:
            return False, "Not enough technology to list", None
        
        # Remove tech from seller
        from_nation.technology -= tech_amount
        
        # Create listing
        listing = TechMarketListing(
            seller_nation_id=seller_nation_id,
            tech_amount=tech_amount,
            price_per_unit=price_per_unit
        )
        
        self.tech_market_listings[listing.listing_id] = listing
        return True, "", listing
    
    def buy_tech_from_market(self, buyer_nation_id: str, listing_id: str,
                            tech_amount: int, nation_system) -> tuple[bool, str, float]:
        """Buy tech from a market listing."""
        if listing_id not in self.tech_market_listings:
            return False, "Listing not found", 0.0
        
        listing = self.tech_market_listings[listing_id]
        
        if not listing.is_active or listing.is_sold:
            return False, "Listing not available", 0.0
        
        if listing.seller_nation_id == buyer_nation_id:
            return False, "Cannot buy from yourself", 0.0
        
        if tech_amount > listing.tech_amount:
            return False, "Requested amount exceeds available", 0.0
        
        # Calculate cost
        total_cost = tech_amount * listing.price_per_unit
        
        # Check if buyer has enough cash
        buyer_nation = nation_system.nations.get(buyer_nation_id)
        if not buyer_nation:
            return False, "Buyer nation not found", 0.0
        
        if buyer_nation.cash < total_cost:
            return False, "Not enough cash", 0.0
        
        # Transfer cash from buyer to seller
        seller_nation = nation_system.nations.get(listing.seller_nation_id)
        if not seller_nation:
            return False, "Seller nation not found", 0.0
        
        buyer_nation.cash -= total_cost
        seller_nation.cash += total_cost
        
        # Add tech to buyer
        buyer_nation.technology += tech_amount
        
        # Update listing
        listing.tech_amount -= tech_amount
        if listing.tech_amount <= 0:
            listing.is_sold = True
            listing.is_active = False
        
        return True, "", total_cost
    
    def get_tech_market_listings(self) -> List[TechMarketListing]:
        """Get all active tech market listings."""
        return [listing for listing in self.tech_market_listings.values() if listing.is_active]
    
    # Cancel Listing Methods
    
    def cancel_market_listing(self, listing_id: str, nation_system) -> tuple[bool, str]:
        """Cancel a resource market listing and return resources to seller."""
        if listing_id not in self.market_listings:
            return False, "Listing not found"
        
        listing = self.market_listings[listing_id]
        
        if not listing.is_active or listing.is_sold:
            return False, "Listing cannot be cancelled"
        
        # Return remaining resources to seller
        seller_nation = nation_system.nations.get(listing.seller_nation_id)
        if seller_nation:
            if listing.resource_type not in seller_nation.resource_inventory:
                seller_nation.resource_inventory[listing.resource_type] = 0.0
            seller_nation.resource_inventory[listing.resource_type] += listing.quantity
        
        # Deactivate listing
        listing.is_active = False
        
        # Remove from resource listings
        if listing.resource_type in self.resource_listings:
            if listing.listing_id in self.resource_listings[listing.resource_type]:
                self.resource_listings[listing.resource_type].remove(listing.listing_id)
        
        return True, ""
    
    def cancel_land_market_listing(self, listing_id: str, nation_system) -> tuple[bool, str]:
        """Cancel a land market listing and return land to seller."""
        if listing_id not in self.land_market_listings:
            return False, "Listing not found"
        
        listing = self.land_market_listings[listing_id]
        
        if not listing.is_active or listing.is_sold:
            return False, "Listing cannot be cancelled"
        
        # Return remaining land to seller
        seller_nation = nation_system.nations.get(listing.seller_nation_id)
        if seller_nation:
            seller_nation.land += listing.land_amount
        
        # Deactivate listing
        listing.is_active = False
        
        return True, ""
    
    def cancel_tech_market_listing(self, listing_id: str, nation_system) -> tuple[bool, str]:
        """Cancel a tech market listing and return tech to seller."""
        if listing_id not in self.tech_market_listings:
            return False, "Listing not found"
        
        listing = self.tech_market_listings[listing_id]
        
        if not listing.is_active or listing.is_sold:
            return False, "Listing cannot be cancelled"
        
        # Return remaining tech to seller
        seller_nation = nation_system.nations.get(listing.seller_nation_id)
        if seller_nation:
            seller_nation.technology += listing.tech_amount
        
        # Deactivate listing
        listing.is_active = False
        
        return True, ""


# Singleton instance
trade_system = TradeSystem()

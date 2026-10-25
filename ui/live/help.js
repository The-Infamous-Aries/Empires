"use strict";
// Player-facing descriptions of the persistent server's mechanics. No formulas.
(function (root) {
  const topics = [
    {
      id: "nation",
      title: "Your nation & the living clock",
      tips: [
        "The world has no pause button. One real hour is one game day. Income, production, upkeep and deadlines continue when you change tabs or sign out. After a server restart, elapsed time is caught up from the saved world.",
        "Land provides building slots and territory blocks. Infrastructure and effective technology support population. Larger purchases can change the price of the next unit; use the full purchase preview before spending.",
        "Owned technology belongs to you. Shared technology comes from active intelligence treaties when you have a Financial Assistance Office. Effective technology includes both and is used for prerequisites. Research discoveries are a separate progression tree.",
        "The budget shows projected taxes and research income less military upkeep for a turn. Trades, construction, aid, club spending and other transactions change your treasury separately. Keep reserves for money and resource upkeep.",
        "Happiness, literacy and environment are national scores; higher is better. Disease and crime reduce productive population. Pollution is measured in points, and lower is better.",
        "Government and religion affect different national outcomes. Statues lock the matching selection unless you have its monument. With a monument, changes have a 14-turn cooldown. Domestic policies require an Internal Affairs Office.",
      ],
    },
    {
      id: "build",
      title: "Construction: improvements, projects & wonders",
      tips: [
        "Choose a construction category to see its catalog. Every card shows ownership, cost, prerequisites and current availability. A disabled Build button lists what is missing; technology alone does not satisfy resource, slot or cooldown requirements.",
        "Improvements use slots from land blocks. Projects and wonders need more land per slot and have separate construction cooldowns. Broadcasting does not occupy a project slot. The capacity summary shows your current limits.",
        "Construction completes immediately when accepted. Projects and wonders may then require a wait before another can be built. Their cooldowns are shown in game turns.",
        "Demolition is available only for owned, removable buildings. Permanent buildings and dependencies can block demolition. Removing capacity cannot leave your nation above a supported limit. A Salvage Yard can recover part of construction costs.",
      ],
    },
    {
      id: "research",
      title: "Research & technology",
      tips: [
        "Research requires the listed effective technology, earlier discoveries, money and an available queue slot. The Great Library opens a second research slot. Research continues while you are away.",
        "Government, policies, buildings, resource combinations and world effects can change research speed. Work already completed is preserved when speed changes. The queue shows current progress and expected completion.",
        "Completed discoveries contribute to the active bonuses panel. Advanced bonuses have diminishing returns: further contributions still help, but each adds less as the bonus approaches its limit.",
        "Cancelling queued research returns half of the money paid and discards its progress. Check both the research cost and your next upkeep before starting.",
      ],
    },
    {
      id: "military",
      title: "Military readiness & war",
      tips: [
        "Unit cards show purchase costs, capacity, prerequisites and upkeep. Quantity previews show the whole purchase, temporary workforce or happiness effects, and the sale return. Sales return part of the money actually paid; automatically produced units add no sale value.",
        "Upkeep consumes money and resources every game day. Soldier and tank upkeep rounds up by groups, even for a partially filled group. Research and world effects can change the effective upkeep shown. Unpaid upkeep reduces military strength until a later turn can pay it.",
        "War declarations require available offensive and defensive slots. Allies, active peace treaties, an existing war and world peace enforcement can prevent a declaration.",
        "Wars have a preparation period followed by timed rounds. Select an opposing nation and operation. Operations need energy and military strength; missiles, nuclear weapons and spy missions also need the appropriate units and intuition. World rules can ban nuclear attacks.",
        "Conventional attacks depend on attacker readiness and target defenses. The displayed attack value is a starting value, not guaranteed damage. Critical hits, relationships and defensive effects are resolved in combat. Spy missions create time-stamped intelligence reports.",
        "Principal nations may offer white peace. Both must agree. Reinforcements join through treaty calls during preparation.",
      ],
    },
    {
      id: "diplomacy",
      title: "Friend, foe & treaty diplomacy",
      tips: [
        "Relationships and treaties are separate. Friend, best friend, foe, nemesis and neutral selections affect diplomatic capacity or combat benefits as described on the Diplomacy screen. Use its availability explanation before changing a relationship.",
        "Treaties need the listed diplomatic buildings and capacity on both sides. A proposal takes effect only when accepted. Peace agreements prevent war; technology and intelligence agreements share their specific benefits while active.",
        "Treaty war calls may be mandatory or optional. Mandatory refusal or expiry can apply the displayed temporary happiness penalty and agreed compensation. Optional calls can be declined without those penalties. Respond before the preparation deadline.",
        "Shared intelligence is an observation from the report's timestamp. It does not reveal an opponent's live treasury or current inventory. When sharing ends, that partner's reports stop being available.",
        "Aid reserves a slot and money or technology according to its type. Check the aid status and return deadline; sending aid does not mean it has already been accepted.",
      ],
    },
    {
      id: "trade",
      title: "Resources, manufacturing & trade",
      tips: [
        "Your stockpile is available inventory. Market offers reserve money or resources in escrow. Offers fill in full. Cancelling starts a 12-turn return wait, so reserved assets are not immediately spendable again.",
        "The acceptor pays any applicable tariff. Embargoes on either nation can block the transaction. The accept button's preview includes the money and resources needed.",
        "Recurring exchanges need a Port and a partner slot on both sides. Pending agreements reserve capacity. A Trade Hub lets the proposer offer a permanent agreement. Both nations must supply the agreed quantities for a delivery; no partial delivery occurs.",
        "Resource combinations activate when their required resources and technology are available. Spending the last of a required resource can remove a bonus. Food or water independence can provide access for combinations without adding stock to sell.",
        "Assembly Plants run enabled manufacturing lines each hourly turn when ingredients are available. You can also manufacture batches immediately. Disabling a line stops its automatic ingredient consumption.",
      ],
    },
    {
      id: "alliance",
      title: "Alliance membership & permissions",
      tips: [
        "Alliances have a charter, membership roles and a shared treasury. Apply to an open alliance or found one when your nation meets the requirements. The page shows your current permissions.",
        "Available controls depend on your role. Member management, settings, treasury withdrawals and leadership changes require their respective permissions. Contributing money transfers it from your nation to the alliance treasury.",
        "Unique or limited roles have a maximum number of holders. A founder must transfer leadership before leaving an alliance with other members. Review the activity log to follow treasury and membership changes.",
      ],
    },
    {
      id: "world",
      title: "Color forums, World Congress & elections",
      tips: [
        "Broadcasting unlocks your color forum. Broadcasting plus the Internet wonder unlocks world affairs. Voting also requires at least 24 real hours of faction membership.",
        "Color motions have a 24-real-hour voting period. World motions first collect national votes, then enter a 48-hour congress stage. Each faction's result is weighted by its seats; the raw total of individual votes is not the final congress tally.",
        "You can cast one vote per motion. Abstentions count toward the support denominator. Tied faction results abstain. Only elected representatives can propose world motions, and each author can have at most three active proposals.",
        "In an open election, select distinct eligible candidates up to your faction's seat count. Your ballot can be updated before the deadline. Passed motions apply their listed effects until expiry.",
        "Forum durations are in real days. The live calendar is fixed: game turns remain hourly.",
      ],
    },
    {
      id: "news",
      title: "Publishing news",
      tips: [
        "Open an article to read, react or comment. Write a headline, choose a category and add your story in the newsroom. Preview lets you check the article before publishing.",
        "Only the author can edit or delete an article. You may publish up to ten articles per real hour. Each article accepts up to 500 comments. Text is displayed as text, so pasted HTML does not run.",
      ],
    },
    {
      id: "messages",
      title: "Messages & privacy",
      tips: [
        "World messages are public. Alliance messages are for members of that alliance. Private conversations are visible to the sender and recipient.",
        "A recipient can disable incoming private messages in Settings. Online status and public national statistics have separate privacy controls. Existing messages remain in their conversation.",
      ],
    },
    {
      id: "map",
      title: "Territory & the world atlas",
      tips: [
        "Buying land gives you blocks that can be placed on the map. Select an unclaimed square to inspect whether you can claim it. After the first square, new claims must share an edge with your territory.",
        "Map claims use unplaced blocks rather than charging the land purchase again. You cannot claim occupied squares or squares outside the world boundary. Use My nation to return to your territory; arrow keys move the selection.",
      ],
    },
    {
      id: "team",
      title: "Sports clubs & betting",
      tips: [
        "Each sport requires its matching stadium wonder. Creating a club funds a starting roster and club budget from your national treasury. Club funds pay for player contracts and facilities; national funds pay competition prizes and bets.",
        "Choose available players in the correct positions for your lineup. Assigning a player already in the lineup moves that player to the new slot. Check the previous slot afterward. Injured and retired players cannot start.",
        "Competitions schedule and resolve matches while you are away. Registration and betting close at their deadlines. Sports Betting enables one winner bet per fixture; you cannot bet on a fixture involving your own club. Stakes are deducted immediately and winning returns settle after the match.",
      ],
    },
    {
      id: "leaderboard",
      title: "Leaderboards & awards",
      tips: [
        "Rankings use real UTC calendar periods. Weeks begin Monday, months begin on the first, and years begin January 1. These periods are separate from the hourly game clock.",
        "Current shows achievements earned during this period, or the highest recorded value for strength, population, treasury and owned technology. Average and Best compare completed periods since tracking began. The first partial period counts once it closes; unfinished periods do not affect those summaries.",
        "Total shows lifetime achievement counts or the highest recorded peak. Existing lifetime counts are retained when tracking is introduced, but earlier weekly, monthly and yearly results cannot be reconstructed.",
        "Most Wins counts completed war victories, including winning treaty participants. Sports results remain on the Team page. Equal scores share a rank; zero scores receive no medal.",
        "The top three receive matching award images. Strength, war wins, missile and nuclear hits and misses use the prestige medal set. Population and treasury, technology and research, construction and trade, and territory and treaties use the other four award sets.",
        "Public rankings respect Publish national statistics in Settings. Turn it on to appear. Period results and peaks update after successful actions and scheduled world events, and survive restarts.",
      ],
    },
    {
      id: "settings",
      title: "Saving, disabled actions & reconnecting",
      tips: [
        "Successful actions save automatically. The server checks every action against the current world, so a price or availability can change while you are choosing. Previews do not reserve money, units or slots.",
        "When a button is disabled, read the nearby requirement or availability message. Check the full quantity, money, resources, prerequisites, cooldown, capacity and permissions. Fix invalid or missing form fields too.",
        "While reconnecting, actions are disabled and drafts are retained. Wait for World connected before submitting. A disconnected browser does not pause the game.",
        "Enable background music in Settings and choose a volume. Peace songs play when you have no ongoing war; war songs play during preparation and active wars, including treaty participation. A pending treaty call alone does not place you at war. Music stops at sign out. Your browser may need a click on Resume music after a reload.",
        "Theme, music, text size and reduced motion are saved in this browser. Notification and privacy settings belong to your player account.",
      ],
    },
  ];
  function tips(state) {
    const n = state.nation,
      result = [];
    if (n.militaryMaintenanceDeficit)
      result.push({
        page: "military",
        text: "Your last upkeep was unpaid. Check the money and resources needed before the next turn.",
      });
    if (n.budget.balance < 0)
      result.push({
        page: "nation",
        text: "Your projected turn balance is negative. Review income and upkeep, and keep a treasury reserve.",
      });
    if (n.activeResearch.length < (n.wonders.great_library ? 2 : 1))
      result.push({
        page: "research",
        text: "You have an open research slot. Check available discoveries and their prerequisites.",
      });
    if (n.territories.length < n.mapBlocks)
      result.push({
        page: "map",
        text: "You have unplaced land blocks. Inspect adjacent unclaimed territory on the map.",
      });
    if (
      state.diplomacy.calls.some(
        (c) => c.nation === n.id && c.status === "pending",
      )
    )
      result.push({
        page: "diplomacy",
        text: "A treaty war call needs your response before its deadline. Read whether participation is mandatory.",
      });
    if (!result.length)
      result.push({
        page: "build",
        text: "Review construction availability and your next upkeep before investing. All tabs share the same live nation.",
      });
    return result;
  }
  const help = { topics, tips };
  if (typeof module !== "undefined" && module.exports) module.exports = help;
  else root.EmpiresHelp = help;
})(globalThis);

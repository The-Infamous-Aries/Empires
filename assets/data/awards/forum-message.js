const AwardData_forumMessage = [
  // Forum posts
  { id: 'forum_legend', name: 'Forum Legend', description: 'Post 25 forum messages', category: 'forum-message', icon: '💬', trackKey: 'statistics.forumPostsTotal', threshold: 25, type: 'counter' },
  { id: 'forum_legend_elite', name: 'Elite Forum Legend', description: 'Post 50 forum messages', category: 'forum-message', icon: '💬', trackKey: 'statistics.forumPostsTotal', threshold: 50, type: 'counter' },
  { id: 'forum_legend_grandmaster', name: 'Grandmaster Forum Legend', description: 'Post 75 forum messages', category: 'forum-message', icon: '💬', trackKey: 'statistics.forumPostsTotal', threshold: 75, type: 'counter' },
  { id: 'forum_legend_emperor', name: 'Emperor Forum Legend', description: 'Post 100 forum messages', category: 'forum-message', icon: '💬', trackKey: 'statistics.forumPostsTotal', threshold: 100, type: 'counter' },
  { id: 'forum_legend_titan', name: 'Titan Forum Legend', description: 'Post 150 forum messages', category: 'forum-message', icon: '💬', trackKey: 'statistics.forumPostsTotal', threshold: 150, type: 'counter' },
  { id: 'forum_legend_overlord', name: 'Overlord Forum Legend', description: 'Post 200 forum messages', category: 'forum-message', icon: '💬', trackKey: 'statistics.forumPostsTotal', threshold: 200, type: 'counter' },
  { id: 'forum_legend_archon', name: 'Archon Forum Legend', description: 'Post 250 forum messages', category: 'forum-message', icon: '💬', trackKey: 'statistics.forumPostsTotal', threshold: 250, type: 'counter' },
  { id: 'forum_legend_sovereign', name: 'Sovereign Forum Legend', description: 'Post 500 forum messages', category: 'forum-message', icon: '💬', trackKey: 'statistics.forumPostsTotal', threshold: 500, type: 'counter' },
  { id: 'forum_legend_god', name: 'God Forum Legend', description: 'Post 1000 forum messages', category: 'forum-message', icon: '💬', trackKey: 'statistics.forumPostsTotal', threshold: 1000, type: 'counter' },
  // Forum threads
  { id: 'thread_starter', name: 'Thread Starter', description: 'Create 25 forum threads', category: 'forum-message', icon: '🧵', trackKey: 'statistics.forumThreadsCreated', threshold: 25, type: 'counter' },
  { id: 'thread_starter_elite', name: 'Elite Thread Starter', description: 'Create 50 forum threads', category: 'forum-message', icon: '🧵', trackKey: 'statistics.forumThreadsCreated', threshold: 50, type: 'counter' },
  { id: 'thread_starter_grandmaster', name: 'Grandmaster Thread Starter', description: 'Create 75 forum threads', category: 'forum-message', icon: '🧵', trackKey: 'statistics.forumThreadsCreated', threshold: 75, type: 'counter' },
  { id: 'thread_starter_emperor', name: 'Emperor Thread Starter', description: 'Create 100 forum threads', category: 'forum-message', icon: '🧵', trackKey: 'statistics.forumThreadsCreated', threshold: 100, type: 'counter' },
  { id: 'thread_starter_titan', name: 'Titan Thread Starter', description: 'Create 150 forum threads', category: 'forum-message', icon: '🧵', trackKey: 'statistics.forumThreadsCreated', threshold: 150, type: 'counter' },
  { id: 'thread_starter_overlord', name: 'Overlord Thread Starter', description: 'Create 200 forum threads', category: 'forum-message', icon: '🧵', trackKey: 'statistics.forumThreadsCreated', threshold: 200, type: 'counter' },
  { id: 'thread_starter_archon', name: 'Archon Thread Starter', description: 'Create 250 forum threads', category: 'forum-message', icon: '🧵', trackKey: 'statistics.forumThreadsCreated', threshold: 250, type: 'counter' },
  { id: 'thread_starter_sovereign', name: 'Sovereign Thread Starter', description: 'Create 500 forum threads', category: 'forum-message', icon: '🧵', trackKey: 'statistics.forumThreadsCreated', threshold: 500, type: 'counter' },
  { id: 'thread_starter_god', name: 'God Thread Starter', description: 'Create 1000 forum threads', category: 'forum-message', icon: '🧵', trackKey: 'statistics.forumThreadsCreated', threshold: 1000, type: 'counter' },
  // World forum motions proposed
  { id: 'statesman', name: 'Statesman', description: 'Propose 25 world forum motions', category: 'forum-message', icon: '🗳️', trackKey: 'statistics.worldForumMotionsProposed', threshold: 25, type: 'counter' },
  { id: 'statesman_elite', name: 'Elite Statesman', description: 'Propose 50 world forum motions', category: 'forum-message', icon: '🗳️', trackKey: 'statistics.worldForumMotionsProposed', threshold: 50, type: 'counter' },
  { id: 'statesman_grandmaster', name: 'Grandmaster Statesman', description: 'Propose 75 world forum motions', category: 'forum-message', icon: '🗳️', trackKey: 'statistics.worldForumMotionsProposed', threshold: 75, type: 'counter' },
  { id: 'statesman_emperor', name: 'Statesman Emperor', description: 'Propose 100 world forum motions', category: 'forum-message', icon: '🗳️', trackKey: 'statistics.worldForumMotionsProposed', threshold: 100, type: 'counter' },
  // World forum motions passed
  { id: 'kingmaker', name: 'Kingmaker', description: 'Have 25 motions passed in World Forum', category: 'forum-message', icon: '👑', trackKey: 'statistics.worldForumMotionsPassed', threshold: 25, type: 'counter' },
  { id: 'kingmaker_elite', name: 'Elite Kingmaker', description: 'Have 50 motions passed in World Forum', category: 'forum-message', icon: '👑', trackKey: 'statistics.worldForumMotionsPassed', threshold: 50, type: 'counter' },
  { id: 'kingmaker_grandmaster', name: 'Grandmaster Kingmaker', description: 'Have 75 motions passed in World Forum', category: 'forum-message', icon: '👑', trackKey: 'statistics.worldForumMotionsPassed', threshold: 75, type: 'counter' },
  { id: 'kingmaker_emperor', name: 'Emperor Kingmaker', description: 'Have 100 motions passed in World Forum', category: 'forum-message', icon: '👑', trackKey: 'statistics.worldForumMotionsPassed', threshold: 100, type: 'counter' },
  // World forum motions voted
  { id: 'united_nations', name: 'United Nations', description: 'Vote in 100 world forum motions', category: 'forum-message', icon: '🌍', trackKey: 'statistics.worldForumMotionsVoted', threshold: 100, type: 'counter' },
  { id: 'united_nations_elite', name: 'Elite United Nations', description: 'Vote in 250 world forum motions', category: 'forum-message', icon: '🌍', trackKey: 'statistics.worldForumMotionsVoted', threshold: 250, type: 'counter' },
  { id: 'united_nations_grandmaster', name: 'Grandmaster United Nations', description: 'Vote in 500 world forum motions', category: 'forum-message', icon: '🌍', trackKey: 'statistics.worldForumMotionsVoted', threshold: 500, type: 'counter' },
  { id: 'united_nations_emperor', name: 'Emperor United Nations', description: 'Vote in 1000 world forum motions', category: 'forum-message', icon: '🌍', trackKey: 'statistics.worldForumMotionsVoted', threshold: 1000, type: 'counter' },
  // Calendar reform
  { id: 'calendar_reformer', name: 'Calendar Reformer', description: 'Pass a calendar reform motion', category: 'forum-message', icon: '📅', trackKey: 'statistics.worldForumCalendarReforms', threshold: 1, type: 'counter' },
];

if (typeof window !== 'undefined') {
    window.AwardData_forumMessage = AwardData_forumMessage;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AwardData_forumMessage;
}

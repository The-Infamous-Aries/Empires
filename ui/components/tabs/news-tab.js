"use strict";
/**
 * News Tab - Sovereignty Epochs
 * Renders the full News tab content (news board + article view).
 *
 * Exports: renderNewsTab(state) -> HTML string
 */

/* ════════════════════════════════════════════════════════════════════════════
   LOCAL UI HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
const human = (value) =>
  String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
const number = (value) =>
  Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const date = (value) => new Date(value).toLocaleString();
const empty = (message) => `<div class="empty">${esc(message)}</div>`;
const button = (label, action, data, enabled = true, style = "primary") =>
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(
    JSON.stringify(data),
  )}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;
const nationName = (state, id) =>
  state?.nations?.find((n) => n.id === id)?.name || "Unknown nation";
const stripTags = (html) =>
  String(html ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/* ════════════════════════════════════════════════════════════════════════════
   REACTION HELPERS
   Like / dislike (sentiment group, mutually exclusive), levels 1-6.
   Wtf / lol (reaction group, mutually exclusive), levels 1-6.
   Emoji reactions (no level, additive).
   Displayed count = sum of ratings across users.
   ════════════════════════════════════════════════════════════════════════════ */

const SENTIMENT_TYPES = ["like", "dislike"];
const REACTION_TYPES = ["lol", "wtf"];
const THEME_EMOJIS = ["💀", "🔥", "🎉", "💩"];

const reactionStats = (reactions) => {
  const stats = { like: 0, dislike: 0, lol: 0, wtf: 0, emojis: {}, users: 0 };
  if (!reactions) return stats;
  for (const [, userReaction] of Object.entries(reactions)) {
    if (!userReaction) continue;
    stats.users++;
    if (userReaction.sentiment) {
      if (userReaction.sentiment.type === "like")
        stats.like += Number(userReaction.sentiment.rating) || 0;
      else if (userReaction.sentiment.type === "dislike")
        stats.dislike += Number(userReaction.sentiment.rating) || 0;
    }
    if (userReaction.reaction) {
      if (userReaction.reaction.type === "lol")
        stats.lol += Number(userReaction.reaction.rating) || 0;
      else if (userReaction.reaction.type === "wtf")
        stats.wtf += Number(userReaction.reaction.rating) || 0;
    }
    if (userReaction.emojis) {
      for (const emoji of Object.keys(userReaction.emojis)) {
        stats.emojis[emoji] = (stats.emojis[emoji] || 0) + 1;
      }
    }
  }
  return stats;
};

const userReaction = (reactions, nationId) => {
  if (!reactions || !nationId || !reactions[nationId]) return null;
  return reactions[nationId];
};

/* ════════════════════════════════════════════════════════════════════════════
   REACTION BADGES
   ════════════════════════════════════════════════════════════════════════════ */

const reactionBadge = (label, value, active = false) =>
  `<span class="news-reaction ${active ? "active" : ""}" title="${esc(label)}">${esc(label)} ${number(value)}</span>`;

const reactionRow = (state, article, nationId) => {
  const stats = reactionStats(article.reactions);
  const mine = userReaction(article.reactions, nationId);
  const mineSentiment = mine && mine.sentiment ? mine.sentiment.type : null;
  const mineReaction = mine && mine.reaction ? mine.reaction.type : null;
  return `<div class="news-reactions">
    ${reactionBadge("Like", stats.like, mineSentiment === "like")}
    ${reactionBadge("Dislike", stats.dislike, mineSentiment === "dislike")}
    ${reactionBadge("Lol", stats.lol, mineReaction === "lol")}
    ${reactionBadge("Wtf", stats.wtf, mineReaction === "wtf")}
    ${Object.entries(stats.emojis)
      .map(
        ([emoji, count]) =>
          `<span class="news-reaction news-emoji ${mine && mine.emojis && mine.emojis[emoji] ? "active" : ""}" title="${esc(emoji)}">${emoji} ${number(count)}</span>`,
      )
      .join("")}
    <button class="section news-react-btn" data-action="newsReact" data-payload="${esc(
      JSON.stringify({ id: article.id }),
    )}">React</button>
  </div>`;
};

/* ════════════════════════════════════════════════════════════════════════════
   NEWS BOARD — post card
   ════════════════════════════════════════════════════════════════════════════ */

const postCard = (state, article) => {
  const nationId = state.nation.id;
  const stats = reactionStats(article.reactions);
  const totalEmoji = Object.values(stats.emojis).reduce((a, b) => a + b, 0);
  return `<article class="news-post card" data-list-item data-status="${article.author === nationId ? "mine" : "other"}" data-section="${esc(article.category)}" data-search="${esc(article.title + " " + stripTags(article.body) + " " + nationName(state, article.author))}">
    <div class="eyebrow">${esc(article.category)}</div>
    <h2 class="news-title section">${esc(article.title)}</h2>
    <div class="news-meta">By ${esc(nationName(state, article.author))} � ${date(article.createdAt)}${article.editedAt ? " � Edited " + date(article.editedAt) : ""}</div>
    <p class="news-preview">${esc(stripTags(article.body).slice(0, 300))}${stripTags(article.body).length > 300 ? "…" : ""}</p>
    <div class="news-stats">
      <span class="news-stat"><strong>${number(stats.like)}</strong> likes</span>
      <span class="news-stat"><strong>${number(stats.dislike)}</strong> dislikes</span>
      <span class="news-stat"><strong>${number(stats.lol)}</strong> lols</span>
      <span class="news-stat"><strong>${number(stats.wtf)}</strong> wtfs</span>
      <span class="news-stat"><strong>${number(article.comments.length)}</strong> comments</span>
    </div>
    <div class="row spread news-actions section">
      <button data-view="article" data-value="${article.id}">Read article ?</button>
      ${reactionRow(state, article, nationId)}
      ${article.author === nationId
        ? `${button("Edit", "newsEdit", { id: article.id })}${button("Delete", "newsDelete", { id: article.id }, true, "danger")}`
        : ""}
    </div>
  </article>`;
};

/* ════════════════════════════════════════════════════════════════════════════
   COMMENT CARD
   ════════════════════════════════════════════════════════════════════════════ */

const commentCard = (state, comment, articleId) => {
  const nationId = state.nation.id;
  const stats = reactionStats(comment.reactions);
  const mine = userReaction(comment.reactions, nationId);
  const mineSentiment = mine && mine.sentiment ? mine.sentiment.type : null;
  const mineReaction = mine && mine.reaction ? mine.reaction.type : null;
  return `<div class="news-comment card" data-comment-id="${esc(comment.id)}">
    <div class="news-comment-meta">${esc(nationName(state, comment.author))} � ${date(comment.createdAt)}${comment.editedAt ? " � Edited" : ""}</div>
    <div class="news-comment-body">${comment.body}</div>
    <div class="news-comment-reactions">
      ${reactionBadge("Like", stats.like, mineSentiment === "like")}
      ${reactionBadge("Dislike", stats.dislike, mineSentiment === "dislike")}
      ${reactionBadge("Lol", stats.lol, mineReaction === "lol")}
      ${reactionBadge("Wtf", stats.wtf, mineReaction === "wtf")}
      ${Object.entries(stats.emojis)
        .map(
          ([emoji, count]) =>
            `<span class="news-reaction news-emoji ${mine && mine.emojis && mine.emojis[emoji] ? "active" : ""}" title="${esc(emoji)}">${emoji} ${number(count)}</span>`,
        )
        .join("")}
      <button class="section news-comment-react-btn" data-action="newsCommentReact" data-payload="${esc(JSON.stringify({ articleId, commentId: comment.id }))}">React</button>
    </div>
    <div class="news-comment-actions row section">
      ${comment.author === nationId
        ? `${button("Edit", "newsEditComment", { commentId: comment.id })}${button("Delete", "newsDeleteComment", { commentId: comment.id }, true, "danger")}`
        : ""}
    </div>
  </div>`;
};

/* ════════════════════════════════════════════════════════════════════════════
   RENDER NEWS TAB
   ════════════════════════════════════════════════════════════════════════════ */

function renderNewsTab(state) {
  const n = state.nation;
  const articleId = state.articleId;
  const article = articleId ? state.articles.find((a) => a.id === articleId) : null;

  const masthead = `<header class="news-masthead"><div class="eyebrow">Independent voices from every nation</div><h1>The Dominion Herald</h1><div class="eyebrow">Year ${Math.floor(state.day / 360) + 1} � Day ${(state.day % 360) + 1} &nbsp; / &nbsp; World news & opinion</div><button class="section" data-help-topic="news">Help with publishing</button></header>`;

  const formComment = (aid) =>
    `<form id="news-comment-form" data-command="comment"><input type="hidden" name="id" value="${esc(aid)}"><textarea name="body" placeholder="Write your comment…" required maxlength="2000"></textarea><div class="form-footer"><button class="primary">Post comment</button></div></form>`;

  if (article) {
    const mine = article.author === n.id;
    const stats = reactionStats(article.reactions);
    const mineReaction = userReaction(article.reactions, n.id);
    const reactionSummary = `<div class="news-reaction-summary">${reactionBadge("Like", stats.like)}${reactionBadge("Dislike", stats.dislike)}${reactionBadge("Lol", stats.lol)}${reactionBadge("Wtf", stats.wtf)}${Object.entries(stats.emojis)
      .map(([emoji, count]) => `<span class="news-reaction news-emoji">${emoji} ${number(count)}</span>`)
      .join("")}</div>`;
    const yourReaction = mineReaction
      ? `<div class="news-your-reaction muted">Your reaction: ${mineReaction.sentiment ? mineReaction.sentiment.type + " " + mineReaction.sentiment.rating : ""}${mineReaction.reaction ? " · " + mineReaction.reaction.type + " " + mineReaction.reaction.rating : ""}${mineReaction.emojis ? " · " + Object.keys(mineReaction.emojis).join(", ") : ""}</div>`
      : "";
    return `${masthead}<button data-view="article" data-value="">? Back to the newsroom</button><div class="two-column section"><article class="card news-article"><div class="eyebrow">${esc(article.category)}</div><h1 class="section">${esc(article.title)}</h1><div class="article-meta">By ${esc(nationName(state, article.author))} � ${date(article.createdAt)}${article.editedAt ? " � Edited " + date(article.editedAt) : ""}</div><div class="article-body news-body">${article.body}</div><div class="news-article-actions row section">${reactionSummary}${yourReaction}<button class="section" data-action="newsReact" data-payload="${esc(JSON.stringify({ id: article.id }))}">React ?</button>${mine ? `${button("Edit", "newsEdit", { id: article.id })}${button("Delete", "newsDelete", { id: article.id }, true, "danger")}` : ""}</div></article><section class="card news-comments"><h3>Discussion � ${article.comments.length}</h3>${article.comments.length ? article.comments.map((c) => commentCard(state, c, article.id)).join("") : '<p class="muted">Start the conversation.</p>'}<div class="news-comment-form section">${formComment(article.id)}</div></section></div>`;
  }

  return `${masthead}<div class="two-column"><section class="stack news-board">${state.articles.length ? state.articles.map((a) => postCard(state, a)).join("") : empty("The presses are ready. Publish the first story from your nation.")}</section><aside class="card" style="align-self:start"><h2>Publish an article</h2><p class="muted">Share reporting, announcements, analysis, or an opinion with the world.</p>${button("Write a post", "newsCreate")}<p class="help">Articles are visible to every nation. You can edit or delete your own stories.</p></aside></div>`;
}

window.renderNewsTab = renderNewsTab;

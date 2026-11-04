"use strict";
/**
 * News Modals - Sovereignty Epochs
 * Popup modals for the News tab: reaction ranking modal, rich-text article
 * editor, and comment editor. Pure HTML generators rendered inside
 * <dialog> by game.js.
 */

/* ════════════════════════════════════════════════════════════════════════════
   LOCAL HELPERS
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
const number = (value) =>
  Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const date = (value) => new Date(value).toLocaleString();
const button = (label, action, data, enabled = true, style = "primary") =>
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(
    JSON.stringify(data),
  )}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;

const SENTIMENT_TYPES = ["like", "dislike"];
const REACTION_TYPES = ["lol", "wtf"];
const RANK_LEVELS = [1, 2, 3, 4, 5, 6];
const THEME_EMOJIS = ["💀", "🔥", "😂", "😱", "👍", "👎", "🎉", "💩"];

/* Draft reaction held while the ranking modal is open. game.js owns it and
   re-renders the modal on each interaction so the UI stays in sync. */
let newsReactionDraft = null;
window.getNewsReactionDraft = () => newsReactionDraft;
window.setNewsReactionDraft = (value) => {
  newsReactionDraft = value;
};

/* ════════════════════════════════════════════════════════════════════════════
   REACTION RANKING MODAL
   Like / dislike (one sentiment, level 1-6).
   Wtf / lol (one reaction, level 1-6).
   Theme emojis (toggle, no level).
   ════════════════════════════════════════════════════════════════════════════ */

const levelButtons = (group, type, selectedLevel) =>
  RANK_LEVELS.map(
    (lvl) =>
      `<button class="news-rank-level ${selectedLevel === lvl ? "active" : ""}" data-action="newsReactSetLevel" data-payload="${esc(JSON.stringify({ group, type, level: lvl }))}">${lvl}</button>`,
  ).join("");

const sentimentPick = (state, draft) => {
  const sentiment = (draft && draft.sentiment) || null;
  const likeLevel = (sentiment && sentiment.type === "like" && sentiment.rating) || 1;
  const dislikeLevel = (sentiment && sentiment.type === "dislike" && sentiment.rating) || 1;
  return `<div class="news-modal-group"><h3>Sentiment (pick one)</h3><div class="news-reaction-pick"><div class="news-reaction-choice"><button class="news-reaction-choice-btn ${sentiment && sentiment.type === "like" ? "active" : ""}" data-action="newsReactSetSentiment" data-payload="${esc(JSON.stringify({ type: "like" }))}">Like</button>${levelButtons("sentiment", "like", likeLevel)}</div><div class="news-reaction-choice"><button class="news-reaction-choice-btn ${sentiment && sentiment.type === "dislike" ? "active" : ""}" data-action="newsReactSetSentiment" data-payload="${esc(JSON.stringify({ type: "dislike" }))}">Dislike</button>${levelButtons("sentiment", "dislike", dislikeLevel)}</div><button class="section" data-action="newsReactClearSentiment">Clear sentiment</button></div></div>`;
};

const reactionPick = (state, draft) => {
  const reaction = (draft && draft.reaction) || null;
  const lolLevel = (reaction && reaction.type === "lol" && reaction.rating) || 1;
  const wtfLevel = (reaction && reaction.type === "wtf" && reaction.rating) || 1;
  return `<div class="news-modal-group"><h3>Reaction (pick one)</h3><div class="news-reaction-pick"><div class="news-reaction-choice"><button class="news-reaction-choice-btn ${reaction && reaction.type === "lol" ? "active" : ""}" data-action="newsReactSetSentiment" data-payload="${esc(JSON.stringify({ type: "lol" }))}">Lol</button>${levelButtons("reaction", "lol", lolLevel)}</div><div class="news-reaction-choice"><button class="news-reaction-choice-btn ${reaction && reaction.type === "wtf" ? "active" : ""}" data-action="newsReactSetSentiment" data-payload="${esc(JSON.stringify({ type: "wtf" }))}">Wtf</button>${levelButtons("reaction", "wtf", wtfLevel)}</div><button class="section" data-action="newsReactClearReaction">Clear reaction</button></div></div>`;
};

const emojiPick = (draft) => {
  const emojis = (draft && draft.emojis) || {};
  return `<div class="news-modal-group"><h3>Theme emojis</h3><div class="news-emoji-pick">${THEME_EMOJIS.map(
    (emoji) =>
      `<button class="news-emoji-btn ${emojis[emoji] ? "active" : ""}" data-action="newsReactToggleEmoji" data-payload="${esc(JSON.stringify({ emoji }))}">${emoji}</button>`,
  ).join("")}</div></div>`;
};

const draftSummary = (draft) => {
  if (!draft) return '<span class="muted">No reaction selected.</span>';
  const parts = [];
  if (draft.sentiment)
    parts.push(`${draft.sentiment.type} ${draft.sentiment.rating}`);
  if (draft.reaction)
    parts.push(`${draft.reaction.type} ${draft.reaction.rating}`);
  if (draft.emojis) parts.push(Object.keys(draft.emojis).join(", "));
  return `<span class="news-draft-summary">${parts.length ? parts.join(" · ") : "None"}</span>`;
};

function newsReactionModalContent(state, articleId, options = {}) {
  const { targetType = "article", commentId = null } = options;
  const draft = newsReactionDraft || { sentiment: null, reaction: null, emojis: {} };
  return `<form id="news-reaction-form"><input type="hidden" name="id" value="${esc(articleId)}"><input type="hidden" name="targetType" value="${esc(targetType)}">${commentId ? `<input type="hidden" name="commentId" value="${esc(commentId)}">` : ""}<div class="modal-eyebrow">React to post</div><h2 id="nation-dialog-title">Rank your reaction</h2><div class="modal-body">${sentimentPick(state, draft)}${reactionPick(state, draft)}${emojiPick(draft)}<div class="news-modal-draft">Your reaction: ${draftSummary(draft)}</div></div><div class="row dialog-actions"><button value="cancel">Cancel</button><button value="save" class="primary" data-action="newsReactSave">Save reaction</button></div></form>`;
}

/* ════════════════════════════════════════════════════════════════════════════
   RICH-TEXT ARTICLE EDITOR MODAL (create / edit post)
   bold, italic, underline, strikethrough, fonts, text size, color, align,
   indent, lists, blockquote, image uploader (jpg/gif), code, clear.
   ════════════════════════════════════════════════════════════════════════════ */

const FONT_SIZES = [1, 2, 3, 4, 5, 6, 7];
const FONT_FAMILIES = [
  ["Georgia, serif", "Georgia (serif)"],
  ["Inter, sans-serif", "Inter (sans)"],
  ["Courier New, monospace", "Courier (mono)"],
  ["Impact, Charcoal, sans-serif", "Impact"],
  ["Comic Sans MS, cursive", "Comic Sans"],
  ["Verdana, sans-serif", "Verdana"],
];

const editorToolbar = () =>
  `<div class="news-editor-toolbar"><div class="news-toolbar-group"><button type="button" data-editor="bold">B</button><button type="button" data-editor="italic">I</button><button type="button" data-editor="underline">U</button><button type="button" data-editor="strikeThrough">S</button><button type="button" data-editor="code">&lt;&gt;</button></div><div class="news-toolbar-group"><select data-editor="fontName"><option>Font</option>${FONT_FAMILIES.map(([f, label]) => `<option value="${esc(f)}">${esc(label)}</option>`).join("")}</select><select data-editor="fontSize"><option>Size</option>${FONT_SIZES.map((s) => `<option value="${s}">${s}</option>`).join("")}</select><input type="color" data-editor="foreColor" value="#000000"><button type="button" data-editor="foreColorPicker" title="Text color">A</button></div><div class="news-toolbar-group"><button type="button" data-editor="justifyLeft">⬚</button><button type="button" data-editor="justifyCenter">⋯</button><button type="button" data-editor="justifyRight">⬚</button><button type="button" data-editor="indent">↷</button><button type="button" data-editor="outdent">↶</button></div><div class="news-toolbar-group"><button type="button" data-editor="insertUnorderedList">• List</button><button type="button" data-editor="insertOrderedList">1. List</button><button type="button" data-editor="blockquote">“</button><button type="button" data-editor="removeFormat">Clear</button></div><div class="news-toolbar-group"><button type="button" data-editor="insertImage" title="Upload JPG/GIF">🖼</button><input type="file" id="news-editor-file" accept="image/jpeg,image/png,image/gif,image/webp" hidden style="display:none"></div></div><div contenteditable="true" id="news-editor" class="news-editor" spellcheck="true"></div>`;

function newsEditorModalContent(state, article) {
  const isEdit = !!article;
  const title = article ? esc(article.title) : "";
  const body = article ? esc(article.body) : "";
  const category = article ? esc(article.category) : "News";
  const articleId = article ? esc(article.id) : "";
  return `<form id="news-editor-form"><input type="hidden" name="id" value="${articleId}"><input type="hidden" name="title"><input type="hidden" name="category"><input type="hidden" name="body" id="news-editor-body"><div class="modal-eyebrow">${isEdit ? "Edit post" : "Write a post"}</div><h2 id="nation-dialog-title">${isEdit ? "Edit article" : "Publish an article"}</h2><div class="modal-body"><div class="news-editor-form"><label>Headline</label><input name="title-field" type="text" value="${title}" required minlength="3" maxlength="120" placeholder="Headline"><label>Section</label><select name="category-field">${Object.entries({
    News: "World news",
    Politics: "Politics",
    Economy: "Economy",
    Military: "Military",
    Opinion: "Opinion",
    Announcement: "Announcements",
  }).map(([key, label]) => `<option value="${esc(key)}" ${key === category ? "selected" : ""}>${esc(label)}</option>`).join("")}</select>${editorToolbar()}<p class="help">Rich text tools: bold, italic, underline, strikethrough, fonts, size, color, alignment, lists, images (JPG/GIF/PNG/WebP) and more.</p></div></div><div class="row dialog-actions"><button value="cancel">Cancel</button>${isEdit ? button("Delete post", "newsArticleDelete", { id: article.id }, true, "danger") : ""}<button value="save" class="primary" data-action="newsArticleSave">${isEdit ? "Update post" : "Publish post"}</button></div></form>`;
}

/* ════════════════════════════════════════════════════════════════════════════
   COMMENT EDITOR MODAL (create / edit comment)
   ════════════════════════════════════════════════════════════════════════════ */

function newsCommentEditorContent(state, articleId, comment) {
  const isEdit = !!comment;
  const body = comment ? esc(comment.body) : "";
  return `<form id="news-comment-editor-form"><input type="hidden" name="id" value="${esc(articleId)}">${isEdit ? `<input type="hidden" name="commentId" value="${esc(comment.id)}">` : ""}<div class="modal-eyebrow">${isEdit ? "Edit comment" : "Write a comment"}</div><h2 id="nation-dialog-title">${isEdit ? "Edit comment" : "New comment"}</h2><div class="modal-body"><textarea name="body-field" required maxlength="2000" placeholder="Write your comment…">${body}</textarea><p class="help">You can react to your own comment too.</p></div><div class="row dialog-actions"><button value="cancel">Cancel</button>${isEdit ? button("Delete comment", "newsCommentDelete", { commentId: comment.id }, true, "danger") : ""}<button value="save" class="primary" data-action="newsCommentSave">${isEdit ? "Update comment" : "Post comment"}</button></div></form>`;
}

window.newsReactionModalContent = newsReactionModalContent;
window.newsEditorModalContent = newsEditorModalContent;
window.newsCommentEditorContent = newsCommentEditorContent;

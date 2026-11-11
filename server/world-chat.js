"use strict";
const { randomUUID } = require("node:crypto");
const { saveMessage, saveArticle } = require("../core/data-persistence");

const HOUR = 3_600_000;
const own = (object, key) =>
  typeof key === "string" && Object.hasOwn(object, key);
function check(condition, message) {
  if (!condition) throw new Error(message);
}
function text(value, name, max = 100, min = 1) {
  check(
    typeof value === "string" &&
      value.trim().length >= min &&
      value.trim().length <= max,
    `${name} must contain ${min}–${max} characters`,
  );
  return value.trim();
}

class ChatManager {
  constructor(world) {
    this.world = world;
  }

  sendMessage(r, data) {
    const world = this.world;
    const n = r.nation,
      id = n.id,
      now = world.clock();
    world.check(
      ["world", "alliance", "private"].includes(data.channel),
      "Invalid channel",
    );
    if (data.channel === "alliance") world.check(n.allianceId, "Join an alliance first");
    if (data.channel === "private") {
      const target = world.nation(data.target);
      world.check(
        target.player?.settings?.privacy?.allowMessages !== false,
        "Recipient does not accept private messages",
      );
    }
    // Rate limit: max 30 messages per hour per nation per channel
    const hourAgo = now - HOUR;
    const recentMessages = world.state.messages.filter(
      (m) => m.author === id && m.channel === data.channel && m.createdAt > hourAgo,
    ).length;
    world.check(recentMessages < 30, "Message rate limit exceeded (30/hour)");
    world.state.messages.push({
      id: randomUUID(),
      author: id,
      body: text(data.body, "Message", 2000),
      channel: data.channel,
      target:
        data.channel === "alliance"
          ? n.allianceId
          : data.channel === "private"
            ? data.target
            : null,
      createdAt: now,
    });
    world.state.messages = world.state.messages.slice(-2000);

    // Persist message to database
    const newMsg = world.state.messages[world.state.messages.length - 1];
    saveMessage({
      id: newMsg.id,
      authorId: newMsg.author,
      channel: newMsg.channel,
      target: newMsg.target,
      body: newMsg.body,
      createdAt: newMsg.createdAt,
    }).catch(err => console.error("Failed to persist message:", err.message));
  }

  createArticle(r, data) {
    const world = this.world;
    const n = r.nation,
      id = n.id,
      now = world.clock();
    world.check(
      Object.values(world.state.articles).filter(
        (a) => a.author === id && a.createdAt > now - HOUR,
      ).length < 10,
      "Limit: 10 articles per hour",
    );
    const articleId = randomUUID();
    world.state.articles[articleId] = {
      id: articleId,
      author: id,
      title: text(data.title, "Headline", 120, 3),
      body: text(data.body, "Article", 20000, 10),
      category: text(data.category, "Category", 30),
      createdAt: now,
      comments: [],
      reactions: {},
    };
    saveArticle(world.state.articles[articleId]).catch(err =>
      console.error("Failed to persist article:", err.message),
    );
    return articleId;
  }

  editArticle(r, data) {
    const world = this.world;
    const n = r.nation,
      id = n.id;
    const a = world.state.articles[data.id];
    world.check(a, "Article not found");
    world.check(
      a.author === id,
      "Only the author can edit or delete this article",
    );
    a.title = text(data.title, "Headline", 120, 3);
    a.body = text(data.body, "Article", 20000, 10);
    a.editedAt = world.clock();
    saveArticle(a).catch(err => console.error("Failed to persist article:", err.message));
  }

  deleteArticle(r, data) {
    const world = this.world;
    const n = r.nation,
      id = n.id;
    const a = world.state.articles[data.id];
    world.check(a, "Article not found");
    world.check(
      a.author === id,
      "Only the author can edit or delete this article",
    );
    saveArticle(a).catch(err => console.error("Failed to persist article deletion:", err.message));
    delete world.state.articles[data.id];
  }

  addComment(r, data) {
    const world = this.world;
    const n = r.nation,
      id = n.id,
      now = world.clock();
    const a = world.state.articles[data.id];
    world.check(a, "Article not found");
    world.check(a.comments.length < 500, "Comment limit reached");
    a.comments.push({
      id: randomUUID(),
      author: id,
      body: text(data.body, "Comment", 2000),
      createdAt: now,
    });
    saveArticle(a).catch(err => console.error("Failed to persist comment:", err.message));
  }

  editComment(r, data) {
    const world = this.world;
    const n = r.nation,
      id = n.id,
      now = world.clock();
    const a = world.state.articles[data.articleId];
    world.check(a, "Article not found");
    const c = a.comments.find((c) => c.id === data.commentId);
    world.check(c, "Comment not found");
    world.check(c.author === id, "Only the author can edit this comment");
    c.body = text(data.body, "Comment", 2000);
    c.editedAt = now;
    saveArticle(a).catch(err => console.error("Failed to persist comment:", err.message));
  }

  deleteComment(r, data) {
    const world = this.world;
    const n = r.nation,
      id = n.id;
    const a = world.state.articles[data.articleId];
    world.check(a, "Article not found");
    const idx = a.comments.findIndex((c) => c.id === data.commentId);
    world.check(idx >= 0, "Comment not found");
    const c = a.comments[idx];
    world.check(c.author === id, "Only the author can delete this comment");
    a.comments.splice(idx, 1);
    saveArticle(a).catch(err => console.error("Failed to persist comment deletion:", err.message));
  }

  addReaction(r, data) {
    const world = this.world;
    const n = r.nation,
      id = n.id;
    const a = world.state.articles[data.id];
    world.check(a, "Article not found");
    const reaction = data.reaction;
    const hasContent =
      reaction &&
      (reaction.sentiment ||
        reaction.reaction ||
        (reaction.emojis && Object.keys(reaction.emojis).length > 0));
    if (data.targetType === "comment") {
      let targetArticle = null;
      let comment = null;
      for (const article of Object.values(world.state.articles)) {
        const c = article.comments.find((x) => x.id === data.commentId);
        if (c) {
          targetArticle = article;
          comment = c;
          break;
        }
      }
      world.check(comment, "Comment not found");
      comment.reactions = comment.reactions || {};
      if (hasContent) comment.reactions[id] = reaction;
      else if (comment.reactions[id]) delete comment.reactions[id];
      saveArticle(targetArticle).catch(err => console.error("Failed to persist reaction:", err.message));
    } else {
      if (hasContent) a.reactions[id] = reaction;
      else if (a.reactions[id]) delete a.reactions[id];
      saveArticle(a).catch(err => console.error("Failed to persist reaction:", err.message));
    }
  }
}

module.exports = { ChatManager };

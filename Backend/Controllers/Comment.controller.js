import Comment from "../Models/Comment.model.js";
import Post from "../Models/Post.model.js";
import buildCommentTree from "../Utils/BuildCommentTree.js";
import { emitToUser } from "../Socket/SocketManager.js";

export const addComment = async (req, res) => {
  try {
    const { text, parentComment } = req.body;
    const { postId } = req.params;

    if (!text) {
      return res.status(400).json({ message: "Comment text required" });
    }

    // Get the post to find the author
    const post = await Post.findById(postId).populate("author", "_id");

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      text,
      parentComment: parentComment || null
    });

    const populated = await comment.populate("author", "username avatar");

    // Emit socket event to post author (if not commenting on own post)
    if (post && post.author._id.toString() !== req.user._id.toString()) {
      emitToUser(post.author._id, "new-comment", {
        postId: postId,
        comment: populated,
        commenterName: req.user.username,
        message: `${req.user.username} commented on your post`,
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("ADD COMMENT ERROR:", err);
    res.status(500).json({ message: "Failed to add comment" });
  }
};

export const getPostComments = async (req, res) => {
  const { postId } = req.params;

  const comments = await Comment.find({ post: postId })
    .populate("author", "username avatar")
    .sort({ createdAt: 1 });

  const threadedComments = buildCommentTree(comments);

  res.json(threadedComments);
};

export const reactToComment = async (req, res) => {
  const { commentId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  const comment = await Comment.findById(commentId);
  if (!comment) return res.status(404).json({ message: "Comment not found" });

  const users = comment.reactions.get(emoji) || [];

  if (users.includes(userId.toString())) {
    comment.reactions.set(
      emoji,
      users.filter(id => id.toString() !== userId.toString())
    );
  } else {
    comment.reactions.set(emoji, [...users, userId]);
  }

  await comment.save();
  res.json(comment);
};

export const pinComment = async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId).populate("post", "author");
  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  // Authorization: Only the Post Author can pin/unpin comments
  if (comment.post?.author?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only the post author can pin comments" });
  }

  // If already pinned, unpin it
  if (comment.pinned) {
    comment.pinned = false;
    await comment.save();
    return res.json(comment);
  }

  // Unpin other comments on same post
  await Comment.updateMany(
    { post: comment.post },
    { pinned: false }
  );

  comment.pinned = true;
  await comment.save();

  res.json(comment);
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId).populate("post", "author");
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Authorization: Comment author OR Post author
    const isCommentAuthor = comment.author.toString() === userId.toString();
    const isPostAuthor = comment.post?.author?.toString() === userId.toString();

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ message: "Unauthorized to delete this comment" });
    }

    // Delete the comment and its immediate replies
    // (A recursive delete would be more robust for deep nesting)
    await Comment.deleteMany({
      $or: [
        { _id: commentId },
        { parentComment: commentId }
      ]
    });

    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (err) {
    console.error("DELETE COMMENT ERROR:", err);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

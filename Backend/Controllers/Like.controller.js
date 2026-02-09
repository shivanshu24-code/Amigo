import Post from "../Models/Post.model.js";
import { emitToUser } from "../Socket/SocketManager.js";

export const toggleLike = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const postId = req.params.id;

    // ✅ 1. FIRST fetch post with author
    const post = await Post.findById(postId).populate("author", "_id username");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ✅ 2. THEN work with likes
    const alreadyLiked = post.likes.some(
      id => id.toString() === userId
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        id => id.toString() !== userId
      );
    } else {
      post.likes.push(userId);

      // ✅ 3. Emit socket event to post author (only on like, not unlike)
      if (post.author._id.toString() !== userId) {
        emitToUser(post.author._id, "new-like", {
          postId: post._id,
          likerId: userId,
          likerName: req.user.username,
          message: `${req.user.username} liked your post`,
        });
      }
    }

    await post.save();

    res.json({
      likes: post.likes,
      liked: !alreadyLiked
    });

  } catch (error) {
    console.error("LIKE ERROR:", error);
    res.status(500).json({ message: "Like failed" });
  }
};

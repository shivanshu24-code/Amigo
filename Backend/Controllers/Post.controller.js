import Post from "../Models/Post.model.js";
import User from "../Models/User.model.js";


export const createPost = async (req, res) => {
  console.log("REQ.USER", req.user)
  try {
    const { caption, media, visibility, aspectRatio } = req.body;

    if (!caption && !media) {
      return res.status(400).json({
        message: "Post must have caption or media"
      });
    }

    const post = await Post.create({
      author: req.user._id,
      caption,
      media,
      visibility,
      aspectRatio
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("CREATE POST ERROR:", error);
    res.status(500).json({
      message: "Failed to create post"
    });
  }
};

export const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "username avatar")
      .populate("comments.user", "username avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error("GET FEED ERROR:", error);
    res.status(500).json({
      message: "Failed to fetch feed"
    });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username avatar")
      .populate("comments.user", "username avatar");

    if (!post) {
      return res.status(404).json({
        message: "Post not found"
      });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch post"
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      author: req.user._id
    });

    if (!post) {
      return res.status(403).json({
        message: "Not authorized to delete this post"
      });
    }

    await post.deleteOne();

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete post"
    });
  }
};

export const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found"
      });
    }

    const userId = req.user._id;

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      liked: !isLiked,
      likesCount: post.likes.length
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to like post"
    });
  }
};

export const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        message: "Comment text required"
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found"
      });
    }

    post.comments.push({
      user: req.user._id,
      text
    });

    await post.save();

    res.json(post.comments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to add comment"
    });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate("author", "username avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user posts"
    });
  }
};

/**
 * Get a shared post with visibility check
 * @route GET /api/post/shared/:postId
 */
export const getSharedPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const viewerId = req.user?._id;

    const post = await Post.findById(postId)
      .populate("author", "username avatar friends")
      .populate("comments.user", "username avatar");

    if (!post) {
      return res.status(404).json({
        canView: false,
        reason: "not_found",
        message: "Post not found"
      });
    }

    // Public posts are always visible
    if (post.visibility === "Public") {
      return res.json({
        canView: true,
        post
      });
    }

    // If not logged in and post is not public
    if (!viewerId) {
      return res.status(401).json({
        canView: false,
        reason: "not_authenticated",
        message: "Please log in to view this post",
        author: {
          _id: post.author._id,
          username: post.author.username,
          avatar: post.author.avatar
        }
      });
    }

    // Check if viewer is the author
    if (post.author._id.toString() === viewerId.toString()) {
      return res.json({
        canView: true,
        post
      });
    }

    // Check if viewer is a friend of the author
    const authorWithFriends = await User.findById(post.author._id).select("friends");
    const isFriend = authorWithFriends.friends.some(
      friendId => friendId.toString() === viewerId.toString()
    );

    if (isFriend) {
      return res.json({
        canView: true,
        post
      });
    }

    // Viewer is not authorized
    return res.json({
      canView: false,
      reason: "not_friend",
      message: "You need to be friends with this user to view their post",
      author: {
        _id: post.author._id,
        username: post.author.username,
        avatar: post.author.avatar
      }
    });
  } catch (error) {
    console.error("GET SHARED POST ERROR:", error);
    res.status(500).json({
      canView: false,
      reason: "error",
      message: "Failed to fetch post"
    });
  }
};

/**
 * Toggle save post
 * @route POST /api/post/save/:id
 */
export const toggleSavePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isSaved = user.savedPosts.includes(postId);

    if (isSaved) {
      user.savedPosts.pull(postId);
    } else {
      user.savedPosts.push(postId);
    }

    await user.save();

    res.json({
      success: true,
      saved: !isSaved,
      message: !isSaved ? "Post saved" : "Post unsaved"
    });
  } catch (error) {
    console.error("TOGGLE SAVE POST ERROR:", error);
    res.status(500).json({ message: "Failed to save post" });
  }
};


/**
 * Get saved posts
 * @route GET /api/post/saved
 */
export const getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "savedPosts",
      populate: { path: "author", select: "username avatar" }
    });

    res.json(user.savedPosts);
  } catch (error) {
    console.error("GET SAVED POSTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch saved posts" });
  }
};

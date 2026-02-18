import Story from "../Models/Story.model.js";
import User from "../Models/User.model.js";
import cloudinary from "../Config/Cloudinary.js";
import fs from "fs";

/**
 * Create a new story with optional mentions
 */
export const createStory = async (req, res) => {
  try {
    console.log("REQ.FILE =>", req.file);
    if (!req.file) {
      return res.status(400).json({ message: "No media uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "amigo/stories",
      resource_type: "auto"
    });

    fs.unlinkSync(req.file.path);

    // Parse mentions from request body (array of {userId, x, y})
    let mentions = [];
    if (req.body.mentions) {
      try {
        const rawMentions = JSON.parse(req.body.mentions);
        mentions = rawMentions.map(m => {
          if (typeof m === 'string') return { user: m, x: 50, y: 70 };
          return {
            user: m.userId || m.user || m._id,
            x: m.x ?? 50,
            y: m.y ?? 70
          };
        });
      } catch {
        mentions = [];
      }
    }

    if (mentions.length > 0) {
      const currentUserId = req.user._id.toString();
      const mentionedUserIds = [...new Set(mentions.map(m => String(m.user)).filter(Boolean))];
      const mentionedUsers = await User.find({ _id: { $in: mentionedUserIds } }).select(
        "_id username friends tagInStoryPermission mentionPermission"
      );

      const blockedUsers = [];
      for (const targetUser of mentionedUsers) {
        const isFriend = (targetUser.friends || []).some(
          friendId => friendId.toString() === currentUserId
        );
        const canTagInStory =
          targetUser.tagInStoryPermission === "anyone" || isFriend;
        const canMention =
          targetUser.mentionPermission === "anyone" || isFriend;

        if (!canTagInStory || !canMention) {
          blockedUsers.push(targetUser.username);
        }
      }

      if (blockedUsers.length > 0) {
        return res.status(403).json({
          message: `You cannot tag or mention: ${blockedUsers.join(", ")}`
        });
      }
    }

    const story = await Story.create({
      author: req.user._id,
      media: result.secure_url,
      caption: req.body.caption || "",
      mentions: mentions,
      isArchived: req.body.isArchived === 'true' || req.body.isArchived === true,
      visibility: req.body.visibility || "Everyone",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Populate mentions for response
    await story.populate("mentions.user", "username avatar");

    res.status(201).json(story);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Story upload failed" });
  }
};

/**
 * Get all stories with mentions populated
 */
export const getStories = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Import mongoose for ObjectId conversion
    const mongoose = (await import("mongoose")).default;
    const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);

    const stories = await Story.aggregate([
      { $match: { isArchived: { $ne: true } } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorData"
        }
      },
      { $unwind: "$authorData" },
      {
        $match: {
          $and: [
            {
              $or: [
                { visibility: { $ne: "CloseFriends" } },
                { author: currentUserObjectId },
                { "authorData.closeFriends": currentUserObjectId }
              ]
            },
            {
              $or: [
                { "authorData.isPrivate": { $ne: true } },
                { author: currentUserObjectId },
                { "authorData.friends": currentUserObjectId }
              ]
            }
          ]
        }
      },
      {
        $lookup: {
          from: "profiles",
          localField: "authorData._id",
          foreignField: "user",
          as: "authorProfile"
        }
      },
      {
        $unwind: {
          path: "$authorProfile",
          preserveNullAndEmptyArrays: true
        }
      },
      // Lookup mentioned users data
      {
        $lookup: {
          from: "users",
          localField: "mentions.user",
          foreignField: "_id",
          as: "mentionedUserData"
        }
      },
      {
        $addFields: {
          viewersCount: { $size: { $ifNull: ["$viewers", []] } },
          isAuthor: { $eq: ["$authorData._id", currentUserObjectId] }
        }
      },
      {
        $project: {
          _id: 1,
          media: 1,
          caption: 1,
          expiresAt: 1,
          createdAt: 1,
          viewersCount: 1,
          // Include viewers array only for the author
          viewers: {
            $cond: {
              if: "$isAuthor",
              then: "$viewers",
              else: []
            }
          },
          mentions: {
            $map: {
              input: "$mentions",
              as: "m",
              in: {
                x: "$$m.x",
                y: "$$m.y",
                user: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$mentionedUserData",
                        as: "u",
                        cond: { $eq: ["$$u._id", "$$m.user"] }
                      }
                    },
                    0
                  ]
                }
              }
            }
          },
          author: {
            _id: "$authorData._id",
            username: "$authorData.username",
            avatar: { $ifNull: ["$authorProfile.avatar", "$authorData.avatar"] },
            firstname: "$authorProfile.firstname",
            lastname: "$authorProfile.lastname"
          },
          visibility: 1
        }
      },
      // Further sanitize mentions user data to avoid sending sensitive info
      {
        $addFields: {
          mentions: {
            $map: {
              input: "$mentions",
              as: "m",
              in: {
                x: "$$m.x",
                y: "$$m.y",
                _id: "$$m.user._id",
                username: "$$m.user.username",
                avatar: "$$m.user.avatar"
              }
            }
          }
        }
      }
    ]);

    res.json(stories);

  } catch (err) {
    console.error("STORY FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to fetch stories" });
  }
};

/**
 * Record that a user viewed a story
 */
export const viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user._id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Don't record if user is the author
    if (story.author.toString() === userId.toString()) {
      return res.json({ message: "View recorded", isAuthor: true });
    }

    // Check if user already viewed
    const alreadyViewed = story.viewers.some(
      v => v.user.toString() === userId.toString()
    );

    if (!alreadyViewed) {
      story.viewers.push({ user: userId, viewedAt: new Date() });
      await story.save();
    }

    res.json({ message: "View recorded", viewersCount: story.viewers.length });
  } catch (err) {
    console.error("View story error:", err);
    res.status(500).json({ message: "Failed to record view" });
  }
};

/**
 * Get viewers of a story (author only)
 */
export const getStoryViewers = async (req, res) => {
  try {
    const { storyId } = req.params;
    // Support both _id and id from JWT middleware
    const userId = (req.user._id || req.user.id).toString();

    const story = await Story.findById(storyId)
      .populate("viewers.user", "username avatar")
      .lean();

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Only author can see viewers
    const authorId = story.author.toString();
    if (authorId !== userId) {
      console.log("Auth check failed:", { authorId, userId });
      return res.status(403).json({ message: "Not authorized to view this" });
    }

    const viewers = (story.viewers || []).map(v => ({
      user: v.user,
      viewedAt: v.viewedAt
    }));

    res.json({
      viewersCount: viewers.length,

      viewers: viewers
    });
  } catch (err) {
    console.error("Get viewers error:", err);
    res.status(500).json({ message: "Failed to get viewers" });
  }
};

/**
 * Delete a story
 */
export const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    const story = await Story.findOne({
      _id: storyId,
      author: userId
    });

    if (!story) {
      return res.status(404).json({
        message: "Story not found or not authorized"
      });
    }

    await story.deleteOne();

    return res.status(200).json({
      message: "Story deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting story:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

/**
 * Get archived stories
 * @route GET /api/story/archived
 */
export const getArchivedStories = async (req, res) => {
  try {
    const stories = await Story.find({ author: req.user._id, isArchived: true })
      .populate("author", "username avatar")
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error("GET ARCHIVED STORIES ERROR:", error);
    res.status(500).json({ message: "Failed to fetch archived stories" });
  }
};
/**
 * Unarchive a story
 * @route PUT /api/story/unarchive/:storyId
 */
export const unarchiveStory = async (req, res) => {
  try {
    const story = await Story.findOneAndUpdate(
      { _id: req.params.storyId, author: req.user._id },
      {
        isArchived: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Reset expiration when unarchiving
      },
      { new: true }
    );

    if (!story) {
      return res.status(404).json({ message: "Story not found or not authorized" });
    }

    res.json({ success: true, message: "Story unarchived successfully", story });
  } catch (error) {
    console.error("UNARCHIVE STORY ERROR:", error);
    res.status(500).json({ message: "Failed to unarchive story" });
  }
};

/**
 * Get users and friends hidden from story
 * @route GET /api/story/settings/hidden
 */
export const getHiddenStoryUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .populate("hiddenStoryFrom", "username avatar firstname lastname")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      data: user.hiddenStoryFrom || []
    });
  } catch (error) {
    console.error("GET HIDDEN STORY USERS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch hidden story users" });
  }
};

/**
 * Toggle hiding story from a user
 * @route POST /api/story/settings/hide/:userId
 */
export const toggleHideStoryFromUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    // Can't hide from yourself
    if (currentUserId.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot hide story from yourself"
      });
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isHidden = user.hiddenStoryFrom.includes(targetUserId);

    let update;
    if (isHidden) {
      // Remove from hidden list
      update = { $pull: { hiddenStoryFrom: targetUserId } };
    } else {
      // Add to hidden list
      update = { $addToSet: { hiddenStoryFrom: targetUserId } };
    }

    const updatedUser = await User.findByIdAndUpdate(currentUserId, update, { new: true }).populate("hiddenStoryFrom", "username avatar firstname lastname");

    res.status(200).json({
      success: true,
      isHidden: !isHidden,
      message: isHidden ? "Story unhidden from user" : "Story hidden from user",
      data: updatedUser.hiddenStoryFrom
    });
  } catch (error) {
    console.error("Toggle hide story error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while toggling story visibility"
    });
  }
};

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

    const story = await Story.create({
      author: req.user._id,
      media: result.secure_url,
      caption: req.body.caption || "",
      mentions: mentions,
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
          }
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

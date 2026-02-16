import News from "../Models/News.model.js";

/**
 * Create a new news item
 * @route POST /api/news/create
 */
export const createNews = async (req, res) => {
    try {
        const { headline, content, isNew } = req.body;
        const userId = req.user._id;

        const news = new News({
            headline,
            content,
            isNew: isNew !== undefined ? isNew : true,
            createdBy: userId
        });

        await news.save();
        await news.populate("createdBy", "username avatar");

        res.status(201).json({ success: true, data: news });
    } catch (error) {
        console.error("Create News Error:", error);
        res.status(500).json({ success: false, message: "Failed to create news" });
    }
};

/**
 * Get all news
 * @route GET /api/news
 */
export const getAllNews = async (req, res) => {
    try {
        // Get news sorted by creation date (newest first)
        const news = await News.find()
            .populate("createdBy", "username avatar")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: news });
    } catch (error) {
        console.error("Get News Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch news" });
    }
};

/**
 * Delete a news item
 * @route DELETE /api/news/:id
 */
export const deleteNews = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const news = await News.findById(id);

        if (!news) {
            return res.status(404).json({ success: false, message: "News not found" });
        }

        // Check ownership (or admin status if implemented)
        if (news.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this news" });
        }

        await News.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "News deleted successfully" });
    } catch (error) {
        console.error("Delete News Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete news" });
    }
};

/**
 * Update a news item
 * @route PUT /api/news/:id
 */
export const updateNews = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const updateData = req.body;

        const news = await News.findById(id);

        if (!news) {
            return res.status(404).json({ success: false, message: "News not found" });
        }

        // Check ownership
        if (news.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to update this news" });
        }

        const updatedNews = await News.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate("createdBy", "username avatar");

        res.status(200).json({ success: true, data: updatedNews });
    } catch (error) {
        console.error("Update News Error:", error);
        res.status(500).json({ success: false, message: "Failed to update news" });
    }
};

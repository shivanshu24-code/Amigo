import Usage from "../Models/Usage.model.js";
import dayjs from "dayjs";

export const logUsage = async (req, res) => {
    try {
        const userId = req.user._id;
        const { seconds } = req.body;

        if (!seconds || isNaN(seconds)) {
            return res.status(400).json({ success: false, message: "Invalid seconds value" });
        }

        const today = dayjs().format("YYYY-MM-DD");

        const usage = await Usage.findOneAndUpdate(
            { userId, date: today },
            { $inc: { secondsSpent: seconds } },
            { upsert: true, new: true }
        );

        console.log(`[Backend-Usage] Logged ${seconds}s for ${userId}. Total today: ${usage.secondsSpent}s`);

        res.status(200).json({ success: true, usage });
    } catch (error) {
        console.error("Error logging usage:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getUsageData = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get last 7 days of dates
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            dates.push(dayjs().subtract(i, 'day').format("YYYY-MM-DD"));
        }

        const usages = await Usage.find({
            userId,
            date: { $in: dates }
        }).sort({ date: 1 });

        // Map to ensure we have data for all 7 days even if 0
        const usageMap = new Map(usages.map(u => [u.date, u.secondsSpent]));
        const result = dates.map(date => ({
            date,
            dayName: dayjs(date).format("ddd"),
            // Use 1 decimal place instead of rounding to whole minutes
            minutes: Number(((usageMap.get(date) || 0) / 60).toFixed(1))
        }));

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error fetching usage data:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

import { Event } from "../Models/Event.model.js";

const getEventExpiryDate = (eventDate) => {
    // Keep event for 24h after event day ends:
    // expiry = start of next day + 24h
    const d = new Date(eventDate);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 2);
    return d;
};

/**
 * Create a new event
 * @route POST /api/events/create
 */
export const createEvent = async (req, res) => {
    try {
        const { title, date, time, location, type, color } = req.body;
        const userId = req.user._id;

        console.log("Create Event Request:", req.body);
        console.log("User ID:", userId);

        const newEvent = new Event({
            title,
            date,
            expiresAt: getEventExpiryDate(date),
            time,
            location,
            type,
            color,
            createdBy: userId
        });

        await newEvent.save();

        // Populate creator details
        await newEvent.populate("createdBy", "username avatar");

        res.status(201).json({ success: true, data: newEvent });
    } catch (error) {
        console.error("Create Event Error:", error);
        res.status(500).json({ success: false, message: "Failed to create event" });
    }
};

/**
 * Get all upcoming events
 * @route GET /api/events
 */
export const getEvents = async (req, res) => {
    try {
        const now = new Date();

        // Backfill expiry for legacy events created before expiresAt existed
        const legacyEvents = await Event.find({ expiresAt: { $exists: false } }).select("_id date");
        if (legacyEvents.length > 0) {
            const ops = legacyEvents.map((ev) => ({
                updateOne: {
                    filter: { _id: ev._id },
                    update: { $set: { expiresAt: getEventExpiryDate(ev.date) } }
                }
            }));
            await Event.bulkWrite(ops);
        }

        // Hard cleanup so expired events disappear immediately in API response
        await Event.deleteMany({ expiresAt: { $lte: now } });

        const events = await Event.find({
            expiresAt: { $gt: now }
        })
            .populate("createdBy", "username avatar")
            .sort({ date: 1 }); // Sort by nearest date

        res.status(200).json({ success: true, data: events });
    } catch (error) {
        console.error("Get Events Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch events" });
    }
};

/**
 * Delete an event
 * @route DELETE /api/events/:id
 */
export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // Check ownership
        if (event.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this event" });
        }

        await Event.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
        console.error("Delete Event Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete event" });
    }
};

/**
 * Update an event
 * @route PUT /api/events/:id
 */
export const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const updateData = { ...req.body };

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // Check ownership
        if (event.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to update this event" });
        }

        if (updateData.date) {
            updateData.expiresAt = getEventExpiryDate(updateData.date);
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate("createdBy", "username avatar");

        res.status(200).json({ success: true, data: updatedEvent });
    } catch (error) {
        console.error("Update Event Error:", error);
        res.status(500).json({ success: false, message: "Failed to update event" });
    }
};

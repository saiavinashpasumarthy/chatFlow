const express = require("express");
const { randomBytes } = require("crypto");
const { db } = require("../config/firebase");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();
const meetingsRef = db.collection("meetings");

const makeMeetingCode = () =>
  randomBytes(5).toString("hex").toUpperCase();

const serializeMeeting = (doc) => ({
  id: doc.id,
  ...doc.data(),
});

/*
  POST /api/meetings
  Create a meeting.
*/
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { title = "Instant Meeting", scheduledAt = null, agenda = "" } =
      req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Meeting title is required",
      });
    }

    if (scheduledAt !== null && Number.isNaN(Date.parse(scheduledAt))) {
      return res.status(400).json({
        success: false,
        message: "Invalid scheduled date",
      });
    }

    const now = new Date();
    let code;
    let meetingRef;
    let attempts = 0;

    // Generate a code and check that it is not already in use.
    do {
      code = makeMeetingCode();
      meetingRef = meetingsRef.doc(code);
      const existing = await meetingRef.get();

      if (!existing.exists) break;
      attempts += 1;
    } while (attempts < 5);

    if (attempts >= 5) {
      return res.status(500).json({
        success: false,
        message: "Could not generate a unique meeting code",
      });
    }

    const meeting = {
      code,
      title: title.trim().slice(0, 120),
      agenda: typeof agenda === "string" ? agenda.trim().slice(0, 2000) : "",
      hostId: user.uid,
      hostName: user.name || user.email || "Meeting host",
      hostEmail: user.email || null,
      participantIds: [user.uid],
      participants: [
        {
          uid: user.uid,
          name: user.name || user.email || "Meeting host",
          email: user.email || null,
          joinedAt: now,
        },
      ],
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    };

    await meetingRef.set(meeting);

    return res.status(201).json({
      success: true,
      meeting: {
        id: meetingRef.id,
        ...meeting,
      },
    });
  } catch (error) {
    console.error("Create meeting error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create meeting",
    });
  }
});

/*
  GET /api/meetings
  List meetings hosted by or joined by the current user.
*/
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;

    const [hostedSnapshot, joinedSnapshot] = await Promise.all([
      meetingsRef.where("hostId", "==", userId).get(),
      meetingsRef.where("participantIds", "array-contains", userId).get(),
    ]);

    const meetings = new Map();

    [...hostedSnapshot.docs, ...joinedSnapshot.docs].forEach((doc) => {
      meetings.set(doc.id, serializeMeeting(doc));
    });

    const result = [...meetings.values()].sort((a, b) => {
      const dateA = a.createdAt?.toDate
        ? a.createdAt.toDate().getTime()
        : new Date(a.createdAt).getTime();
      const dateB = b.createdAt?.toDate
        ? b.createdAt.toDate().getTime()
        : new Date(b.createdAt).getTime();

      return dateB - dateA;
    });

    return res.json({ success: true, meetings: result });
  } catch (error) {
    console.error("List meetings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch meetings",
    });
  }
});

/*
  GET /api/meetings/:code
  Fetch a meeting only if the current user is a participant.
*/
router.get("/:code", requireAuth, async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const doc = await meetingsRef.doc(code).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    const meeting = doc.data();

    if (!meeting.participantIds?.includes(req.user.uid)) {
      return res.status(403).json({
        success: false,
        message: "Join this meeting before accessing it",
      });
    }

    return res.json({
      success: true,
      meeting: serializeMeeting(doc),
    });
  } catch (error) {
    console.error("Get meeting error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch meeting",
    });
  }
});

/*
  POST /api/meetings/:code/join
  Join an existing meeting.
*/
router.post("/:code/join", requireAuth, async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const meetingRef = meetingsRef.doc(code);
    const meetingDoc = await meetingRef.get();

    if (!meetingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    const meeting = meetingDoc.data();
    const userId = req.user.uid;
    const existingParticipant = meeting.participants?.some(
      (participant) => participant.uid === userId
    );

    if (meeting.status === "ended") {
      return res.status(410).json({
        success: false,
        message: "This meeting has ended",
      });
    }

    if (!existingParticipant) {
      const now = new Date();

      await meetingRef.update({
        participantIds: [...new Set([...(meeting.participantIds || []), userId])],
        participants: [
          ...(meeting.participants || []),
          {
            uid: userId,
            name: req.user.name || req.user.email || "Participant",
            email: req.user.email || null,
            joinedAt: now,
          },
        ],
        status: "active",
        updatedAt: now,
      });
    }

    const updatedDoc = await meetingRef.get();

    return res.json({
      success: true,
      meeting: serializeMeeting(updatedDoc),
    });
  } catch (error) {
    console.error("Join meeting error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to join meeting",
    });
  }
});

/*
  POST /api/meetings/:code/leave
  Record that the participant has left.
*/
router.post("/:code/leave", requireAuth, async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const meetingRef = meetingsRef.doc(code);
    const meetingDoc = await meetingRef.get();

    if (!meetingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    const meeting = meetingDoc.data();
    const userId = req.user.uid;

    if (!meeting.participantIds?.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this meeting",
      });
    }

    // Keep participant history, but record the leave time.
    const now = new Date();
    const participants = (meeting.participants || []).map((participant) =>
      participant.uid === userId
        ? { ...participant, leftAt: now }
        : participant
    );

    const isHost = meeting.hostId === userId;
    await meetingRef.update({
      participants,
      status: isHost ? "ended" : meeting.status,
      endedAt: isHost ? now : meeting.endedAt || null,
      updatedAt: now,
    });

    return res.json({
      success: true,
      message: isHost ? "Meeting ended" : "You left the meeting",
    });
  } catch (error) {
    console.error("Leave meeting error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to leave meeting",
    });
  }
});

module.exports = router;

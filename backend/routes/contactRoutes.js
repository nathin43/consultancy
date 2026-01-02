const express = require("express");
const {
  getAllContacts,
  getContactById,
  submitContact,
  replyContact,
} = require("../controllers/contactController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/", submitContact);

// Admin routes
router.get("/", protect, getAllContacts);
router.get("/:id", protect, getContactById);
router.put("/:id/reply", protect, replyContact);

module.exports = router;

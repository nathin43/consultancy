const Contact = require("../models/Contact");
const sendEmail = require("../utils/sendEmail");

// Get all contacts (Admin only)
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get contact by ID
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }
    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit contact form
exports.submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message, category } = req.body;

    // Validation
    if (!name || !email || !phone || !subject || !message) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please provide all required fields",
        });
    }

    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
      category,
    });

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: "We received your message",
      text: `Hi ${name},\n\nThank you for contacting us. We will get back to you soon.\n\nBest regards,\nElectric Shop Team`,
    });

    res
      .status(201)
      .json({
        success: true,
        message: "Message sent successfully",
        data: contact,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reply to contact (Admin only)
exports.replyContact = async (req, res) => {
  try {
    const { reply } = req.body;

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { reply, status: "replied" },
      { new: true }
    );

    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    // Send reply email
    await sendEmail({
      to: contact.email,
      subject: `Reply to your message: ${contact.subject}`,
      text: reply,
    });

    res
      .status(200)
      .json({
        success: true,
        message: "Reply sent successfully",
        data: contact,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

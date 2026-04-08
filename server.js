require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve the frontend

// Create reusable transporter using custom SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for others
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post('/contact', async (req, res) => {
  const { name, email, business, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    await transporter.sendMail({
      from: `"ScannDine Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      replyTo: email,
      subject: `New Contact Form Submission — ${name}`,
      text: [
        `Name:            ${name}`,
        `Email:           ${email}`,
        `Restaurant Name: ${business || '—'}`,
        ``,
        `Message:`,
        message,
      ].join('\n'),
      html: `
        <h2>New Contact Form Submission</h2>
        <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:15px;">
          <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
          <tr><td><strong>Email</strong></td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          <tr><td><strong>Restaurant Name</strong></td><td>${escapeHtml(business || '—')}</td></tr>
        </table>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Mail error:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

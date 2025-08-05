const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '15mb' })); // allow large payloads for images

// TODO: Replace with your SMTP email account info
const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',                // this is literally the string 'apikey'
      // replace with your SendGrid API key
    },
  });

app.post('/send-email', async (req, res) => {
  const { name, phone, email, location, images } = req.body;

  if (!name || !phone || !location || !images || images.length === 0) {
    return res.status(400).json({ error: 'Missing required fields or images' });
  }

  try {
    // Compose attachments from base64 images
    const attachments = images.map((imgBase64, i) => ({
      filename: `image_${i + 1}.jpg`,
      content: imgBase64.split('base64,')[1], // strip data:image/jpeg;base64,
      encoding: 'base64',
    }));

    const mailOptions = {
      from: '"Real Estate App" <beytee.realestate@gmail.com>',
      to: 'beytee.realestate@gmail.com', // your email or business email
      subject: 'New Property Submission',
      text: `New property submission:\nName: ${name}\nPhone: ${phone}\nEmail: ${email || 'N/A'}\nLocation: ${location}`,
      attachments,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Email sent successfully' });
} catch (err) {
    console.error('Email send error:', err.message || err);
    res.status(500).json({ error: err.message || 'Failed to send email' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
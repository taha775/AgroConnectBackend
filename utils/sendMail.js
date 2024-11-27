import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';


// Load environment variables
dotenv.config();

// Get the directory name of the current file (similar to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sendMail = async (options) => {
  // Create the transporter for nodemailer using SMTP configuration from environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const { email, subject, template, data } = options;

  // Get the path to the email template file
  const templatePath = path.join(__dirname, '../mails', template);

  // Render the email template with the provided data
  const html = await ejs.renderFile(templatePath, data);

  // Define the email options
  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject,
    html
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

export default sendMail;

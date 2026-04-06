import nodemailer from "nodemailer";
import {
  APP_EMAIL,
  APP_EMAIL_PASSWORD,
} from "../../../../config/config.service.js";

export const sendEmail = async ({
  to,
  cc,
  bcc,
  subject,
  html,
  attachments = [],
} = {}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: APP_EMAIL,
      pass: APP_EMAIL_PASSWORD,
    },
  });
  const info = await transporter.sendMail({
    from: `Saraha_App <${APP_EMAIL}>`,
    to,
    cc,
    bcc,
    subject,
    html,
    attachments,
  });
  console.log("message sent", info.messageId);
};

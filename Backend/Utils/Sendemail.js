import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Amigo App" <no-reply@amigo.com>',
      to,
      subject,
      html,
    });

  } catch (error) {
    console.log("Email Error:", error);
  }
};
export default sendEmail;
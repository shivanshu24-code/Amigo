import nodemailer from "nodemailer";

console.log("SMTP CONFIG:", {
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  user: process.env.MAIL_USER,
});

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: true, // for 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },

  // 🔥 FORCE NODEMAILER TO IGNORE SYSTEM PROXIES
  agent: false,
  proxy: false,

  tls: {
    rejectUnauthorized: true,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP ERROR:", error);
  } else {
    console.log("✅ SMTP READY");
  }
});

const sendEmail = async ({ to, subject, text, html }) => {
  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
    html,
  });
};

export default sendEmail;

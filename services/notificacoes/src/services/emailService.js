const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function enviarEmail({ para, assunto, texto }) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: para,
      subject: assunto,
      text: texto,
    });
    console.log(`[email] enviado para ${para}: "${assunto}"`);
  } catch (err) {
    console.error(`[email] falha ao enviar para ${para}:`, err.message);
  }
}

module.exports = { enviarEmail };

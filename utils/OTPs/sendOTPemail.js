import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import nodemailer from "nodemailer";

import asyncHandler from "../../middlewares/asyncHandler.js";
import OTP from "../../models/otpModel.js";

const sendOTPemail = asyncHandler(async ({ _id, email }, res) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const otp = await otpGenerator.generate(4, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Votre code de vérification OTP pour expense tracker Da Vinci IT Solutions",
    html: `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 5px;
          }
          .header {
            background-color: #f4f4f4;
            padding: 10px;
            text-align: center;
          }
          .content {
            padding: 20px 0;
          }
          .footer {
            background-color: #f4f4f4;
            padding: 10px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Vérification OTP pour votre compte expense tracker Da Vinci IT Solutions</h2>
          </div>
          <div class="content">
            <p>Chèr(e) utilisateur,</p>
            <p>Votre code OTP pour vérifier votre compte expense tracker Da Vinci IT Solutions est : <strong>${otp}</strong></p>
            <p>Ce code OTP est valable pendant 1 minute. Veuillez l'utiliser dans ce délai.</p>
            <p>Si vous n'avez pas demandé ce code OTP, veuillez ignorer cet e-mail.</p>
            <p>Merci d'avoir choisi expense tracker Da Vinci IT Solutions !</p>
          </div>
          <div class="footer">
            <p>Ceci est un e-mail automatique, veuillez ne pas répondre.</p>
          </div>
        </div>
      </body>
    </html>
  `,
  };

  const salt = await bcrypt.genSalt(Number(process.env.ENCRYPTION_SALT));
  const hashedOTP = await bcrypt.hash(otp, salt);

  const newOTP = new OTP({
    userID: _id,
    otp: hashedOTP,
    expiresAt: Date.now() + 1 * 60 * 1000,
  });

  await newOTP.save();
  await transporter.sendMail(mailOptions);

  return res.json({
    message: "OTP envoyé avec succès. Veuillez vérifier votre boîte de réception !",
    data: {
      userID: _id,
      email,
    },
  });
});

export default sendOTPemail;

import nodemailer from 'nodemailer';

export const sendAlertEmail = async (userEmail, subject, message) => {
  console.log(`Tentative d'envoi d'e-mail à ${userEmail} avec le sujet : ${subject}`);
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: subject,
    text: message,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail envoyé avec succès à:', userEmail);
    console.log('Réponse du serveur:', info.response);
    return { success: true, message: 'E-mail envoyé avec succès' };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'e-mail à', userEmail, ':', error);
    return { success: false, error: error.message };
  }
};
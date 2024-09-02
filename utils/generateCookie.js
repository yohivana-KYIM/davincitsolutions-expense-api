import jwt from "jsonwebtoken";

const generateCookie = (res, userId) => {
  // Générer un token JWT
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Définir le cookie avec le token JWT
  res.cookie('session', token, {
    httpOnly: true, // Le cookie ne sera pas accessible via JavaScript
    secure: process.env.NODE_ENV === 'production', // Envoyé uniquement sur HTTPS en production
    sameSite: 'Strict', // Peut être 'Lax' ou 'None' selon les besoins
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours en millisecondes
  });

  return token; // Retourner le token pour d'éventuelles utilisations supplémentaires
};

export default generateCookie;

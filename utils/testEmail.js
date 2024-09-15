// Importation de la fonction sendAlertEmail depuis utils/emailUtils.js
import { sendAlertEmail } from './utils/emailUtils.js';

// Fonction asynchrone pour tester l'envoi d'un e-mail
const testEmail = async () => {
  try {
    // Appel de la fonction sendAlertEmail avec des paramètres de test
    await sendAlertEmail(
      'yohivana794@gmail.com',  // Remplacez par une adresse e-mail de test valide
      'Test Subject',      // Sujet de l'e-mail
      'This is a test message.' // Message de l'e-mail
    );
    console.log('L\'e-mail de test a été envoyé avec succès.');
  } catch (error) {
    // Affichage de l'erreur si l'envoi échoue
    console.error('Échec du test d\'envoi d\'e-mail :', error);
  }
};

// Exécution de la fonction de test
testEmail();

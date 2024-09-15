import User from "../models/userModel.js";
import { sendAlertEmail } from "../utils/emailUtils.js";
import Income from "../models/incomeModel.js";
import Expense from "../models/expenseModel.js";

export const calculateTotalBalance = async (userId) => {
  const totalIncome = await Income.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const totalExpense = await Expense.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const incomeTotal = totalIncome.length > 0 ? totalIncome[0].total : 0;
  const expenseTotal = totalExpense.length > 0 ? totalExpense[0].total : 0;
  
  return incomeTotal - expenseTotal;
};

const createAlertEmailBody = (username, threshold) => {
  return `Bonjour ${username},

Vous avez dépensé <b>${threshold}%</b> de vos revenus. Nous espérons que vous profitez pleinement de notre application web Expense Tracker de Da Vinci IT Solutions.

Nous tenons à vous informer que vous avez déjà dépensé <${threshold}%</b> de votre revenu ce mois-ci. À ce rythme, il est possible que vous ne parveniez pas à finir le mois dans les meilleures conditions financières.

Nous vous encourageons à suivre de près vos dépenses et à ajuster votre budget si nécessaire.

Si vous avez des questions ou besoin d'aide pour mieux gérer vos finances, n'hésitez pas à nous contacter.

Cordialement,
L'équipe Expense Tracker
Da Vinci IT Solutions`;
};



export const checkAndSendAlerts = async (user, currentBalance) => {
  const totalIncome = await Income.aggregate([
    { $match: { user: user._id } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const totalExpense = await Expense.aggregate([
    { $match: { user: user._id } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const incomeTotal = totalIncome.length > 0 ? totalIncome[0].total : 0;
  const expenseTotal = totalExpense.length > 0 ? totalExpense[0].total : 0;

  if (incomeTotal === 0) {
    console.log('Aucun revenu enregistré, impossible de calculer le pourcentage de dépenses.');
    return;
  }

  const expensePercentage = (expenseTotal / incomeTotal) * 100;
  console.log(`Pourcentage de dépenses actuel pour ${user.email}: ${expensePercentage.toFixed(2)}%`);
  
  const alerts = [
    { threshold: 75, key: 'seventyFivePercent' },
    { threshold: 50, key: 'fiftyPercent' },
    { threshold: 25, key: 'twentyFivePercent' },
    { threshold: 10, key: 'tenPercent' },
    { threshold: 5, key: 'fivePercent' }
  ];

  for (const alert of alerts) {
    if (expensePercentage >= alert.threshold) {
      if (!user.alertThresholds[alert.key]) {
        console.log(`Seuil d'alerte ${alert.threshold}% atteint pour l'utilisateur ${user.email}. Envoi d'un e-mail...`);
        
        const emailSubject = `Alerte Dépenses ${alert.threshold}%`;
        const emailBody = createAlertEmailBody(user.username, alert.threshold);

        const result = await sendAlertEmail(user.email, emailSubject, emailBody);
        
        if (result.success) {
          user.alertThresholds[alert.key] = true;
          console.log(`Alerte ${alert.threshold}% envoyée avec succès à ${user.email}.`);
        } else {
          console.error(`Échec de l'envoi de l'alerte ${alert.threshold}% à ${user.email}:`, result.error);
        }
      }
    } else {
      // Réinitialiser le seuil si le pourcentage est redescendu en dessous
      if (user.alertThresholds[alert.key]) {
        user.alertThresholds[alert.key] = false;
        console.log(`Réinitialisation du seuil ${alert.threshold}% pour l'utilisateur ${user.email}.`);
      }
    }
  }

  await user.save();
};

export const calculateExpensePercentage = async (userId) => {
  const totalIncome = await Income.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const totalExpense = await Expense.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const incomeTotal = totalIncome.length > 0 ? totalIncome[0].total : 0;
  const expenseTotal = totalExpense.length > 0 ? totalExpense[0].total : 0;

  if (incomeTotal === 0) {
    return 0; // Éviter la division par zéro
  }

  return (expenseTotal / incomeTotal) * 100;
};

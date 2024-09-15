import Expense from "../models/expenseModel.js";
import Income from "../models/incomeModel.js";
import User from "../models/userModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import {
  validateTitleLength,
  validateDescriptionLength,
  validateExpenseCategory,
  validateAmount,
  validateDate,
  validatePaginationParams,
} from "../utils/validations.js";
import { calculateTotalBalance, checkAndSendAlerts, calculateExpensePercentage } from "../helpers/balanceHelper.js";

export const addExpense = asyncHandler(async (req, res) => {
  const { title, amount, category, description, date } = req.body;
  const userId = req.user._id;

  // Validation des entrées
  const titleError = validateTitleLength(title);
  const descriptionError = validateDescriptionLength(description);
  const categoryError = validateExpenseCategory(category);
  const amountError = validateAmount(amount);
  const dateError = validateDate(date);

  if (titleError) return res.status(400).json({ error: titleError });
  if (descriptionError) return res.status(400).json({ error: descriptionError });
  if (categoryError) return res.status(400).json({ error: categoryError });
  if (amountError) return res.status(400).json({ error: amountError });
  if (dateError) return res.status(400).json({ error: dateError });

  const currentBalance = await calculateTotalBalance(userId);

  if (amount > currentBalance) {
    return res.status(400).json({ error: "Le montant de la dépense dépasse le solde disponible." });
  }

  const newExpense = new Expense({
    user: userId,
    title,
    amount,
    category,
    description,
    date,
  });

  await newExpense.save();
  
  const updatedBalance = await calculateTotalBalance(userId);
  const user = await User.findById(userId);
  if (user) {
    await checkAndSendAlerts(user, updatedBalance);
  } else {
    console.error(`Utilisateur avec l'ID ${userId} non trouvé.`);
  }

  return res.status(201).json({ message: "Dépense ajoutée avec succès.", expense: newExpense });
});

export const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return res.status(404).json({ error: "Dépense non trouvée" });
  }

  const { title, amount, category, description, date } = req.body;

  // Validation des entrées
  const titleError = title ? validateTitleLength(title) : null;
  const descriptionError = description ? validateDescriptionLength(description) : null;
  const categoryError = category ? validateExpenseCategory(category) : null;
  const amountError = amount ? validateAmount(amount) : null;
  const dateError = date ? validateDate(date) : null;

  if (titleError) return res.status(400).json({ error: titleError });
  if (descriptionError) return res.status(400).json({ error: descriptionError });
  if (categoryError) return res.status(400).json({ error: categoryError });
  if (amountError) return res.status(400).json({ error: amountError });
  if (dateError) return res.status(400).json({ error: dateError });

  const currentBalance = await calculateTotalBalance(req.user._id);

  if (amount && amount !== expense.amount) {
    const amountDifference = amount - expense.amount;

    if (amountDifference > currentBalance) {
      return res.status(400).json({ error: "Le montant des nouvelles dépenses dépasse les disponibilités." });
    }

    expense.amount = amount;
  }

  if (title) expense.title = title;
  if (category) expense.category = category;
  if (description) expense.description = description;
  if (date) expense.date = date;

  const updatedExpense = await expense.save();
  
  const updatedBalance = await calculateTotalBalance(req.user._id);
  const user = await User.findById(req.user._id);
  if (user) {
    await checkAndSendAlerts(user, updatedBalance);
  } else {
    console.error(`Utilisateur avec l'ID ${req.user._id} non trouvé.`);
  }

  return res.status(200).json({ message: "Dépense mise à jour avec succès!", expense: updatedExpense });
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!expense) {
    return res.status(404).json({ error: "Aucune dépense trouvée!" });
  }

  // Vérifier les alertes après la suppression d'une dépense
  const user = await User.findById(req.user._id);
  if (user) {
    const updatedBalance = await calculateTotalBalance(req.user._id);
    await checkAndSendAlerts(user, updatedBalance);
  }

  return res.status(200).json({ message: "Dépense supprimée avec succès!" });
});

export const getExpenses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  const paginationError = validatePaginationParams(page, pageSize);
  if (paginationError) {
    return res.status(400).json({ error: paginationError });
  }

  const skip = (page - 1) * pageSize;
  const limit = pageSize;

  const expenses = await Expense.find({ user: req.user._id })
    .skip(skip)
    .limit(limit);

  if (!expenses || expenses.length === 0) {
    return res.status(404).json({ message: "Aucune dépense trouvée!" });
  }

  const totalCount = await Expense.countDocuments({ user: req.user._id });
  const totalPages = Math.ceil(totalCount / pageSize);

  const totalExpense = await Expense.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const expensePercentage = await calculateExpensePercentage(req.user._id);

  return res.status(200).json({
    message: "Toutes les dépenses récupérées avec succès!",
    expenses,
    totalExpense: totalExpense.length > 0 ? totalExpense[0].total : 0,
    expensePercentage,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      pageSize,
    },
  });
});

export const getAllExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expense.find({ user: req.user._id });

  if (!expenses || expenses.length === 0) {
    return res.status(404).json({ message: "Aucune dépense trouvée!" });
  }

  const totalExpense = expenses.reduce(
    (acc, expense) => acc + expense.amount,
    0
  );

  const expensePercentage = await calculateExpensePercentage(req.user._id);

  return res.status(200).json({
    message: "Toutes les dépenses récupérées avec succès!",
    expenses,
    totalExpense,
    expensePercentage,
  });
});
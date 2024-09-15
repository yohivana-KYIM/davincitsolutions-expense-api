import Expense from "../models/expenseModel.js";
import Income from "../models/incomeModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import {
  validateTitleLength,
  validateDescriptionLength,
  validateExpenseCategory,
  validateAmount,
  validateDate,
  validatePaginationParams,
} from "../utils/validations.js";

// Helper function to calculate total balance
const calculateTotalBalance = async (userId) => {
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

// Controller function to add new expense
export const addExpense = asyncHandler(async (req, res) => {
  const { title, amount, category, description, date } = req.body;

  // Validate inputs
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

  // Calculate current balance
  const currentBalance = await calculateTotalBalance(req.user._id);

  // Check if balance is sufficient
  if (currentBalance <= 0) {
    return res.status(400).json({ error: "Impossible d'ajouter des dépenses. Le solde est insuffisant." });
  }

  if (amount > currentBalance) {
    return res.status(400).json({ error: "Le montant de la dépense dépasse le solde disponible." });
  }

  const newExpense = new Expense({
    user: req.user._id,
    title,
    amount,
    category,
    description,
    date,
  });

  await newExpense.save();

  return res.status(201).json({ message: "Dépense ajoutée avec succès.", expense: newExpense });
});

// Controller function to update an expense
export const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return res.status(404).json({ error: "Dépense ajoutée avec succès!" });
  }

  const { title, amount, category, description, date } = req.body;

  // Validate inputs
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

  // Calculate current balance
  const currentBalance = await calculateTotalBalance(req.user._id);

  // If amount is being modified, check if the new amount is valid
  if (amount && amount !== expense.amount) {
    const amountDifference = amount - expense.amount;

    if (amountDifference > currentBalance) {
      return res.status(400).json({ error: "Le montant des nouvelles dépenses dépasse les disponibilités ." });
    }

    // Update the amount in the expense
    expense.amount = amount;
  }

  // Validate and update other fields if provided
  if (title) expense.title = title;
  if (category) expense.category = category;
  if (description) expense.description = description;
  if (date) expense.date = date;

  const updatedExpense = await expense.save();

  return res.status(200).json({ message: "Dépense mise à jour avec succès!", expense: updatedExpense });
});

// Controller function to delete an expense
export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!expense) {
    return res.status(404).json({ error: "Aucune dépense trouvée!" });
  }

  return res.status(200).json({ message: "EDépense supprimée avec succès !" });
});

// Controller function to get all expenses with pagination
export const getExpenses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  // Validate pagination parameters
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

  const totalExpenses = await Expense.find({ user: req.user._id });
  const totalExpense = totalExpenses.reduce(
    (acc, expense) => acc + expense.amount,
    0
  );

  return res.status(200).json({
    message: "Toutes les dépenses récupérées avec succès!",
    expenses,
    totalExpense,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      pageSize,
    },
  });
});

// Controller function to get all expenses without pagination
export const getAllExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expense.find({ user: req.user._id });

  if (!expenses || expenses.length === 0) {
    return res.status(404).json({ message: "Aucune dépense trouvée !" });
  }

  const totalExpense = expenses.reduce(
    (acc, expense) => acc + expense.amount,
    0
  );

  return res.status(200).json({
    message: "Toutes les dépenses récupérées avec succès !",
    expenses,
    totalExpense,
  });
});

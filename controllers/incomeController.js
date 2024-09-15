import Income from "../models/incomeModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";

import {
  validateTitleLength,
  validateDescriptionLength,
  validateIncomeCategory,
  validateAmount,
  validateDate,
  validatePaginationParams,
} from "../utils/validations.js";

// Fonction du contrôleur pour ajouter un nouveau revenu
export const addIncome = asyncHandler(async (req, res) => {
  const { title, amount, category, description, date } = req.body;

  const newIncome = new Income({
    user: req.user._id,
    title,
    amount,
    category,
    date,
    description,
  });

  await newIncome.save();

  return res
    .status(201)
    .json({ message: "Revenu ajouté avec succès", income: newIncome });
});

// Fonction du contrôleur pour mettre à jour un revenu
export const updateIncome = asyncHandler(async (req, res) => {
  const income = await Income.findById(req.params.id);

  if (!income) {
    return res.status(404).json({ error: "Revenu non trouvé!" });
  }

  const { title, amount, category, description, date } = req.body;

  if (!title && !amount && !category && !description && !date) {
    return res
      .status(400)
      .json({ error: "Au moins un champ est requis pour la mise à jour!" });
  }
  if (
    title === income.title &&
    amount === income.amount &&
    category === income.category &&
    description === income.description &&
    date === income.date
  ) {
    return res.status(400).json({ error: "Aucun changement détecté!" });
  }

  if (title) {
    const error = validateTitleLength(title);
    if (error) {
      return res.status(400).json({ error: error });
    }
    income.title = title;
  }
  if (amount) {
    const error = validateAmount(amount);
    if (error) {
      return res.status(400).json({ error: error });
    }
    income.amount = amount;
  }
  if (description) {
    const error = validateDescriptionLength(description);
    if (error) {
      return res.status(400).json({ error: error });
    }
    income.description = description;
  }
  if (date) {
    const error = validateDate(date);
    if (error) {
      return res.status(400).json({ error: error });
    }
    income.date = date;
  }
  if (category) {
    const error = validateIncomeCategory(category);
    if (error) {
      return res.status(400).json({ error: error });
    }
    income.category = category;
  }

  const updatedIncome = await income.save();

  return res
    .status(200)
    .json({ message: "Revenu mis à jour avec succès!", income: updatedIncome });
});

// Fonction du contrôleur pour supprimer un revenu
export const deleteIncome = asyncHandler(async (req, res) => {
  const income = await Income.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!income) {
    return res.status(404).json({ error: "Revenu non trouvé!" });
  }

  return res.status(200).json({ message: "Revenu supprimé avec succès!" });
});

// Fonction du contrôleur pour obtenir tous les revenus
export const getIncomes = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  const paginationError = validatePaginationParams(page, pageSize);
  if (paginationError) {
    return res.status(400).json({ error: paginationError });
  }

  const skip = (page - 1) * pageSize;
  const limit = pageSize;

  const incomes = await Income.find({ user: req.user._id })
    .skip(skip)
    .limit(limit);
  if (!incomes || incomes.length === 0) {
    return res.status(404).json({ message: "Aucun revenu trouvé!" });
  }

  const totalCount = await Income.countDocuments({ user: req.user._id });
  const totalPages = Math.ceil(totalCount / pageSize);

  const totalExpenses = await Income.find({ user: req.user._id });

  const totalIncome = totalExpenses.reduce(
    (acc, income) => acc + income.amount,
    0
  );

  return res.status(200).json({
    message: "Tous les revenus récupérés avec succès!",
    incomes,
    totalIncome,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      pageSize,
    },
  });
});

// Fonction du contrôleur pour obtenir tous les revenus
export const getAllIncomes = asyncHandler(async (req, res) => {
  const incomes = await Income.find({ user: req.user._id });

  if (!incomes || incomes.length === 0) {
    return res.status(404).json({ message: "Aucun revenu trouvé!" });
  }

  const totalIncome = incomes.reduce((acc, income) => acc + income.amount, 0);

  return res.status(200).json({
    message: "Tous les revenus récupérés avec succès!",
    incomes,
    totalIncome,
  });
});

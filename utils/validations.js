export const validateRequiredFields = (body, requiredFields) => {
  for (const field of requiredFields) {
    if (!body[field]) {
      const capitalize = field.charAt(0).toUpperCase() + field.slice(1);
      return `${capitalize} est requis !`;
    }
  }
  return;
};

export const validateUsernameLength = (username) => {
  if (username.length < 3) {
    return "Le nom d'utilisateur doit contenir au moins 3 caractères !";
  }
  if (username.length > 20) {
    return "Le nom d'utilisateur ne doit pas dépasser 20 caractères !";
  }
  return;
};

export const validatePasswordLength = (password) => {
  if (password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caractères !";
  }
  return;
};

export const validateEmailAddress = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Adresse e-mail invalide !";
  }
  return;
};

export const validateOTP = (otp) => {
  const otpRegex = /^\d{4}$/;
  if (!otpRegex.test(otp)) {
    return "OTP invalide !";
  }
  return;
};

// Validations des revenus/dépenses
export const validateTitleLength = (title) => {
  if (title.length < 5) {
    return "Le titre doit contenir au moins 5 caractères !";
  }
  if (title.length > 15) {
    return "Le titre ne doit pas dépasser 15 caractères !";
  }
  return;
};

export const validateAmount = (amount) => {
  if (isNaN(amount) || amount <= 0) {
    return "Le montant doit être un nombre positif !";
  }
  return;
};

export const validateIncomeCategory = (category) => {
  const allowedCategories = [
    "salary",
    "freelance",
    "investments",
    "youtube",
    "rent",
    "bitcoin",
    "other",
  ];
  if (!allowedCategories.includes(category)) {
    return "Catégorie invalide !";
  }
  return;
};

export const validateDate = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return "Format de date invalide !";
  }
  return;
};

export const validateDescriptionLength = (description) => {
  if (description.length < 5) {
    return "La description doit contenir au moins 5 caractères !";
  }
  if (description.length > 80) {
    return "La description ne doit pas dépasser 80 caractères !";
  }
  return;
};

export const validatePaginationParams = (page, pageSize) => {
  const pageNumber = parseInt(page);
  const size = parseInt(pageSize);

  if (isNaN(pageNumber) || pageNumber < 1) {
    return "Numéro de page invalide !";
  }
  if (isNaN(size) || size < 1) {
    return "Taille de page invalide !";
  }
  return;
};

export const validateExpenseCategory = (category) => {
  const allowedCategories = [
    "groceries",
    "utilities",
    "transportation",
    "healthcare",
    "entertainment",
    "clothing",
    "other",
  ];
  if (!allowedCategories.includes(category)) {
    return "Catégorie invalide !";
  }
  return;
};

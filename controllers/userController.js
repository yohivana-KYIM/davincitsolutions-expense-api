import bcrypt from "bcryptjs";

import User from "../models/userModel.js";
import OTP from "../models/otpModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";

import {
  validateEmailAddress,
  validateUsernameLength,
  validatePasswordLength,
} from "../utils/validations.js";
import {
  getLastResendTime,
  updateLastResendTime,
} from "../utils/OTPs/OTPCooldown.js";

import generateHash from "../utils/generateHash.js";
import generateCookie from "../utils/generateCookie.js";
import sendOTPemail from "../utils/OTPs/sendOTPemail.js";

// Controller function to register a new user
export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const emailExists = await User.findOne({ email });
  if (emailExists) {
    return res
      .status(400)
      .json({ error: "L'email est déjà enregistré. Veuillez vous connecter !" });
  }

  const userNameExists = await User.findOne({ username });
  if (userNameExists) {
    return res.status(400).json({ error: "Le nom d'utilisateur est déjà pris !" });
  }

  const hashedPassword = await generateHash(password);

  const newUser = new User({ username, email, password: hashedPassword });

  await newUser.save();

  await generateCookie(res, newUser._id);
  res.status(200).json({
    message: "Utilisateur enregistré avec succès. Veuillez vérifier votre email !",
    user: {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      verified: newUser.verified,
    },
  });
});

// Controller function to log in a user
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    return res.status(404).json({
      error: "L'email n'est pas enregistré. Veuillez vous inscrire !",
    });
  }

  if (!existingUser.verified) {
    return res.status(401).json({
      user: {
        _id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        verified: existingUser.verified,
      },
      error:
        "L'email n'est pas vérifié. Veuillez vérifier votre email via OTP pour continuer.",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Identifiants utilisateur invalides !" });
  }

  await generateCookie(res, existingUser._id);
  return res.status(200).json({
    message: "Connexion réussie !",
    user: {
      _id: existingUser._id,
      username: existingUser.username,
      email: existingUser.email,
      verified: existingUser.verified,
    },
  });
});

// Controller function to logout a user
export const logoutCurrentUser = asyncHandler(async (req, res) => {
  const token = req.cookies.session;
  if (token) {
    res.clearCookie("session");

    return res.status(200).json({ message: "Déconnexion réussie !" });
  } else {
    return res.status(401).json({
      error: "Vous devez être authentifié pour accéder à cette ressource !",
    });
  }
});

// Controller function to get current user profile details.
export const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    return res.status(200).json({
      message: "Détails de l'utilisateur récupérés avec succès !",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        verified: user.verified,
      },
    });
  } else {
    return res.status(404).json({ error: "Utilisateur non trouvé !" });
  }
});

// Controller function to update the current user's profile
export const updateCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé !" });
  }

  const { username, email } = req.body;

  if (!username && !email) {
    return res.status(400).json({
      error: "Au moins un champ est requis pour la mise à jour !",
    });
  }

  if (username === user.username && email === user.email) {
    return res.status(400).json({ error: "Aucun changement détecté !" });
  }

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error:
          "L'email est déjà utilisé. Veuillez choisir une autre adresse e-mail !",
      });
    }
  }

  if (username) {
    const error = validateUsernameLength(username);
    if (error) {
      return res.status(400).json({ error: error });
    }
    user.username = username;
  }
  if (email) {
    const error = validateEmailAddress(email);
    if (error) {
      return res.status(400).json({ error: error });
    }
    user.email = email;
  }

  const updatedUser = await user.save();

  return res.status(200).json({
    message: "Profil mis à jour avec succès !",
    user: {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      verified: updatedUser.verified,
    },
  });
});

// Controller function to update the current user's password
export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé !" });
  }

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      error: "Les deux champs sont requis pour la mise à jour !",
    });
  }
  const error = await validatePasswordLength(newPassword);
  if (error) {
    return res.status(400).json({ error: error });
  }
  if (oldPassword === newPassword) {
    return res
      .status(400)
      .json({ error: "Le nouveau mot de passe ne peut pas être identique à l'ancien !" });
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Ancien mot de passe invalide !" });
  }

  await user.updateOne({ password: await generateHash(newPassword) });
  res.status(200).json({ message: "Mot de passe mis à jour avec succès !" });
});

// Controller function to send OTP
export const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    return res.status(404).json({ error: "L'email n'est pas enregistré !" });
  }

  const userID = existingUser._id;

  const cooldownDuration = 60 * 1000; // 1 minute in milliseconds
  const lastResendTime = await getLastResendTime(userID);

  if (lastResendTime && Date.now() - lastResendTime < cooldownDuration) {
    return res.status(429).json({
      error: "Veuillez attendre au moins 1 minute avant de demander un autre OTP.",
    });
  }

  await OTP.deleteMany({ userID });
  await sendOTPemail({ _id: userID, email }, res);
  await updateLastResendTime(userID);
});

// Controller function to verify OTP
export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    return res.status(404).json({ error: "Utilisateur non trouvé !" });
  }
  if (existingUser.verified) {
    return res.status(400).json({ error: "L'email est déjà vérifié !" });
  }

  const userID = existingUser._id;

  const otpRecord = await OTP.findOne({ userID }).sort({ expiresAt: -1 });
  if (!otpRecord) {
    return res
      .status(400)
      .json({ error: "Aucun OTP valide trouvé. Veuillez demander un nouvel OTP." });
  }

  if (otpRecord.expiresAt && otpRecord.expiresAt < Date.now()) {
    await OTP.deleteMany({ userID });
    return res.status(400).json({ error: "L'OTP a expiré !" });
  }

  const validOTP = await bcrypt.compare(otp, otpRecord.otp);
  if (!validOTP) {
    return res
      .status(400)
      .json({ error: "OTP invalide. Veuillez vérifier votre boîte de réception !" });
  }

  await User.updateOne({ _id: userID }, { verified: true });
  await OTP.deleteMany({ userID });

  return res.status(200).json({
    message: "Adresse e-mail vérifiée avec succès !",
    user: {
      _id: existingUser._id,
      username: existingUser.username,
      email: existingUser.email,
      verified: true,
    },
  });
});

import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import authenticateUser from './middlewares/authenticateUser.js';

// Configuration des variables d'environnement
dotenv.config();

// Configuration de l'application
const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configuration de CORS
app.use(
  cors({
    origin: "https://expense-davincit.vercel.app", // Ajuster en fonction des besoins en production
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/incomes", authenticateUser, incomeRoutes);
app.use("/api/v1/expenses", authenticateUser, expenseRoutes);

// Middleware global pour la gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Démarrer le serveur
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le PORT ${PORT} !`);
    });
  } catch (error) {
    console.error(`Erreur lors du démarrage du serveur : ${error.message}`);
    process.exit(1);
  }
};

startServer();
   
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Configuration
dotenv.config();

// Initialisation de l'app Express
const app = express();

// Configuration CORS améliorée pour accepter toutes les origines
app.use(cors({
  origin: '*',  // Accepte toutes les origines
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Middleware
app.use(express.json()); // Pour parser les requêtes JSON
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: "Bienvenue sur l'API ZoldStudio!", status: "online" });
});

// Route de test pour vérifier si l'API fonctionne
app.get('/test', (req, res) => {
  res.json({ message: "L'API fonctionne correctement!", status: "online" });
});

// Importer les routes
app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/products', require('./routes/productRoutes'));

// Fonction pour démarrer le serveur avec la gestion d'erreurs de port
const startServer = (port) => {
  // S'assurer que le port est un nombre
  port = parseInt(port, 10);

  const server = app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Le port ${port} est déjà utilisé, tentative avec le port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Erreur lors du démarrage du serveur:', err);
    }
  });
  
  return server;
};

// Port initial à utiliser (s'assurer qu'il s'agit d'un nombre)
const PORT = parseInt(process.env.PORT || '5000', 10);
startServer(PORT);

// Connexion à MongoDB en arrière-plan (ne bloque pas le démarrage du serveur)
const connectDB = require('./config/db');
connectDB()
  .then(isConnected => {
    if (isConnected) {
      console.log('Base de données MongoDB connectée avec succès');
    } else {
      console.log('Le serveur fonctionne sans connexion à MongoDB. Certaines fonctionnalités ne seront pas disponibles.');
    }
  })
  .catch(err => {
    console.error('Erreur lors de la connexion à MongoDB:', err.message);
  });
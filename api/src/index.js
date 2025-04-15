const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

/**
 * Configuration optimisée pour GitHub CI/CD
 * Dernière mise à jour: 16/04/2025
 */

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
app.use(express.json({ limit: '10mb' })); // Pour parser les requêtes JSON avec une limite de taille
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware pour les timeouts des requêtes
app.use((req, res, next) => {
  // Définir un timeout pour chaque requête (30 secondes)
  req.setTimeout(30000, () => {
    console.log('Requête timeout après 30s:', req.url);
    res.status(408).json({ message: 'Timeout de la requête', status: 'error' });
  });
  next();
});

// Gestion des erreurs non capturées dans les promesses
process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesse non gérée rejetée:', reason);
  // Ne pas planter le serveur, juste logger l'erreur
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('Erreur non capturée:', error);
  // Ne pas planter le serveur, juste logger l'erreur
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: "Bienvenue sur l'API ZoldStudio!", status: "online" });
});

// Route de test pour vérifier si l'API fonctionne
app.get('/test', (req, res) => {
  res.json({ message: "L'API fonctionne correctement!", status: "online" });
});

// Point de terminaison pour les vérifications de santé
app.get('/health', (req, res) => {
  // Vérifier la connexion à la base de données
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    memory: process.memoryUsage(),
  });
});

// Route pour redémarrer la connexion à MongoDB manuellement
app.post('/api/admin/restart-db', async (req, res) => {
  try {
    console.log('Tentative de redémarrage de la connexion MongoDB');
    
    // Fermer la connexion existante si elle existe
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Connexion MongoDB fermée');
    }
    
    // Reconnecter
    const connectDB = require('./config/db');
    const connected = await connectDB();
    
    res.json({
      success: connected,
      message: connected ? 'Connexion MongoDB redémarrée avec succès' : 'Échec du redémarrage de la connexion MongoDB',
    });
  } catch (error) {
    console.error('Erreur lors du redémarrage de MongoDB:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du redémarrage de MongoDB', 
      error: error.message 
    });
  }
});

// Importer les routes
app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/products', require('./routes/productRoutes'));

// Middleware pour gérer les erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: "Cette route n'existe pas", status: "error" });
});

// Middleware pour la gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error(`Erreur API: ${err.stack}`);
  res.status(err.status || 500).json({
    message: err.message || "Une erreur interne s'est produite",
    status: "error"
  });
});

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

  // Configuration des timeouts du serveur
  server.timeout = 60000; // 60 secondes
  server.keepAliveTimeout = 65000; // Un peu plus que timeout
  
  // Vérification de l'état du serveur toutes les 5 minutes
  setInterval(() => {
    console.log(`État du serveur: En cours d'exécution depuis ${Math.floor(process.uptime())} secondes`);
    
    // Vérifier la connexion MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB déconnecté, tentative de reconnexion automatique...');
      const connectDB = require('./config/db');
      connectDB().catch(err => console.error('Échec de la reconnexion MongoDB:', err));
    }
  }, 300000); // 5 minutes
  
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
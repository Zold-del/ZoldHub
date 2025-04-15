const mongoose = require('mongoose');

// Variable pour suivre les tentatives de reconnexion
let retryCount = 0;
const maxRetries = 5;

// Fonction pour connecter à MongoDB
const connectDB = async () => {
  try {
    // Configuration de la connexion à MongoDB Atlas avec vos identifiants
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://Anthony:2EiwRXOGFEbGHWLJ@cluster0.m0dfgom.mongodb.net/zoldstudio?retryWrites=true&w=majority';
    
    console.log('Tentative de connexion à MongoDB...');
    
    // Réduire les délais d'attente pour éviter les blocages
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Réduit à 5 secondes au lieu de 10
      socketTimeoutMS: 30000, // Réduit à 30 secondes au lieu de 45
      connectTimeoutMS: 5000, // Réduit à 5 secondes au lieu de 10
      heartbeatFrequencyMS: 10000, // Augmente la fréquence des heartbeats
      family: 4 // Forcer l'utilisation d'IPv4
    });
    
    // Réinitialiser le compteur de tentatives en cas de succès
    retryCount = 0;
    
    // Gérer les événements de connexion MongoDB
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB déconnecté, tentative de reconnexion...');
      // Ne tente de se reconnecter que si nous n'avons pas dépassé le nombre maximum de tentatives
      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(() => reconnect(), 5000);
      }
    });
    
    mongoose.connection.on('error', (err) => {
      console.error(`Erreur de connexion MongoDB: ${err}`);
      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(() => reconnect(), 5000);
      }
    });
    
    console.log(`MongoDB connecté avec succès: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`Erreur de connexion à MongoDB: ${error.message}`);
    console.error('Vérifiez votre connexion Internet et vos identifiants MongoDB Atlas');
    console.log('L\'API fonctionnera sans connexion à la base de données (fonctionnalités limitées)');
    
    // Tentative de reconnexion en cas d'échec, sauf si le nombre maximum de tentatives est atteint
    if (retryCount < maxRetries) {
      retryCount++;
      console.log(`Tentative de reconnexion ${retryCount}/${maxRetries} dans 5 secondes...`);
      setTimeout(() => reconnect(), 5000);
    }
    
    return false;
  }
};

// Fonction de reconnexion
const reconnect = async () => {
  console.log(`Tentative de reconnexion ${retryCount}/${maxRetries}...`);
  try {
    await connectDB();
  } catch (error) {
    console.error(`Échec de la tentative de reconnexion: ${error.message}`);
  }
};

module.exports = connectDB;
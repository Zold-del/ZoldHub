const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Configuration de la connexion à MongoDB Atlas avec vos identifiants
    const mongoURI = 'mongodb+srv://Anthony:2EiwRXOGFEbGHWLJ@cluster0.m0dfgom.mongodb.net/zoldstudio?retryWrites=true&w=majority';
    
    console.log('Tentative de connexion à MongoDB...');
    
    // Augmenter les délais d'attente pour une connexion plus fiable
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 secondes au lieu de 2
      socketTimeoutMS: 45000, // 45 secondes au lieu de 5
      connectTimeoutMS: 10000, // 10 secondes au lieu de 2
      family: 4 // Forcer l'utilisation d'IPv4, peut résoudre certains problèmes de connexion
    });
    
    console.log(`MongoDB connecté avec succès: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`Erreur de connexion à MongoDB: ${error.message}`);
    console.error('Vérifiez votre connexion Internet et vos identifiants MongoDB Atlas');
    console.log('L\'API fonctionnera sans connexion à la base de données (fonctionnalités limitées)');
    return false;
  }
};

module.exports = connectDB;
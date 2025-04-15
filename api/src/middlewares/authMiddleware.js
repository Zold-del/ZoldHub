const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/**
 * Middleware de protection des routes
 * Vérifie si l'utilisateur est authentifié via un JWT valide
 */
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Vérifier si le token existe dans les headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Récupérer le token du header Authorization (format: "Bearer TOKEN")
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({
        message: 'Accès non autorisé, token manquant',
        status: 'error'
      });
    }
    
    try {
      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Récupérer l'utilisateur correspondant (sans le mot de passe)
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          message: 'Utilisateur introuvable',
          status: 'error'
        });
      }
      
      // Ajouter l'utilisateur à l'objet req
      req.user = user;
      next();
    } catch (error) {
      console.error('Erreur de vérification du token:', error);
      return res.status(401).json({
        message: 'Token invalide ou expiré',
        status: 'error'
      });
    }
  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification:', error);
    return res.status(500).json({
      message: 'Erreur serveur',
      status: 'error'
    });
  }
};

/**
 * Middleware pour vérifier les rôles
 * Vérifie si l'utilisateur a le rôle requis
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Utilisateur non authentifié',
        status: 'error'
      });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Permission refusée',
        status: 'error'
      });
    }
    
    next();
  };
};

module.exports = { protect, authorize };
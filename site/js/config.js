/**
 * Configuration principale pour ZoldStudio GameHub
 * Ce fichier centralise toutes les configurations de l'application
 */

// Détection automatique de l'environnement pour choisir la bonne URL
const getApiBaseUrl = () => {
  // Détection de l'environnement
  const hostname = window.location.hostname;
  
  // Si nous sommes sur GitHub Pages
  if (hostname === 'zold-del.github.io') {
    // API déployée sur render.com (service gratuit pour héberger des API)
    return 'https://zoldstudio-api.onrender.com';
  }
  
  // Si on est sur un serveur local (IP ou localhost)
  return `http://${hostname}:5000`;
};

const CONFIG = {
  // Configuration de l'API
  API: {
    BASE_URL: getApiBaseUrl(),
    ENDPOINTS: {
      BASE: '/api',
      USERS: '/api/users',
      REGISTER: '/api/users/register',
      LOGIN: '/api/users/login',
      PROFILE: '/api/users/profile',
      CHANNELS: '/api/channels',
      MESSAGES: '/api/messages',
      TEST: '/test'
    },
    CHECK_INTERVAL: 10000 // Vérification du statut de l'API toutes les 10 secondes
  },
  
  // Configuration du localStorage
  STORAGE: {
    TOKEN_KEY: 'gamehub_token',
    USER_KEY: 'gamehub_user',
    SETTINGS_KEY: 'gamehub_settings'
  },
  
  // Paramètres de l'interface
  UI: {
    NOTIFICATION_TIMEOUT: 5000, // Durée d'affichage des notifications en ms
    DEFAULT_THEME: 'dark' // Thème par défaut (dark ou light)
  }
};

// Export de la configuration pour l'utiliser dans d'autres fichiers
window.CONFIG = CONFIG;
/**
 * Module de connexion à l'API ZoldStudio
 * Ce fichier contient toutes les fonctions nécessaires pour communiquer
 * avec l'API backend connectée à MongoDB
 */

// Utiliser la configuration centralisée
const API_BASE_URL = CONFIG.API.BASE_URL;
const API_ENDPOINTS = CONFIG.API.ENDPOINTS;

// Variable pour stocker l'état précédent de l'API
let previousApiStatus = false;

/**
 * Classe pour gérer les appels à l'API ZoldStudio
 */
class ZoldStudioAPI {
  /**
   * Vérifie si l'API est accessible
   * @returns {Promise<boolean>} Vrai si l'API est accessible
   */
  static async checkAPIStatus() {
    try {
      console.log('Vérification du statut de l\'API...');
      const response = await fetch(`${API_BASE_URL}/test`, {
        // Ajouter un paramètre unique pour éviter le cache
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        // Ajouter un paramètre aléatoire dans l'URL pour contourner le cache
        method: 'GET'
      });
      
      // Vérification plus stricte du statut de la réponse
      if (!response.ok) {
        console.error(`API inaccessible: statut HTTP ${response.status}`);
        
        if (previousApiStatus) {
          previousApiStatus = false;
          const event = new CustomEvent('apiStatusChanged', { 
            detail: { isOnline: false } 
          });
          document.dispatchEvent(event);
        }
        
        return false;
      }

      const data = await response.json();
      console.log('Statut de l\'API:', data);
      
      const isOnline = data && data.status === 'online';
      
      // Si l'état de l'API a changé, déclencher une action
      if (isOnline !== previousApiStatus) {
        console.log(`État de l'API changé: ${previousApiStatus ? 'online' : 'offline'} -> ${isOnline ? 'online' : 'offline'}`);
        previousApiStatus = isOnline;
        
        // Déclencher un événement personnalisé
        const event = new CustomEvent('apiStatusChanged', { 
          detail: { isOnline } 
        });
        document.dispatchEvent(event);
      }
      
      return isOnline;
    } catch (error) {
      console.error('API inaccessible:', error);
      
      // Si l'API était précédemment en ligne, marquer le changement d'état
      if (previousApiStatus) {
        previousApiStatus = false;
        
        // Déclencher un événement personnalisé
        const event = new CustomEvent('apiStatusChanged', { 
          detail: { isOnline: false } 
        });
        document.dispatchEvent(event);
      }
      
      return false;
    }
  }

  /**
   * Gère les réponses de l'API
   * @private
   */
  static async handleResponse(response) {
    try {
      const contentType = response.headers.get('content-type');
      
      // Si la réponse n'est pas du JSON, lever une erreur personnalisée
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Format de réponse inattendu du serveur');
      }
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Erreur: ${response.status} ${response.statusText}`);
      }
      return data;
    } catch (error) {
      console.error('Erreur lors du traitement de la réponse:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les utilisateurs
   * @returns {Promise<Array>} Liste des utilisateurs
   */
  static async getAllUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS}`);
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  }

  /**
   * Récupère un utilisateur par son ID
   * @param {string} userId - L'ID de l'utilisateur à récupérer
   * @returns {Promise<Object>} Les détails de l'utilisateur
   */
  static async getUserById(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS}/${userId}`);
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'utilisateur ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Crée un nouvel utilisateur
   * @param {Object} userData - Les données de l'utilisateur à créer
   * @param {string} userData.name - Le nom de l'utilisateur
   * @param {string} userData.email - L'email de l'utilisateur
   * @param {string} userData.password - Le mot de passe de l'utilisateur
   * @returns {Promise<Object>} Les détails du nouvel utilisateur créé
   */
  static async createUser(userData) {
    try {
      // Vérifier d'abord si l'API est accessible
      const isAPIOnline = await this.checkAPIStatus();
      if (!isAPIOnline) {
        throw new Error('Le serveur API ne semble pas fonctionner correctement. Vérifiez que l\'API est bien démarrée.');
      }
      
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Connecte un utilisateur existant
   * @param {Object} loginData - Les identifiants de connexion
   * @param {string} loginData.email - L'email de l'utilisateur
   * @param {string} loginData.password - Le mot de passe de l'utilisateur
   * @returns {Promise<Object>} Les données d'authentification (token et infos utilisateur)
   */
  static async loginUser(loginData) {
    try {
      // Vérifier d'abord si l'API est accessible
      const isAPIOnline = await this.checkAPIStatus();
      if (!isAPIOnline) {
        throw new Error('Le serveur API ne semble pas fonctionner correctement. Vérifiez que l\'API est bien démarrée.');
      }
      
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  /**
   * Récupère le profil de l'utilisateur connecté
   * @param {string} token - Le token d'authentification
   * @returns {Promise<Object>} Les détails du profil utilisateur
   */
  static async getUserProfile(token) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les canaux
   * @param {string} token - Le token d'authentification
   * @returns {Promise<Array>} Liste des canaux
   */
  static async getChannels(token) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHANNELS}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des canaux:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau canal
   * @param {Object} channelData - Les données du canal à créer
   * @param {string} token - Le token d'authentification
   * @returns {Promise<Object>} Les détails du nouveau canal créé
   */
  static async createChannel(channelData, token) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHANNELS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(channelData),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la création du canal:', error);
      throw error;
    }
  }

  /**
   * Récupère les messages d'un canal
   * @param {string} channelId - L'ID du canal
   * @param {string} token - Le token d'authentification
   * @returns {Promise<Array>} Liste des messages du canal
   */
  static async getMessages(channelId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHANNELS}/${channelId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      throw error;
    }
  }

  /**
   * Envoie un message dans un canal
   * @param {string} channelId - L'ID du canal
   * @param {Object} messageData - Les données du message à envoyer
   * @param {string} token - Le token d'authentification
   * @returns {Promise<Object>} Les détails du message envoyé
   */
  static async sendMessage(channelId, messageData, token) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHANNELS}/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(messageData),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  }

  /**
   * Crée plusieurs utilisateurs bots pour tester l'application
   * @param {number} count - Nombre de bots à créer
   * @param {string} token - Le token d'authentification admin
   * @returns {Promise<Array>} Liste des bots créés
   */
  static async createBots(count, token) {
    try {
      const botNames = [
        'ZoldBot', 'AssistantBot', 'HelperBot', 'ModeratorBot', 'GuardBot',
        'InfoBot', 'TestBot', 'DevBot', 'ChatBot', 'StatusBot'
      ];
      
      const botAvatars = Array.from({length: 27}, (_, i) => `android-${i+1}.png`);
      
      const bots = [];
      for (let i = 0; i < Math.min(count, botNames.length); i++) {
        const botData = {
          username: botNames[i],
          email: `${botNames[i].toLowerCase()}@zoldstudio.com`,
          password: 'Bot123456!',
          isBot: true,
          avatar: `/images/customizations/avatars/${botAvatars[i % botAvatars.length]}`,
          status: 'online'
        };
        
        try {
          const bot = await this.createUser(botData);
          bots.push(bot);
          console.log(`Bot créé: ${botNames[i]}`);
        } catch (error) {
          console.error(`Erreur lors de la création du bot ${botNames[i]}:`, error);
        }
      }
      
      return bots;
    } catch (error) {
      console.error('Erreur lors de la création des bots:', error);
      throw error;
    }
  }
}

// Vérifier le statut de l'API au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  // Vérification initiale avec un court délai pour s'assurer que auth est chargé
  setTimeout(() => {
    ZoldStudioAPI.checkAPIStatus()
      .then(isOnline => {
        console.log('API en ligne:', isOnline);
        // Mettre à jour l'indicateur visuel de statut API
        if (window.auth) {
          window.auth.updateAPIStatus(isOnline ? 'online' : 'offline');
        }
      })
      .catch(error => {
        console.error('Erreur lors de la vérification du statut de l\'API:', error);
        if (window.auth) {
          window.auth.updateAPIStatus('offline');
        }
      });
  }, 500);
  
  // Vérification périodique
  setInterval(() => {
    ZoldStudioAPI.checkAPIStatus()
      .then(isOnline => {
        console.log('Vérification périodique - API en ligne:', isOnline);
        // Mettre à jour l'indicateur visuel de statut API
        if (window.auth) {
          window.auth.updateAPIStatus(isOnline ? 'online' : 'offline');
        }
      })
      .catch(error => {
        console.error('Erreur lors de la vérification périodique:', error);
        if (window.auth) {
          window.auth.updateAPIStatus('offline');
        }
      });
  }, CONFIG.API.CHECK_INTERVAL);
  
  // Écouter les événements de changement d'état de l'API
  document.addEventListener('apiStatusChanged', (e) => {
    console.log('Événement apiStatusChanged reçu:', e.detail);
    
    if (e.detail.isOnline) {
      // Si l'API devient disponible, vérifier si l'utilisateur était déjà connecté
      // et rafraîchir l'état global
      if (window.auth && window.auth.isLoggedIn()) {
        console.log('API disponible, rafraîchissement de l\'état utilisateur');
        window.auth.checkUserState();
      }
    }
  });
});

// Exportation de la classe pour l'utiliser dans d'autres fichiers
window.ZoldStudioAPI = ZoldStudioAPI;
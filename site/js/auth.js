/**
 * Module d'authentification pour GameHub
 * Gère l'inscription, la connexion et la déconnexion des utilisateurs
 */

class Auth {
  constructor() {
    // Utiliser les clés depuis la configuration centralisée
    this.tokenKey = CONFIG.STORAGE.TOKEN_KEY;
    this.userKey = CONFIG.STORAGE.USER_KEY;
    this.notificationTimeout = CONFIG.UI.NOTIFICATION_TIMEOUT;
    
    this.initEventListeners();
    this.checkAuthStatus();
    this.setupAPIStatusMonitor();
  }

  /**
   * Initialise les écouteurs d'événements
   */
  initEventListeners() {
    // Formulaire d'inscription
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.register();
      });
    }

    // Formulaire de connexion
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.login();
      });
    }

    // Bouton de déconnexion
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    // Validation de confirmation de mot de passe
    const confirmPasswordField = document.getElementById('register-confirm-password');
    if (confirmPasswordField) {
      confirmPasswordField.addEventListener('input', () => {
        this.validatePasswordMatch();
      });
    }
    
    // Suppression des références à l'ancien profil sidebar
    
    // Boutons qui nécessitent une authentification
    const authRequiredButtons = document.querySelectorAll('[data-requires-auth="true"]');
    authRequiredButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        if (!this.isLoggedIn()) {
          e.preventDefault();
          this.showError('Vous devez être connecté pour accéder à cette fonctionnalité');
          // Ouvrir la modal de connexion
          const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
          loginModal.show();
        }
      });
    });
  }

  /**
   * Configure le monitoring du statut de l'API
   */
  setupAPIStatusMonitor() {
    const apiStatus = document.getElementById('api-status');
    
    // Vérifier le statut de l'API au chargement
    this.updateAPIStatus('connecting');
    
    // Écouter les événements de changement d'état de l'API
    document.addEventListener('apiStatusChanged', (e) => {
      console.log('Auth: Événement apiStatusChanged reçu', e.detail);
      
      // Mettre à jour l'indicateur visuel
      this.updateAPIStatus(e.detail.isOnline ? 'online' : 'offline');
      
      // Afficher une notification à l'utilisateur lors du changement d'état
      if (e.detail.isOnline) {
        this.showSuccess('Connexion à l\'API établie avec succès!');
      } else {
        this.showError('Connexion à l\'API perdue. Certaines fonctionnalités peuvent être limitées.');
      }
    });
    
    // Vérifier le statut de l'API toutes les X secondes (selon la config)
    ZoldStudioAPI.checkAPIStatus().then(isOnline => {
      this.updateAPIStatus(isOnline ? 'online' : 'offline');
    }).catch(() => {
      this.updateAPIStatus('offline');
    });

    // Vérification périodique
    setInterval(() => {
      ZoldStudioAPI.checkAPIStatus().then(isOnline => {
        this.updateAPIStatus(isOnline ? 'online' : 'offline');
      }).catch(() => {
        this.updateAPIStatus('offline');
      });
    }, CONFIG.API.CHECK_INTERVAL);
  }

  /**
   * Met à jour l'indicateur de statut de l'API
   * @param {string} status - Le statut de l'API ('online', 'offline', 'connecting')
   */
  updateAPIStatus(status) {
    const apiStatus = document.getElementById('api-status');
    const statusText = document.querySelector('#api-status .status-text');
    
    // Supprimer les classes de statut existantes
    apiStatus.classList.remove('api-online', 'api-offline', 'api-connecting');
    
    // Ajouter la nouvelle classe de statut
    apiStatus.classList.add(`api-${status}`);
    
    // Mettre à jour le texte de statut
    switch (status) {
      case 'online':
        statusText.textContent = 'API: Connectée';
        break;
      case 'offline':
        statusText.textContent = 'API: Déconnectée';
        break;
      case 'connecting':
        statusText.textContent = 'API: Connexion...';
        break;
    }
  }

  /**
   * Affiche un message de succès
   * @param {string} message - Le message à afficher
   */
  showSuccess(message) {
    const successAlert = document.getElementById('auth-success-alert');
    const successMessage = document.getElementById('success-message');
    
    successMessage.textContent = message;
    successAlert.classList.remove('d-none');
    
    setTimeout(() => {
      successAlert.classList.add('d-none');
    }, this.notificationTimeout);
  }

  /**
   * Affiche un message d'erreur
   * @param {string} message - Le message d'erreur à afficher
   */
  showError(message) {
    const errorAlert = document.getElementById('auth-error-alert');
    const errorMessage = document.getElementById('error-message');
    
    errorMessage.textContent = message;
    errorAlert.classList.remove('d-none');
    
    setTimeout(() => {
      errorAlert.classList.add('d-none');
    }, this.notificationTimeout);
  }

  /**
   * Valide que les mots de passe correspondent
   */
  validatePasswordMatch() {
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password');
    
    if (password !== confirmPassword.value) {
      confirmPassword.setCustomValidity('Les mots de passe ne correspondent pas');
    } else {
      confirmPassword.setCustomValidity('');
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const errorElement = document.getElementById('register-error');
    
    // Afficher le spinner de chargement
    document.getElementById('register-btn-text').textContent = 'Inscription en cours...';
    document.getElementById('register-spinner').classList.remove('d-none');
    
    // Vérification de la correspondance des mots de passe
    if (password !== confirmPassword) {
      errorElement.textContent = 'Les mots de passe ne correspondent pas';
      errorElement.classList.remove('d-none');
      document.getElementById('register-btn-text').textContent = 'S\'inscrire';
      document.getElementById('register-spinner').classList.add('d-none');
      return;
    }
    
    try {
      errorElement.classList.add('d-none');
      
      // Appel à l'API pour créer l'utilisateur
      const userData = await ZoldStudioAPI.createUser({ name, email, password });
      
      // Stocker les informations d'authentification
      this.setAuthData(userData.token, userData.user);
      
      // Fermer le modal et mettre à jour l'interface
      const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
      registerModal.hide();
      
      // Mettre à jour l'état global de l'utilisateur
      this.checkUserState();
      
      // Afficher un message de confirmation
      this.showSuccess(`Bienvenue, ${userData.user.name} ! Votre compte a été créé avec succès.`);
      
    } catch (error) {
      errorElement.textContent = error.message || 'Erreur lors de l\'inscription';
      errorElement.classList.remove('d-none');
      this.showError(error.message || 'Erreur lors de l\'inscription');
    } finally {
      document.getElementById('register-btn-text').textContent = 'S\'inscrire';
      document.getElementById('register-spinner').classList.add('d-none');
    }
  }

  /**
   * Connexion d'un utilisateur existant
   */
  async login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    
    // Afficher le spinner de chargement
    document.getElementById('login-btn-text').textContent = 'Connexion en cours...';
    document.getElementById('login-spinner').classList.remove('d-none');
    
    try {
      errorElement.classList.add('d-none');
      
      // Appel à l'API pour connecter l'utilisateur
      const userData = await ZoldStudioAPI.loginUser({ email, password });
      
      // Stocker les informations d'authentification
      this.setAuthData(userData.token, userData.user);
      
      // Fermer le modal et mettre à jour l'interface
      const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      loginModal.hide();
      
      // Mettre à jour l'état global de l'utilisateur
      this.checkUserState();
      
      // Afficher un message de bienvenue
      this.showSuccess(`Bienvenue, ${userData.user.name} ! Vous êtes maintenant connecté.`);
      
    } catch (error) {
      errorElement.textContent = error.message || 'Email ou mot de passe incorrect';
      errorElement.classList.remove('d-none');
      this.showError(error.message || 'Email ou mot de passe incorrect');
    } finally {
      document.getElementById('login-btn-text').textContent = 'Se connecter';
      document.getElementById('login-spinner').classList.add('d-none');
    }
  }

  /**
   * Déconnexion de l'utilisateur
   */
  logout() {
    // Supprimer les données d'authentification
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    
    // Mettre à jour l'état global de l'utilisateur
    this.checkUserState();
    
    // Afficher un message de déconnexion
    this.showSuccess('Vous avez été déconnecté avec succès.');
  }

  /**
   * Vérifie si l'utilisateur est déjà connecté
   */
  checkAuthStatus() {
    const token = localStorage.getItem(this.tokenKey);
    const user = JSON.parse(localStorage.getItem(this.userKey) || 'null');
    
    if (token && user) {
      // L'utilisateur est connecté, mettre à jour l'état global
      this.checkUserState();
    } else {
      // L'utilisateur n'est pas connecté, mettre à jour l'interface
      this.updateUI(false);
    }
  }

  /**
   * Vérifie l'état global de l'utilisateur et met à jour tous les composants du site
   * Cette fonction centralise la synchronisation de l'interface après connexion/déconnexion
   * ou au chargement de la page
   */
  checkUserState() {
    console.log('Vérification et mise à jour de l\'état utilisateur global');
    
    const token = localStorage.getItem(this.tokenKey);
    const user = JSON.parse(localStorage.getItem(this.userKey) || 'null');
    const isLoggedIn = !!token && !!user;
    
    // Mettre à jour l'interface de base (boutons de connexion/déconnexion)
    this.updateUI(isLoggedIn);
    
    if (isLoggedIn) {
      console.log('Utilisateur connecté, synchronisation des composants du site');
      
      // Mise à jour du profil utilisateur
      this.updateUserProfile(user);
      
      // Actualiser les données du popup de profil
      this.updateProfilePopup(user);
      
      // Vérifier les accès aux fonctionnalités réservées aux utilisateurs connectés
      this.updateRestrictedFeatures(true);
      
      // Déclencher un événement personnalisé pour que d'autres modules puissent réagir
      this.triggerUserStateChanged(true);
      
    } else {
      console.log('Utilisateur non connecté, réinitialisation des composants du site');
      
      // Masquer le popup de profil s'il est ouvert
      this.hideProfilePopup();
      
      // Réinitialiser les accès aux fonctionnalités réservées
      this.updateRestrictedFeatures(false);
      
      // Déclencher un événement personnalisé pour que d'autres modules puissent réagir
      this.triggerUserStateChanged(false);
    }
    
    // Ne pas modifier l'état de l'API ici - cela sera géré par les vérifications réelles de l'API
  }
  
  /**
   * Met à jour l'interface utilisateur en fonction de l'état de connexion
   * @param {boolean} isLoggedIn - Si l'utilisateur est connecté ou non
   */
  updateUI(isLoggedIn) {
    console.log('Mise à jour de l\'interface utilisateur:', isLoggedIn ? 'connecté' : 'non connecté');
    
    const loginBtn = document.getElementById('btn-login');
    const registerBtn = document.getElementById('btn-register');
    const userProfile = document.getElementById('user-profile');
    const logoutBtn = document.getElementById('btn-logout');
    
    if (isLoggedIn) {
      // Masquer les boutons de connexion/inscription
      if (loginBtn) loginBtn.classList.add('d-none');
      if (registerBtn) registerBtn.classList.add('d-none');
      
      // Afficher le profil utilisateur et le bouton de déconnexion
      if (userProfile) userProfile.classList.remove('d-none');
      
      // Mettre à jour les éléments de l'interface qui dépendent de l'état connecté
      this.updateUserProfile(this.getUser());
    } else {
      // Afficher les boutons de connexion/inscription
      if (loginBtn) loginBtn.classList.remove('d-none');
      if (registerBtn) registerBtn.classList.remove('d-none');
      
      // Masquer le profil utilisateur
      if (userProfile) userProfile.classList.add('d-none');
      
      // Réinitialiser tous les éléments de l'interface qui dépendent de l'état utilisateur
      this.resetUI();
    }
    
    // Mettre à jour l'accès aux fonctionnalités réservées
    this.updateRestrictedFeatures(isLoggedIn);
  }
  
  /**
   * Réinitialise l'interface utilisateur à l'état par défaut (non connecté)
   */
  resetUI() {
    // Réinitialiser le nom d'utilisateur
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
      usernameElement.textContent = 'Username';
    }
    
    // Réinitialiser l'image de profil
    const userProfileImg = document.querySelector('#user-profile img');
    if (userProfileImg) {
      userProfileImg.src = 'https://placehold.co/40x40/8a2be2/white?text=Z';
    }
    
    // Réinitialiser les autres éléments d'interface si nécessaire
    // ...
  }
  
  /**
   * Met à jour le profil utilisateur affiché dans l'interface
   * @param {Object} user - Les informations de l'utilisateur
   */
  updateUserProfile(user) {
    if (!user) return;
    
    const usernameElement = document.getElementById('username');
    const userProfileImg = document.querySelector('#user-profile img');
    
    if (usernameElement) {
      usernameElement.textContent = user.name;
    }
    
    if (userProfileImg && user.customizations && user.customizations.avatar) {
      userProfileImg.src = `images/customizations/avatars/${user.customizations.avatar}`;
    }
  }
  
  /**
   * Met à jour le popup du profil utilisateur
   * @param {Object} user - Les informations de l'utilisateur
   */
  updateProfilePopup(user) {
    if (!user) return;
    
    const popupUsername = document.getElementById('popup-username');
    const popupUserAvatar = document.getElementById('popup-user-avatar');
    const popupAvatarContainer = document.getElementById('popup-avatar-container');
    const popupBannerPreview = document.getElementById('popup-banner-preview');
    
    if (popupUsername) {
      popupUsername.textContent = user.name;
    }
    
    if (popupUserAvatar) {
      if (!user.customizations || !user.customizations.avatar) {
        popupUserAvatar.src = "https://placehold.co/80x80/8a2be2/white?text=Z";
      } else if (user.customizations.avatar === 'default-avatar.jpg') {
        popupUserAvatar.src = "https://placehold.co/80x80/8a2be2/white?text=Z";
      } else {
        popupUserAvatar.src = `images/customizations/avatars/${user.customizations.avatar}`;
      }
    }
    
    if (popupBannerPreview) {
      // Supprimer toutes les classes de bannière sauf banner-css
      popupBannerPreview.className = 'banner-css';
      
      const bannerType = user.customizations && user.customizations.banner 
        ? user.customizations.banner 
        : 'default';
        
      // Ajouter la classe de la bannière sélectionnée
      popupBannerPreview.classList.add(`banner-${bannerType}`);
    }
    
    if (popupAvatarContainer) {
      // Supprimer toutes les classes de frame sauf avatar-container
      popupAvatarContainer.className = 'avatar-container';
      
      // Ajouter la classe du cadre sélectionné
      const frameType = user.customizations && user.customizations.frame 
        ? user.customizations.frame 
        : 'default';
        
      popupAvatarContainer.classList.add(`${frameType}-frame`);
    }
  }
  
  /**
   * Cache le popup de profil s'il est ouvert
   */
  hideProfilePopup() {
    const profilePopup = document.getElementById('profile-popup');
    if (profilePopup) {
      profilePopup.classList.add('d-none');
    }
  }
  
  /**
   * Met à jour l'accès aux fonctionnalités réservées aux utilisateurs connectés
   * @param {boolean} isLoggedIn - Si l'utilisateur est connecté ou non
   */
  updateRestrictedFeatures(isLoggedIn) {
    // Boutons qui nécessitent une authentification
    const authRequiredButtons = document.querySelectorAll('[data-requires-auth="true"]');
    
    authRequiredButtons.forEach(button => {
      if (isLoggedIn) {
        button.removeAttribute('disabled');
        button.classList.remove('disabled');
      } else {
        button.setAttribute('disabled', 'true');
        button.classList.add('disabled');
      }
    });
    
    // Sections qui nécessitent une authentification
    const authRequiredSections = document.querySelectorAll('[data-requires-auth="true"]');
    
    authRequiredSections.forEach(section => {
      if (isLoggedIn) {
        section.classList.remove('d-none');
      } else {
        section.classList.add('d-none');
      }
    });
  }
  
  /**
   * Déclenche un événement personnalisé pour signaler un changement d'état utilisateur
   * @param {boolean} isLoggedIn - Si l'utilisateur est connecté ou non
   */
  triggerUserStateChanged(isLoggedIn) {
    const event = new CustomEvent('userStateChanged', { 
      detail: { 
        isLoggedIn,
        user: isLoggedIn ? this.getUser() : null
      }
    });
    
    document.dispatchEvent(event);
    
    // Forcer une vérification de l'état de l'API après un changement d'état utilisateur
    setTimeout(() => {
      if (window.ZoldStudioAPI) {
        console.log('Vérification forcée du statut API après changement d\'état utilisateur');
        window.ZoldStudioAPI.checkAPIStatus().then(isOnline => {
          console.log('Résultat de la vérification forcée du statut API:', isOnline ? 'connectée' : 'déconnectée');
          this.updateAPIStatus(isOnline ? 'online' : 'offline');
        }).catch(err => {
          console.error('Erreur lors de la vérification forcée du statut API:', err);
          this.updateAPIStatus('offline');
        });
      }
    }, 500); // Petit délai pour s'assurer que l'état utilisateur est complètement mis à jour
  }

  /**
   * Stocke les données d'authentification dans le localStorage
   * @param {string} token - Le token d'authentification
   * @param {Object} user - Les informations de l'utilisateur
   */
  setAuthData(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Récupère les données d'authentification du localStorage
   * @returns {Object} Les données d'authentification
   */
  getAuthData() {
    return {
      token: localStorage.getItem(this.tokenKey),
      user: JSON.parse(localStorage.getItem(this.userKey) || 'null')
    };
  }

  /**
   * Vérifie si l'utilisateur est connecté
   * @returns {boolean} Vrai si l'utilisateur est connecté
   */
  isLoggedIn() {
    return !!localStorage.getItem(this.tokenKey);
  }

  /**
   * Récupère le token d'authentification
   * @returns {string|null} Le token d'authentification ou null
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Récupère les informations de l'utilisateur connecté
   * @returns {Object|null} Les informations de l'utilisateur ou null
   */
  getUser() {
    return JSON.parse(localStorage.getItem(this.userKey) || 'null');
  }
}

// Variables globales pour les éléments du popup du profil
let profilePopup;
let userProfileElement;
let popupUsername;
let popupUserAvatar;
let closePopupBtn;
let popupLogoutBtn;

// Fonction pour afficher/masquer le popup du profil utilisateur
function toggleProfilePopup(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation(); // Empêcher la propagation de l'événement
  }
  
  console.log("toggleProfilePopup appelé");

  // S'assurer que tous les éléments nécessaires sont définis
  profilePopup = document.getElementById('profile-popup');
  popupUsername = document.getElementById('popup-username');
  popupUserAvatar = document.getElementById('popup-user-avatar');
  const popupAvatarContainer = document.getElementById('popup-avatar-container');
  const popupBannerPreview = document.getElementById('popup-banner-preview');

  if (!profilePopup) {
    console.error("Élément #profile-popup non trouvé dans le DOM");
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem(CONFIG.STORAGE.USER_KEY) || 'null');
  if (currentUser && profilePopup) {
    // Mettre à jour les informations du profil dans le popup
    if (popupUsername) popupUsername.textContent = currentUser.name;
    
    // Mettre à jour l'avatar si disponible dans le profil utilisateur
    if (popupUserAvatar) {
      if (!currentUser.customizations || !currentUser.customizations.avatar) {
        popupUserAvatar.src = "https://placehold.co/80x80/8a2be2/white?text=Z";
      } else if (currentUser.customizations.avatar === 'default-avatar.jpg') {
        popupUserAvatar.src = "https://placehold.co/80x80/8a2be2/white?text=Z";
      } else {
        popupUserAvatar.src = `images/customizations/avatars/${currentUser.customizations.avatar}`;
      }
    }
    
    // Mettre à jour la bannière si disponible dans le profil utilisateur
    if (popupBannerPreview) {
      // Supprimer toutes les classes de bannière sauf banner-css
      popupBannerPreview.className = 'banner-css';
      
      const bannerType = currentUser.customizations && currentUser.customizations.banner 
        ? currentUser.customizations.banner 
        : 'default';
        
      // Ajouter la classe de la bannière sélectionnée
      popupBannerPreview.classList.add(`banner-${bannerType}`);
    }
    
    // Mettre à jour le cadre de l'avatar
    if (popupAvatarContainer) {
      // Supprimer toutes les classes de frame sauf avatar-container
      popupAvatarContainer.className = 'avatar-container';
      
      // Ajouter la classe du cadre sélectionné
      const frameType = currentUser.customizations && currentUser.customizations.frame 
        ? currentUser.customizations.frame 
        : 'default';
        
      popupAvatarContainer.classList.add(`${frameType}-frame`);
    }
    
    // Toggle l'affichage du popup
    if (profilePopup.classList.contains('d-none')) {
      profilePopup.classList.remove('d-none');
      console.log("Popup affiché");
    } else {
      profilePopup.classList.add('d-none');
      console.log("Popup masqué");
    }
  } else {
    console.error("Utilisateur non trouvé ou élément profilePopup non défini");
  }
}

// Initialiser l'authentification au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  // Initialiser les éléments du DOM
  profilePopup = document.getElementById('profile-popup');
  userProfileElement = document.getElementById('user-profile');
  popupUsername = document.getElementById('popup-username');
  popupUserAvatar = document.getElementById('popup-user-avatar');
  closePopupBtn = document.getElementById('close-popup');
  popupLogoutBtn = document.getElementById('popup-logout');
  
  console.log("Éléments DOM initialisés:", {
    profilePopup: !!profilePopup,
    userProfileElement: !!userProfileElement,
    popupUsername: !!popupUsername,
    popupUserAvatar: !!popupUserAvatar,
    closePopupBtn: !!closePopupBtn,
    popupLogoutBtn: !!popupLogoutBtn
  });

  // Ajouter un gestionnaire d'événement pour ouvrir le popup quand on clique sur le profil utilisateur
  if (userProfileElement) {
    userProfileElement.addEventListener('click', (e) => {
      e.preventDefault();
      toggleProfilePopup(e);
    });
    console.log("Événement click ajouté à userProfileElement");
  }

  // Événement pour fermer le popup en cliquant sur le bouton de fermeture
  if (closePopupBtn) {
    closePopupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (profilePopup) {
        profilePopup.classList.add('d-none');
        console.log("Popup fermé via le bouton de fermeture");
      }
    });
  }
  
  // Événement pour se déconnecter via le bouton du popup
  if (popupLogoutBtn) {
    popupLogoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.auth) {
        window.auth.logout();
      }
    });
  }
  
  // Fermer le popup en cliquant en dehors
  document.addEventListener('click', (e) => {
    if (profilePopup && !profilePopup.classList.contains('d-none')) {
      // Vérifier si le clic est en dehors du popup et de l'élément du profil utilisateur
      if (!profilePopup.contains(e.target) && 
          (!userProfileElement || !userProfileElement.contains(e.target))) {
        profilePopup.classList.add('d-none');
        console.log("Popup fermé en cliquant en dehors");
      }
    }
  });
  
  window.auth = new Auth();
});
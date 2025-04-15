const User = require('../models/userModel');

// @desc    Récupérer tous les utilisateurs
// @route   GET /api/users
// @access  Public
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Récupérer un utilisateur par ID
// @route   GET /api/users/:id
// @access  Public
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Créer un nouvel utilisateur
// @route   POST /api/users
// @access  Public
const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Vérification si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    const user = await User.create({
      name,
      email,
      password, // Normalement, vous devriez hacher le mot de passe avant de l'enregistrer
    });
    
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: 'Données utilisateur invalides' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Inscrire un nouvel utilisateur et générer un token
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validation simple
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
    }
    
    // Vérification si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Créer l'utilisateur
    const user = await User.create({
      name,
      email,
      password,
    });
    
    if (user) {
      // Pour la simplicité, utilisons un faux token pour le moment
      // Dans un vrai système, utilisez JWT ou un autre système de token sécurisé
      const token = `fake-jwt-token-${user._id}`;
      
      res.status(201).json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      });
    } else {
      res.status(400).json({ message: 'Données utilisateur invalides' });
    }
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' });
  }
};

// @desc    Authentifier un utilisateur et générer un token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation simple
    if (!email || !password) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
    }
    
    // Rechercher l'utilisateur
    const user = await User.findOne({ email });
    
    // Pour développement rapide - comparaison simple de mot de passe
    // Normalement, utilisez bcrypt.compare pour comparer le mot de passe haché
    if (user && user.password === password) {
      // Créer un faux token pour le moment
      const token = `fake-jwt-token-${user._id}`;
      
      res.json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      });
    } else {
      res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
  }
};

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/users/profile
// @access  Private (normalement protégé par middleware d'authentification)
const getUserProfile = async (req, res) => {
  // Dans une vraie application, cette information viendrait du token décodé
  // Pour le moment, simulons une authentification
  try {
    // Simuler l'extraction d'ID à partir d'un token
    const userId = req.headers.authorization ? 
      req.headers.authorization.split('-')[2] : 
      null;
      
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé, pas de token' });
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    console.error('Erreur dans getUserProfile:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Envoyer une demande d'ami
// @route   POST /api/users/:id/friend-request
// @access  Private
const sendFriendRequest = async (req, res) => {
  try {
    // Dans une vraie application, le userId viendrait du token décodé
    const userId = req.headers.authorization ? 
      req.headers.authorization.split('-')[2] : 
      null;
      
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé, pas de token' });
    }

    const targetUserId = req.params.id;
    
    // Vérifier que l'utilisateur cible existe
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier que l'utilisateur ne s'envoie pas une demande à lui-même
    if (userId === targetUserId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous envoyer une demande d\'ami' });
    }

    // Vérifier si une demande existe déjà
    const existingRequest = targetUser.friendRequests.find(
      request => request.from.toString() === userId
    );
    if (existingRequest) {
      return res.status(400).json({ message: 'Une demande d\'ami a déjà été envoyée' });
    }

    // Vérifier si les utilisateurs sont déjà amis
    if (targetUser.friends.includes(userId)) {
      return res.status(400).json({ message: 'Vous êtes déjà amis avec cet utilisateur' });
    }

    // Ajouter la demande d'ami
    targetUser.friendRequests.push({
      from: userId,
      status: 'pending'
    });
    await targetUser.save();

    res.status(200).json({ message: 'Demande d\'ami envoyée avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la demande d\'ami:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accepter une demande d'ami
// @route   PUT /api/users/friend-request/:requestId/accept
// @access  Private
const acceptFriendRequest = async (req, res) => {
  try {
    // Dans une vraie application, le userId viendrait du token décodé
    const userId = req.headers.authorization ? 
      req.headers.authorization.split('-')[2] : 
      null;
      
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé, pas de token' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const requestId = req.params.requestId;
    
    // Trouver la demande d'ami
    const requestIndex = user.friendRequests.findIndex(
      request => request._id.toString() === requestId
    );
    
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Demande d\'ami non trouvée' });
    }

    const friendRequest = user.friendRequests[requestIndex];
    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Cette demande a déjà été traitée' });
    }

    const friendId = friendRequest.from;

    // Mettre à jour la demande
    user.friendRequests[requestIndex].status = 'accepted';
    
    // Ajouter l'ami à la liste d'amis de l'utilisateur
    if (!user.friends.includes(friendId)) {
      user.friends.push(friendId);
    }
    
    await user.save();

    // Ajouter également l'utilisateur à la liste d'amis de l'ami
    const friend = await User.findById(friendId);
    if (friend && !friend.friends.includes(userId)) {
      friend.friends.push(userId);
      await friend.save();
    }

    res.status(200).json({ message: 'Demande d\'ami acceptée avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'acceptation de la demande d\'ami:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rejeter une demande d'ami
// @route   PUT /api/users/friend-request/:requestId/reject
// @access  Private
const rejectFriendRequest = async (req, res) => {
  try {
    // Dans une vraie application, le userId viendrait du token décodé
    const userId = req.headers.authorization ? 
      req.headers.authorization.split('-')[2] : 
      null;
      
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé, pas de token' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const requestId = req.params.requestId;
    
    // Trouver la demande d'ami
    const requestIndex = user.friendRequests.findIndex(
      request => request._id.toString() === requestId
    );
    
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Demande d\'ami non trouvée' });
    }

    const friendRequest = user.friendRequests[requestIndex];
    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Cette demande a déjà été traitée' });
    }

    // Mettre à jour la demande
    user.friendRequests[requestIndex].status = 'rejected';
    await user.save();

    res.status(200).json({ message: 'Demande d\'ami rejetée' });
  } catch (error) {
    console.error('Erreur lors du rejet de la demande d\'ami:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Supprimer un ami
// @route   DELETE /api/users/friends/:friendId
// @access  Private
const removeFriend = async (req, res) => {
  try {
    // Dans une vraie application, le userId viendrait du token décodé
    const userId = req.headers.authorization ? 
      req.headers.authorization.split('-')[2] : 
      null;
      
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé, pas de token' });
    }

    const friendId = req.params.friendId;

    // Supprimer l'ami de la liste d'amis de l'utilisateur
    await User.findByIdAndUpdate(
      userId,
      { $pull: { friends: friendId } }
    );

    // Supprimer également l'utilisateur de la liste d'amis de l'ami
    await User.findByIdAndUpdate(
      friendId,
      { $pull: { friends: userId } }
    );

    res.status(200).json({ message: 'Ami supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'ami:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir la liste des amis
// @route   GET /api/users/friends
// @access  Private
const getFriends = async (req, res) => {
  try {
    console.log('Requête entrante sur /friends:', { 
      headers: req.headers,
      method: req.method
    });
    
    // Pour le développement, accepter n'importe quel token
    // Dans une vraie application, vous vérifieriez le token correctement
    
    // Pour le développement, créons des données fictives pour tester
    const mockFriends = [
      {
        id: '1',
        username: 'Alice',
        avatar: 'https://placehold.co/40x40/purple/white?text=A',
        status: 'online',
        activity: 'Joue à Minecraft',
        lastSeen: new Date()
      },
      {
        id: '2',
        username: 'Bob',
        avatar: 'https://placehold.co/40x40/blue/white?text=B',
        status: 'idle',
        activity: 'Dernière connexion: récemment',
        lastSeen: new Date(Date.now() - 3600000)
      },
      {
        id: '3',
        username: 'Charlie',
        avatar: 'https://placehold.co/40x40/green/white?text=C',
        status: 'offline',
        activity: '',
        lastSeen: new Date(Date.now() - 86400000)
      }
    ];

    // Ajouter un délai pour simuler un traitement
    setTimeout(() => {
      // Envoyer les données fictives
      res.status(200).json(mockFriends);
    }, 500);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des amis:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir la liste des demandes d'ami en attente
// @route   GET /api/users/friend-requests
// @access  Private
const getFriendRequests = async (req, res) => {
  try {
    // Dans une vraie application, le userId viendrait du token décodé
    const userId = req.headers.authorization ? 
      req.headers.authorization.split('-')[2] : 
      null;
      
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé, pas de token' });
    }

    const user = await User.findById(userId)
      .populate({
        path: 'friendRequests.from',
        select: 'name email'
      });
      
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Filtrer pour ne renvoyer que les demandes en attente
    const pendingRequests = user.friendRequests.filter(
      request => request.status === 'pending'
    );

    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes d\'ami:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  registerUser,
  loginUser,
  getUserProfile,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriends,
  getFriendRequests
};
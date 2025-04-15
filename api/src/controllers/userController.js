const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Fonction utilitaire pour générer un JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Le token expire après 30 jours
  });
};

// @desc    Récupérer tous les utilisateurs
// @route   GET /api/users
// @access  Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message, status: 'error' });
  }
};

// @desc    Récupérer un utilisateur par ID
// @route   GET /api/users/:id
// @access  Privé
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'Utilisateur non trouvé', status: 'error' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message, status: 'error' });
  }
};

// @desc    Créer un nouvel utilisateur (admin)
// @route   POST /api/users
// @access  Admin
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Vérification si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé', status: 'error' });
    }
    
    // Création de l'utilisateur (bcrypt est appliqué automatiquement via le middleware)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
    });
    
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: 'success'
      });
    } else {
      res.status(400).json({ message: 'Données utilisateur invalides', status: 'error' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message, status: 'error' });
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
      return res.status(400).json({ message: 'Veuillez remplir tous les champs', status: 'error' });
    }
    
    // Vérification si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé', status: 'error' });
    }
    
    // Créer l'utilisateur (bcrypt est appliqué automatiquement via le middleware)
    const user = await User.create({
      name,
      email,
      password,
    });
    
    if (user) {
      // Générer un JWT pour l'utilisateur nouvellement créé
      const token = generateToken(user._id);
      
      res.status(201).json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        status: 'success'
      });
    } else {
      res.status(400).json({ message: 'Données utilisateur invalides', status: 'error' });
    }
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription', status: 'error' });
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
      return res.status(400).json({ message: 'Veuillez remplir tous les champs', status: 'error' });
    }
    
    // Rechercher l'utilisateur
    const user = await User.findOne({ email });
    
    // Vérifier si l'utilisateur existe et le mot de passe correspond
    if (user && (await user.matchPassword(password))) {
      // Générer un JWT
      const token = generateToken(user._id);
      
      res.status(200).json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        status: 'success'
      });
    } else {
      res.status(401).json({ message: 'Email ou mot de passe incorrect', status: 'error' });
    }
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion', status: 'error' });
  }
};

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/users/profile
// @access  Privé
const getUserProfile = async (req, res) => {
  try {
    // req.user est fourni par le middleware d'authentification
    res.status(200).json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      friends: req.user.friends,
      friendRequests: req.user.friendRequests,
      status: 'success'
    });
  } catch (error) {
    console.error('Erreur dans getUserProfile:', error);
    res.status(500).json({ message: 'Erreur serveur', status: 'error' });
  }
};

// @desc    Envoyer une demande d'ami
// @route   POST /api/users/:id/friend-request
// @access  Privé
const sendFriendRequest = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    
    // Vérifier que l'utilisateur cible existe
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé', status: 'error' });
    }

    // Vérifier que l'utilisateur ne s'envoie pas une demande à lui-même
    if (req.user._id.toString() === targetUserId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous envoyer une demande d\'ami', status: 'error' });
    }

    // Vérifier si une demande existe déjà
    const existingRequest = targetUser.friendRequests.find(
      request => request.from.toString() === req.user._id.toString()
    );
    if (existingRequest) {
      return res.status(400).json({ message: 'Une demande d\'ami a déjà été envoyée', status: 'error' });
    }

    // Vérifier si les utilisateurs sont déjà amis
    if (targetUser.friends.includes(req.user._id)) {
      return res.status(400).json({ message: 'Vous êtes déjà amis avec cet utilisateur', status: 'error' });
    }

    // Ajouter la demande d'ami
    targetUser.friendRequests.push({
      from: req.user._id,
      status: 'pending'
    });
    await targetUser.save();

    res.status(200).json({ message: 'Demande d\'ami envoyée avec succès', status: 'success' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la demande d\'ami:', error);
    res.status(500).json({ message: error.message, status: 'error' });
  }
};

// @desc    Accepter une demande d'ami
// @route   PUT /api/users/friend-request/:requestId/accept
// @access  Privé
const acceptFriendRequest = async (req, res) => {
  try {
    const user = req.user; // Fourni par le middleware d'authentification
    const requestId = req.params.requestId;
    
    // Trouver la demande d'ami
    const requestIndex = user.friendRequests.findIndex(
      request => request._id.toString() === requestId
    );
    
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Demande d\'ami non trouvée', status: 'error' });
    }

    const friendRequest = user.friendRequests[requestIndex];
    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Cette demande a déjà été traitée', status: 'error' });
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
    if (friend && !friend.friends.includes(user._id)) {
      friend.friends.push(user._id);
      await friend.save();
    }

    res.status(200).json({ message: 'Demande d\'ami acceptée avec succès', status: 'success' });
  } catch (error) {
    console.error('Erreur lors de l\'acceptation de la demande d\'ami:', error);
    res.status(500).json({ message: error.message, status: 'error' });
  }
};

// @desc    Rejeter une demande d'ami
// @route   PUT /api/users/friend-request/:requestId/reject
// @access  Privé
const rejectFriendRequest = async (req, res) => {
  try {
    const user = req.user; // Fourni par le middleware d'authentification
    const requestId = req.params.requestId;
    
    // Trouver la demande d'ami
    const requestIndex = user.friendRequests.findIndex(
      request => request._id.toString() === requestId
    );
    
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Demande d\'ami non trouvée', status: 'error' });
    }

    const friendRequest = user.friendRequests[requestIndex];
    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Cette demande a déjà été traitée', status: 'error' });
    }

    // Mettre à jour la demande
    user.friendRequests[requestIndex].status = 'rejected';
    await user.save();

    res.status(200).json({ message: 'Demande d\'ami rejetée', status: 'success' });
  } catch (error) {
    console.error('Erreur lors du rejet de la demande d\'ami:', error);
    res.status(500).json({ message: error.message, status: 'error' });
  }
};

// @desc    Supprimer un ami
// @route   DELETE /api/users/friends/:friendId
// @access  Privé
const removeFriend = async (req, res) => {
  try {
    const user = req.user; // Fourni par le middleware d'authentification
    const friendId = req.params.friendId;

    // Supprimer l'ami de la liste d'amis de l'utilisateur
    await User.findByIdAndUpdate(
      user._id,
      { $pull: { friends: friendId } }
    );

    // Supprimer également l'utilisateur de la liste d'amis de l'ami
    await User.findByIdAndUpdate(
      friendId,
      { $pull: { friends: user._id } }
    );

    res.status(200).json({ message: 'Ami supprimé avec succès', status: 'success' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'ami:', error);
    res.status(500).json({ message: error.message, status: 'error' });
  }
};

// @desc    Obtenir la liste des amis
// @route   GET /api/users/friends
// @access  Privé
const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'name email role')
      .select('friends');
      
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé', status: 'error' });
    }

    res.status(200).json({
      friends: user.friends,
      status: 'success'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des amis:', error);
    res.status(500).json({ message: error.message, status: 'error' });
  }
};

// @desc    Obtenir la liste des demandes d'ami en attente
// @route   GET /api/users/friend-requests
// @access  Privé
const getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'friendRequests.from',
        select: 'name email'
      });
      
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé', status: 'error' });
    }

    // Filtrer pour ne renvoyer que les demandes en attente
    const pendingRequests = user.friendRequests.filter(
      request => request.status === 'pending'
    );

    res.status(200).json({
      requests: pendingRequests,
      status: 'success'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes d\'ami:', error);
    res.status(500).json({ message: error.message, status: 'error' });
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
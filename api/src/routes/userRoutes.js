const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Routes publiques d'authentification
router.post('/register', registerUser);
router.post('/login', loginUser);

// Routes privées - nécessitent une authentification
router.get('/profile', protect, getUserProfile);

// Routes CRUD pour les utilisateurs - sécurisées par rôle
router.route('/')
  .get(protect, authorize('admin'), getUsers)
  .post(protect, authorize('admin'), createUser);
  
router.route('/:id')
  .get(protect, getUserById);

// Routes pour le système d'amis - toutes privées
router.post('/:id/friend-request', protect, sendFriendRequest);
router.put('/friend-request/:requestId/accept', protect, acceptFriendRequest);
router.put('/friend-request/:requestId/reject', protect, rejectFriendRequest);
router.delete('/friends/:friendId', protect, removeFriend);
router.get('/friends', protect, getFriends);
router.get('/friend-requests', protect, getFriendRequests);

module.exports = router;
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

// Routes d'authentification
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', getUserProfile);

// Routes standard CRUD pour les utilisateurs
router.route('/').get(getUsers).post(createUser);
router.route('/:id').get(getUserById);

// Routes pour le système d'amis
router.post('/:id/friend-request', sendFriendRequest);
router.put('/friend-request/:requestId/accept', acceptFriendRequest);
router.put('/friend-request/:requestId/reject', rejectFriendRequest);
router.delete('/friends/:friendId', removeFriend);
router.get('/friends', getFriends);
router.get('/friend-requests', getFriendRequests);

module.exports = router;
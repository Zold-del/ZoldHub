const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez entrer un nom']
  },
  email: {
    type: String,
    required: [true, 'Veuillez entrer un email'],
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez entrer un email valide']
  },
  password: {
    type: String,
    required: [true, 'Veuillez entrer un mot de passe'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Middleware de pré-sauvegarde pour hacher le mot de passe
userSchema.pre('save', async function(next) {
  // Ne pas hacher à nouveau si le mot de passe n'a pas été modifié
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Générer un sel
    const salt = await bcrypt.genSalt(10);
    
    // Hacher le mot de passe avec le sel
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
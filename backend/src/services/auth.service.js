const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/tokenUtils');

class AuthService {
  async register(userData) {
    const { username, email, password, phone } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('Email already registered');
      }
      if (existingUser.username === username) {
        throw new Error('Username already taken');
      }
    }

    // Create user
    const user = new User({
      username,
      email,
      password,
      phone
    });

    await user.save();

    // Generate tokens
    const tokenPayload = {
      userId: user._id,
      role: user.role,
      email: user.email
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: user.toJSON(),
      token,
      refreshToken
    };
  }

  async login(email, password) {
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid email or password');
    }

    if (user.isBanned) {
      const error = new Error('Account is banned');
      error.statusCode = 403;
      error.data = {
        reason: user.banReason,
        bannedAt: user.bannedAt
      };
      throw error;
    }

    // Generate tokens
    const tokenPayload = {
      userId: user._id,
      role: user.role,
      email: user.email
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: user.toJSON(),
      token,
      refreshToken
    };
  }

  async refreshToken(refreshToken) {
    const { verifyRefreshToken } = require('../utils/tokenUtils');
    
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.userId);

      if (!user || user.isBanned) {
        throw new Error('Invalid refresh token');
      }

      const tokenPayload = {
        userId: user._id,
        role: user.role,
        email: user.email
      };

      const newToken = generateToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.toJSON();
  }

  async updateProfile(userId, updateData) {
    const allowedUpdates = ['username', 'phone'];
    const updates = {};

    for (const key of allowedUpdates) {
      if (updateData[key]) {
        updates[key] = updateData[key];
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user.toJSON();
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new Error('User not found');
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return { message: 'Password updated successfully' };
  }
}

module.exports = new AuthService();

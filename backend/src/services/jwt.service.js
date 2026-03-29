const jwt = require('jsonwebtoken');
const { config } = require('../config/env');

const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: '15m',
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
};

const generateTokens = (payload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.secret, {
    algorithms: ['HS256'],
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret, {
    algorithms: ['HS256'],
  });
};

const generateToken = generateAccessToken;
const verifyToken = verifyAccessToken;

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  generateToken,
  verifyToken,
};

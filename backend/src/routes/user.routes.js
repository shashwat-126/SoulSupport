const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, checkOwnership } = require('../middlewares/auth.middleware');
const { uploadSingle } = require('../middlewares/upload.middleware');

// Self or admin only
router.get('/:id', protect, checkOwnership(), userController.getUser);
router.put('/:id', protect, checkOwnership(), userController.updateUser);
router.delete('/:id', protect, checkOwnership(), userController.deleteUser);
router.put('/:id/avatar', protect, checkOwnership(), uploadSingle('avatar'), userController.updateAvatar);
router.get('/:id/stats', protect, checkOwnership(), userController.getUserStats);

module.exports = router;

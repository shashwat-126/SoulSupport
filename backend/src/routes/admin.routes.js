const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

// All admin routes require authentication and admin role
router.use(protect, restrictTo('admin'));

// Therapist verification
router.get('/therapists/unverified', adminController.getUnverifiedTherapists);
router.put('/therapists/:profileId/verify', adminController.setTherapistVerified);

// User management
router.get('/users', adminController.getUsers);
router.put('/users/:userId/active', adminController.setUserActive);
router.delete('/users/:userId', adminController.deleteUser);

// Analytics
router.get('/analytics', adminController.getAnalytics);

module.exports = router;

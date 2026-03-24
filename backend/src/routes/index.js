const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/forum', require('./forum.routes'));
router.use('/therapists', require('./therapist.routes'));
router.use('/sessions', require('./session.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/resources', require('./resource.routes'));
router.use('/users', require('./user.routes'));
router.use('/profile', require('./profile.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;

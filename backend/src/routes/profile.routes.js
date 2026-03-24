const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { protect } = require('../middlewares/auth.middleware');
const { uploadSingle } = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validate.middleware');
const { updateProfileSchema } = require('../validators/profile.validator');
const { updateSettingsSchema, deleteAccountSchema } = require('../validators/settings.validator');

router.get('/me', protect, profileController.getMyProfile);
router.put('/update', protect, validate(updateProfileSchema), profileController.updateProfile);
router.post('/upload-photo', protect, uploadSingle('photo'), profileController.uploadProfilePhoto);
router.get('/settings', protect, profileController.getMySettings);
router.put('/settings', protect, validate(updateSettingsSchema), profileController.updateMySettings);
router.delete('/account', protect, validate(deleteAccountSchema), profileController.deleteMyAccount);
router.get('/:id', profileController.getPublicProfile);

module.exports = router;

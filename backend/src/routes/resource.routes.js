const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resource.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createResourceSchema,
  updateResourceSchema,
} = require('../validators/resource.validator');

router.get('/', resourceController.getResources);
router.get('/:id', resourceController.getResource);

// Treat therapist as admin-equivalent for now
router.post(
  '/',
  protect,
  restrictTo('therapist', 'admin'),
  validate(createResourceSchema),
  resourceController.createResource
);

router.put(
  '/:id',
  protect,
  restrictTo('therapist', 'admin'),
  validate(updateResourceSchema),
  resourceController.updateResource
);

router.delete(
  '/:id',
  protect,
  restrictTo('therapist', 'admin'),
  resourceController.deleteResource
);

module.exports = router;

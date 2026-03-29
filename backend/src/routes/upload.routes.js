const { Router } = require('express');
const uploadCtrl = require('../controllers/upload.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/role.middleware');
const { uploadSingle, uploadMultiple } = require('../middlewares/upload.middleware');

const router = Router();

router.post('/image', authenticate, requireAdmin, uploadSingle, uploadCtrl.uploadImage);
router.post('/images', authenticate, requireAdmin, uploadMultiple, uploadCtrl.uploadImages);

module.exports = router;

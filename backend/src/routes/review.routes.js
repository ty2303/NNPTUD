const { Router } = require('express');
const reviewCtrl = require('../controllers/review.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { uploadSingle } = require('../middlewares/upload.middleware');

const router = Router();

router.get('/', reviewCtrl.getReviews);
router.post('/', authenticate, reviewCtrl.createReview);
router.put('/:id', authenticate, reviewCtrl.updateReview);
router.delete('/:id', authenticate, reviewCtrl.deleteReview);
router.post('/upload-image', authenticate, uploadSingle, reviewCtrl.uploadReviewImage);

module.exports = router;

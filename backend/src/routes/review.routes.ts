import { Router } from 'express';
import * as reviewCtrl from '../controllers/review.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';

const router = Router();

router.get('/',                  reviewCtrl.getReviews);
router.post('/',                 authenticate, reviewCtrl.createReview);
router.put('/:id',               authenticate, reviewCtrl.updateReview);
router.delete('/:id',            authenticate, reviewCtrl.deleteReview);
router.post('/upload-image',     authenticate, uploadSingle, reviewCtrl.uploadReviewImage);

export default router;

import { Router } from 'express';
import * as uploadCtrl from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { uploadSingle, uploadMultiple } from '../middlewares/upload.middleware';

const router = Router();

router.post('/image',  authenticate, requireAdmin, uploadSingle,   uploadCtrl.uploadImage);
router.post('/images', authenticate, requireAdmin, uploadMultiple, uploadCtrl.uploadImages);

export default router;

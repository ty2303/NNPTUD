import { Router } from 'express';
import * as addressCtrl from '../controllers/address.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/',    addressCtrl.getAddresses);
router.post('/',   addressCtrl.createAddress);
router.put('/:id', addressCtrl.updateAddress);
router.delete('/:id', addressCtrl.deleteAddress);

export default router;

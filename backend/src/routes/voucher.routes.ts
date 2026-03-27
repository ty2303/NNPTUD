import { Router } from 'express';
import * as voucherCtrl from '../controllers/voucher.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

router.get('/',              authenticate, requireAdmin, voucherCtrl.getAllVouchers);
router.post('/validate',     authenticate, voucherCtrl.validateVoucher);
router.post('/',             authenticate, requireAdmin, voucherCtrl.createVoucher);
router.put('/:id',           authenticate, requireAdmin, voucherCtrl.updateVoucher);
router.delete('/:id',        authenticate, requireAdmin, voucherCtrl.deleteVoucher);

export default router;

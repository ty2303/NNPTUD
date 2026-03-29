const { Router } = require('express');
const voucherCtrl = require('../controllers/voucher.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/role.middleware');

const router = Router();

router.get('/', authenticate, requireAdmin, voucherCtrl.getAllVouchers);
router.post('/validate', authenticate, voucherCtrl.validateVoucher);
router.post('/', authenticate, requireAdmin, voucherCtrl.createVoucher);
router.put('/:id', authenticate, requireAdmin, voucherCtrl.updateVoucher);
router.delete('/:id', authenticate, requireAdmin, voucherCtrl.deleteVoucher);

module.exports = router;

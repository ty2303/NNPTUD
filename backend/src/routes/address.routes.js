const { Router } = require('express');
const addressCtrl = require('../controllers/address.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);
router.get('/', addressCtrl.getAddresses);
router.post('/', addressCtrl.createAddress);
router.put('/:id', addressCtrl.updateAddress);
router.delete('/:id', addressCtrl.deleteAddress);

module.exports = router;

const { Router } = require('express');
const notifCtrl = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);
router.get('/', notifCtrl.getNotifications);
router.patch('/read-all', notifCtrl.markAllAsRead);
router.patch('/:id/read', notifCtrl.markAsRead);
router.delete('/:id', notifCtrl.deleteNotification);

module.exports = router;

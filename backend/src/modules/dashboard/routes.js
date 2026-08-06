const router = require('express').Router();
const dashboardController = require('./controllers');
const { requireAuth } = require('../../middleware/auth');

router.get('/insights', requireAuth, dashboardController.insights);
router.get('/activity', requireAuth, dashboardController.activity);

module.exports = router;

const router = require('express').Router();
const dashboardController = require('./controllers');

router.get('/insights', dashboardController.insights);
router.get('/activity', dashboardController.activity);

module.exports = router;

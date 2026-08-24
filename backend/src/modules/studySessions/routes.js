const router = require('express').Router();
const sessionsController = require('./controllers');
const { requireAuth } = require('../../middleware/auth');
const { requireDbUser } = require('../../middleware/access');
const { validateBody } = require('../../middleware/validate');
const { startSessionSchema } = require('./validation');

router.post('/', requireAuth, requireDbUser, validateBody(startSessionSchema), sessionsController.start);
router.get('/active', requireAuth, requireDbUser, sessionsController.getActive);
router.get('/', requireAuth, requireDbUser, sessionsController.list);
router.patch('/:sessionId/end', requireAuth, requireDbUser, sessionsController.end);

module.exports = router;

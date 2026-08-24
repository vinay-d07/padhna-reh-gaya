const router = require('express').Router();
const roomsController = require('./controllers');
const { requireAuth } = require('../../middleware/auth');
const { requireDbUser } = require('../../middleware/access');
const { validateBody } = require('../../middleware/validate');
const { createRoomSchema, joinRoomSchema, sendMessageSchema } = require('./validation');

router.get('/', requireAuth, requireDbUser, roomsController.list);
router.post('/', requireAuth, requireDbUser, validateBody(createRoomSchema), roomsController.create);
// Must be mounted before /:roomId, or "lookup" would be parsed as a roomId.
router.get('/lookup', requireAuth, requireDbUser, roomsController.lookupByCode);
router.get('/:roomId', requireAuth, requireDbUser, roomsController.getOne);
router.delete('/:roomId', requireAuth, requireDbUser, roomsController.remove);
router.post(
  '/:roomId/join',
  requireAuth,
  requireDbUser,
  validateBody(joinRoomSchema),
  roomsController.join
);
router.post('/:roomId/leave', requireAuth, requireDbUser, roomsController.leave);
router.get('/:roomId/messages', requireAuth, requireDbUser, roomsController.listMessages);
router.post(
  '/:roomId/messages',
  requireAuth,
  requireDbUser,
  validateBody(sendMessageSchema),
  roomsController.sendMessage
);

module.exports = router;

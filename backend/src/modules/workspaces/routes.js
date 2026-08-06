const router = require('express').Router();
const workspaceController = require('./controllers');
const { requireAuth } = require('../../middleware/auth');
const { requireWorkspaceRole } = require('../../middleware/access');

router.post('/', requireAuth, workspaceController.create);
router.get('/', requireAuth, workspaceController.list);
router.get(
  '/:id',
  requireAuth,
  requireWorkspaceRole('VIEWER', { paramName: 'id' }),
  workspaceController.getOne
);
router.patch(
  '/:id',
  requireAuth,
  requireWorkspaceRole('EDITOR', { paramName: 'id' }),
  workspaceController.update
);
router.delete(
  '/:id',
  requireAuth,
  requireWorkspaceRole('OWNER', { paramName: 'id' }),
  workspaceController.remove
);

module.exports = router;

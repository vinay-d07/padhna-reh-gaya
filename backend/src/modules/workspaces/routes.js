const router = require('express').Router();
const workspaceController = require('./controllers');
const { requireAuth } = require('../../middleware/auth');
const { requireWorkspaceRole } = require('../../middleware/access');
const { validateBody } = require('../../middleware/validate');
const { createWorkspaceSchema, updateWorkspaceSchema } = require('./validation');

router.post('/', requireAuth, validateBody(createWorkspaceSchema), workspaceController.create);
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
  validateBody(updateWorkspaceSchema),
  workspaceController.update
);
router.delete(
  '/:id',
  requireAuth,
  requireWorkspaceRole('OWNER', { paramName: 'id' }),
  workspaceController.remove
);

module.exports = router;

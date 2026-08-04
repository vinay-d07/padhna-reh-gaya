const router = require('express').Router();
const workspaceController = require('./controllers');

router.post('/', workspaceController.create);
router.get('/', workspaceController.list);
router.get('/:id', workspaceController.getOne);
router.patch('/:id', workspaceController.update);
router.delete('/:id', workspaceController.remove);

module.exports = router;

const router = require('express').Router({ mergeParams: true });
const uploadsController = require('./controllers');

router.get('/', uploadsController.list);
router.post('/', uploadsController.handleUpload, uploadsController.create);
router.delete('/:documentId', uploadsController.remove);

module.exports = router;

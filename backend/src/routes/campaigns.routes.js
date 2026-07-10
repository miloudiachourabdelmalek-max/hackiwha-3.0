const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { requireOrgRole } = require('../middleware/rbac');
const ctrl = require('../controllers/campaigns.controller');

router.use(requireAuth, requireOrgRole());
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);

module.exports = router;

const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { requireOrgRole } = require('../middleware/rbac');
const ctrl = require('../controllers/experiences.controller');

router.use(requireAuth, requireOrgRole());
router.get('/similar', ctrl.similar); // before /:id so it isn't swallowed as an id param
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', requireOrgRole('OWNER', 'ADMIN', 'MARKETING_MANAGER'), ctrl.create);
router.patch('/:id', requireOrgRole('OWNER', 'ADMIN', 'MARKETING_MANAGER'), ctrl.update);

module.exports = router;

const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/organizations.controller');

router.use(requireAuth);
router.get('/', ctrl.listMine);

module.exports = router;

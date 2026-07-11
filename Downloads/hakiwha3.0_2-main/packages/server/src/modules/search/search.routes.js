const { Router } = require("express");
const searchController = require("./search.controller");
const { authenticate } = require("../../middleware/auth");

const router = Router();

router.use(authenticate);

router.get("/", searchController.search);
router.get("/suggest", searchController.suggest);

module.exports = router;

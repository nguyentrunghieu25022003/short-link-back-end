const express = require("express");
const router = express.Router();

const controller = require("../controllers/social-snapshot.controller");
const authenticate = require("../../../middlewares/authenticate");

router.get("/social-snapshot/all", authenticate, controller.getAllResult);
router.post("/social-snapshot/name", controller.handleCrawlDataByUsername);
router.post("/social-snapshot/id", controller.handleCrawlDataByUserId);

module.exports = router;
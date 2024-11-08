const express = require("express");
const router = express.Router();

const controller = require("../controllers/url.controller");
const authenticate = require("../../../middlewares/authenticate");

router.get("/all-url", controller.getAllShortenedLink);
router.post("/shorten/:userId", controller.createShortenedLink);
router.get("/ip", controller.handleGetIPAddress);
router.get("/track-location/:shortId", controller.handleSaveIPAddressAndLocation);
router.get("/:userId/histories", authenticate, controller.getUserHistories);
router.get("/:shortId", controller.handleRedirectShortenedLink);

module.exports = router;
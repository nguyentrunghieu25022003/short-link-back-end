const express = require("express");
const router = express.Router();

const controller = require("../controllers/user.controller");

router.post("/sign-up", controller.handleSignUp);
router.post("/sign-in", controller.handleSignIn);
router.get("/check-token", controller.handleCheckToken);
router.post("/:userId/log-out", controller.handleLogOut);

module.exports = router;
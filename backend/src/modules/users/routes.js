const router = require("express").Router();
const userController = require("./controllers");
const { requireAuth } = require("../../middleware/auth");

router.post("/signup", requireAuth, userController.signup);
router.get("/:clerkId", requireAuth, userController.getProfile);
router.delete("/:clerkId", requireAuth, userController.deleteProfile);

module.exports = router;
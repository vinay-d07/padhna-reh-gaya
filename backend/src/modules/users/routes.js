const router = require("express").Router();
const userController = require("./controllers");
const { requireAuth } = require("../../middleware/auth");
const { validateBody } = require("../../middleware/validate");
const { signupSchema } = require("./validation");

router.post("/signup", requireAuth, validateBody(signupSchema), userController.signup);
router.get("/:clerkId", requireAuth, userController.getProfile);
router.delete("/:clerkId", requireAuth, userController.deleteProfile);

module.exports = router;
const router = require("express").Router();
const userController = require("./controllers");

router.post("/signup", userController.signup);
router.get("/:clerkId", userController.getProfile);
router.delete("/:clerkId", userController.deleteProfile);

module.exports = router;
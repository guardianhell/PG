const router = require("express").Router();
const merchantController = require("../controllers/merchantController");
const verify = require("../verify");

router.post("/register", merchantController.registerNewMerchant);
router.get("/all", merchantController.searchAllMerchant);

module.exports = router;

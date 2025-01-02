const router = require("express").Router();
const transactionController = require("../controllers/transactionController");
const paymentRequestController = require("../controllers/paymentRequestController");
const verify = require("../verify");

router.post("/create", verify, transactionController.createNewTransaction);
router.get("/", async function (req, res) {
  return res.send("HAI");
});



module.exports = router;

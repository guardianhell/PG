const router = require("express").Router();
const transactionController = require("../controllers/transactionController");
const paymentRequestController = require("../controllers/paymentRequestController")

router.post("/create", transactionController.createNewTransaction);
router.get("/", async function (req, res) {
  return res.send("HAI");
});



module.exports = router;

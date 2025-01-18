const router = require("express").Router();
const transactionController = require("../controllers/transactionController");
const paymentRequestController = require("../controllers/paymentRequestController");
const verify = require("../verify");

router.post("/create", verify, transactionController.createNewTransaction);
router.get("/transactionList", verify, transactionController.getTransactionByUserId)



module.exports = router;
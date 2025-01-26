const router = require("express").Router();
const paymentRequestController = require("../controllers/paymentRequestController");
const verify = require("../verify");

router.post("/request", paymentRequestController.requestNewPayment);
router.post("/rePaymentRequest", verify, paymentRequestController.repaymentRequest)
router.post("/checkPayment", paymentRequestController.checkPaymentStatus)

module.exports = router;

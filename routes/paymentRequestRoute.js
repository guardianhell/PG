const router = require("express").Router();
const paymentRequestController = require("../controllers/paymentRequestController");

router.post("/request", paymentRequestController.requestNewPayment);
router.post("/rePaymentRequest", verify, paymentRequestController.repaymentRequest)

module.exports = router;

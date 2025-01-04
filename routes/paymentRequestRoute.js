const router = require("express").Router();
const paymentRequestController = require("../controllers/paymentRequestController");

router.post("/request", paymentRequestController.requestNewPayment);
router.post("/rePaymentRequest", paymentRequestController.repaymentRequest)

module.exports = router;

const router = require("express").Router();
const paymentRequestController = require("../controllers/paymentRequestController");

router.post("/request", paymentRequestController.requestNewPayment);

module.exports = router;

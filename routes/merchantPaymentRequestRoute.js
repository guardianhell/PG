const router = require("express").Router();
const merchantPaymentRequestController = require("../controllers/merchantPaymentRequestController");



router.post("/rqst", merchantPaymentRequestController.merchantPaymentRequest)

router.post("/validate", merchantPaymentRequestController.validateSignatureResponse)

module.exports = router
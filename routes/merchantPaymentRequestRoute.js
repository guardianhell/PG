const router = require("express").Router();
const merchantPaymentRequestController = require("../controllers/merchantPaymentRequestController");



router.post("/rqst", merchantPaymentRequestController.merchantPaymentRequest)

module.exports = router
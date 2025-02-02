const router = require("express").Router();
const merchantPaymentRequestController = require("../controllers/merchantPaymentRequestController");



router.post("/qris", merchantPaymentRequestController.merchantPaymentRequest)

module.exports = router
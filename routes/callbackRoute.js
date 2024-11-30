const router = require("express").Router();

const paymentRequestController = require("../controllers/paymentRequestController")


router.post("/callback", paymentRequestController.callbackURLPaymentConfirm)

module.exports = router
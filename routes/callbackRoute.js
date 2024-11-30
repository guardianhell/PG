const router = require("express").Router();

const paymentRequestController = require("../controllers/paymentRequestController")





router.post("/callback/:paymentNumber", paymentRequestController.callbackURLPaymentConfirm)

module.exports = router
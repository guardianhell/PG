const router = require("express").Router();
const paymentTypeController = require("../controllers/paymentTypeController");

router.post("/create", paymentTypeController.createNewPaymentType);

module.exports = router;

const router = require("express").Router();
const invoiceController = require("../controllers/invoiceController");
const verify = require("../verify");

router.post("/create", invoiceController.createNewInvoice);

module.exports = router;

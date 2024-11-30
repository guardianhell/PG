require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const { func } = require("joi");
const cors = require('cors')
let urlAPI = "/api-v1";

//add Route
const productCategoryRoute = require("./routes/productCategoryRoute");
const productRoute = require("./routes/productRoute");
const unitRoute = require("./routes/unitRoute");
const statusRoute = require("./routes/statusRoute");
const currencyRoute = require("./routes/currencyRoute");
const productVariatyRoute = require("./routes/productVariatyRoute");
const merchantRoute = require("./routes/merchantRoute");
const transactionRoute = require("./routes/transactionRoute");
const invoiceRoute = require("./routes/invoiceRoute");
const paymentTypeRoute = require("./routes/paymentTypeRoute");
const paymentRequestRoute = require("./routes/paymentRequestRoute");
const callbackRoute = require("./routes/callbackRoute")

const port = process.env.PORT || 5000;

const app = express();

app.use(express.static("public"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cors())

app.use(urlAPI + "/unit", unitRoute);
app.use(urlAPI + "/product-category", productCategoryRoute);
app.use(urlAPI + "/product-variaty", productVariatyRoute);
app.use(urlAPI + "/product", productRoute);
app.use(urlAPI + "/status", statusRoute);
app.use(urlAPI + "/currency", currencyRoute);
app.use(urlAPI + "/merchant", merchantRoute);
app.use(urlAPI + "/transaction", transactionRoute);
app.use(urlAPI + "/invoice", invoiceRoute);
app.use(urlAPI + "/payment-type", paymentTypeRoute);
app.use(urlAPI + "/payment", paymentRequestRoute);
app.use(urlAPI + "/e2p/trx", callbackRoute)

app.listen(port, function () {
  console.log("Server started on port " + port);
});

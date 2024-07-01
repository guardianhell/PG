const moment = require("moment");
const qs = require("querystring");
const db = require("../util/dbconnections");
const verify = require("../verify");
const { text } = require("body-parser");
const validation = require("../validations");
const { Router } = require("express");
const { minify } = require("uglify-js");
const paymentTypeController = require("../controllers/paymentTypeController");
const statusController = require("../controllers/statusController");
const invoiceController = require("../controllers/invoiceController");
const general = require("../general");
const axios = require("axios");
const crypto = require("crypto");
var jsonminify = require("jsonminify");
const { base64encode, base64decode } = require("nodejs-base64");
const { time, log } = require("console");

exports.requestNewPayment = async function (req, res) {
  try {
    const response = await generateQRISE2Pay(req.body);
    res.send(response);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

async function oAuthBCA() {
  let encoded = await base64encode(
    "18ad7213-c501-4935-9517-dbb4535053a9:6caab03e-a2cf-4367-87f0-340e46380cc2"
  );

  const params = new URLSearchParams({ "grant-type": "client_credentials" });

  console.log(encoded);
  console.log(moment().toISOString());
  return;

  const data = {
    "client-id": "TXZPIDAu6Amut9g8bWdvG4Mgmic790sv",
    "client-secret": "GITLVGwfLoHn2RUu",
  };

  const response = await axios.post(
    "https://sandbox.bca.co.id/api/oauth/token",
    qs.stringify({ grant_type: "client_credentials" }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + encoded,
      },
    }
  );

  return response;
}

async function oauthBRI() {
  const params = new URLSearchParams({ "grant-type": "client_credentials" });

  const data = {
    client_id: "TXZPIDAu6Amut9g8bWdvG4Mgmic790sv",
    client_secret: "GITLVGwfLoHn2RUu",
  };

  const url =
    "https://sandbox.partner.api.bri.co.id/oauth/client_credential/accesstoken";

  const response = await axios.post(url, qs.stringify(data), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    params: { grant_type: "client_credentials" },
  });

  return response.data;
}

async function b2bBRI() {
  const timestamp = moment().toISOString();
  const client_id = "TXZPIDAu6Amut9g8bWdvG4Mgmic790sv";
  const signature = await crypto
    .createHmac("sha256", process.env.PRIVATEKEY)
    .update(client_id + "|" + timestamp)
    .digest("hex");

  const url =
    "https://sandbox.partner.api.bri.co.id/snap/v1.0/access-token/b2b";

  const response = await axios.post(
    url,
    {},
    {
      headers: {
        "X-SIGNATURE": signature,
        "X-CLIENT-KEY": client_id,
        "X-TIMESTAMP": timestamp,
        "Content-Type": "application/json",
      },
      params: { grant_type: "client_credentials" },
    }
  );
  console.log(response);
  return response;
}

async function generateQRISE2Pay(dataBody) {
  const url = "https://pg-uat.e2pay.co.id/RMS/API/Direct/1.4.0/index.php";
  const signature = crypto
    .createHash("md5")
    .update(
      dataBody.TxnAmount +
        ".EP001658_S005.TRX-TEST.cd61b35d5c497c01758be7c91e2d0b94"
    )
    .digest("hex");

  console.log(signature);
  const data = {
    MerchantID: "EP001658_S005",
    ReferenceNo: dataBody.ReferenceNo,
    TxnCurrency: "IDR",
    TxnAmount: dataBody.TxnAmount,
    TxnType: "SALS",
    TxnChannel: "E2PAY_LINKAJA_QRIS",
    Signature: signature,
  };

  // const response = await axios.post(url, qs.stringify(data), {});

  const response = await axios({
    method: "post",
    url: url,
    body: JSON.stringify(data),
  });

  console.log(response);
}

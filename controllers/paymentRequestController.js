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
  const url = "https://pg-uat.e2pay.co.id/RMS/API/nms2us/direct_api_bridge.php";
  const merchantKey = process.env.MERCHANTKEY;
  const merchantCode = process.env.MERCHANTCODE;
  const signature = crypto
    .createHash("sha1")
    .update(
      merchantKey +
        merchantCode +
        dataBody.ReferenceNo +
        dataBody.TxnAmount +
        "IDR"
    )
    .digest("base64");

  console.log(signature);
  console.log(process.env.MERCHANTKEY);
  const data = {
    MerchantCode: process.env.MERCHANTCODE,
    PaymentId: 21,
    ReferenceNo: dataBody.ReferenceNo,
    Currency: "IDR",
    TxnAmount: dataBody.TxnAmount,
    ProdDesc: "Vou Game",
    UserName: "persontest",
    UserEmail: "person@cyberber.id",
    UserContact: "82131",
    Signature: signature,
    CallBackURL: "https://ascasystem.com/hiturl",
  };

  // const response = await axios.post(url, qs.stringify(data), {});

  const response = await axios({
    method: "post",
    url: url,
    body: JSON.stringify(data),
  });

  console.log(response.data);
}

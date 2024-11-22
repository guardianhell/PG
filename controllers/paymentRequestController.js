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


async function createNewPaymentRequest(data) {

  const valid = await validation.requestNewPaymentValidation(data)

  if (valid.error) {
    const error = {
      status: 417,
      message: valid.error
    }
    return error
  }

  let created_at = moment().valueOf();
  let updated_at = moment().valueOf();

  const client = await db.pool.connect()

  await client.query("BEGIN")

  const paymentNumber = await generatePaymentNumber(created_at)

  const response = await client.query({
    text: "INSERT INTO payment_request(invoice_id,payment_request_number, status,amount, payment_method_id,payment_number,payment_link,expire_date,payment_vendor,created_at,update_at,) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *",
    values: [
      data.invoice_id,
      paymentNumber,
      1,
      data.amount,
      1,
      data.payment_number,
      data.payment_link,
      data.expire_date,
      data.payment_vendor,
      created_at,
      updated_at
    ]
  }).then(async (result) => {
    var data = {}

    if (!result.error) {
      await client.query('COMMIT')
      data = {
        status: 200,
        message: "success",
        result: result.rows
      }
    }
    else {
      await client.query('ROLLBACK')
      data = {
        status: 417,
        message: result.error
      }
    }

    await client.release()
    return data

  })

  return response

}


exports.getPaymentByPaymentNumber = async function (req, res) {
  try {
    const response = await getPaymentByPaymentNumber(req.params.payment_number)

    return res.status(200).send(response)
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message)
  }
}

exports.callbackURLPaymentConfirm = async function (req, res) {
  try {

    const response = await getPaymentByPaymentNumber(req.params.paymentNumber)





  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message)

  }



}




async function generatePaymentNumber(date) {
  const paymentRows = await getAllTransaction();

  console.log("PAYMENT ROWS");

  console.log(paymentRows);


  const paymentUniqueNumber = await general.numberGenerator(
    5,
    paymentRows.length + 1
  );

  const paymentNumber =
    "PROD-" + date + "-" + paymentUniqueNumber;

  return paymentNumber
}

async function getAllTransaction() {

  const result = await db.pool.query({
    text: "SELECT * FROM payment_request"
  })

  console.log(result);


  return result.rows;

}

async function getPaymentByPaymentNumber(paymentNumber) {

  const result = await db.pool.query({
    text: "SELECT * FROM payment_request WHERE payment_number = $1",
    values: [paymentNumber]
  })
  return result.rows
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
    "MerchantCode": merchantCode,
    "PaymentId": 21,
    "RefNo": dataBody.ReferenceNo,
    "Amount": dataBody.TxnAmount,
    "Currency": "IDR",
    "ProdDesc": "Vou Game",
    "UserName": "persontest",
    "UserEmail": "person@cyberber.id",
    "UserContact": "8213112321",
    "Remark": "TEST",
    "Lang": "UTF-8",
    "Signature": signature,
    "CallBackURL": "https://ascasystem.com/hiturl",
  };




  const response = await axios.post(url, data, {
    headers: {
      'Content-Type': 'application/json'
    }
  })


  return response.data
}


module.exports.createNewPaymentRequest = createNewPaymentRequest

module.exports.generateQRISE2Pay = generateQRISE2Pay



const moment = require("moment");
const qs = require("querystring");
const db = require("../util/dbconnections");
const verify = require("../verify");
const { text } = require("body-parser");
const validation = require("../validations");
const { Router } = require("express");
const { minify } = require("uglify-js");
const paymentTypeController = require("../controllers/paymentTypeController");
const productController = require("../controllers/productController")
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


exports.repaymentRequest = async function (req, res) {
  try {

    const paymentRequestHistoryData = await getPaymentDataByTrxId(req.trx_id).then((res) => {
      return res
    }).catch((error) => {
      console.log(error);
      res.status(400).send(error.message)
    })


    console.log(paymentRequestHistoryData);


  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message)

  }
}

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

  console.log(paymentNumber);


  const response = await client.query({
    text: "INSERT INTO payment_request(invoice_id,payment_request_number, status,amount, payment_method_id,payment_number,payment_link,expire_date,payment_vendor_identifier,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *",
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
      updated_at,
    ],
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

    const paymentData = await getPaymentByPaymentNumber(req.body.TransId)

    console.log(paymentData);


    if (paymentData.length == 0) {
      return res.status(417).send("Transaction Not Found")
    }

    //Checking Signature

    const validSignature = await validateSignature(req.body)

    if (!validSignature) {
      return res.status(400).send("Invalid Response")
    }

    if (req.body.Status == 1) {

      const settlementResponse = await paymentSettlement(paymentData[0].id, req.body.AuthCode)

      const statusId = await statusController.getStatusByName("paid")

      const updatePaymentResponse = await updatePaymentStatus(paymentData[0].id, statusId)

      const updateInvoiceResponse = await invoiceController.updateInvoiceStatusById(paymentData[0].invoice_id, statusId)


    }

    return res.status(200).send("OK")

  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message)

  }
}




async function generatePaymentNumber(date) {
  const paymentRows = await countTransactionRows();



  const paymentUniqueNumber = await general.numberGenerator(
    5,
    paymentRows[0].count + 1
  );

  const paymentNumber =
    "PYRQ-" + date + "-" + paymentUniqueNumber;
  return paymentNumber
}

async function getAllTransaction() {

  const result = await db.pool.query({
    text: "SELECT * FROM payment_request"
  })

  return result.rows;

}

async function countTransactionRows() {
  const result = await db.pool.query({
    text: "SELECT COUNT(*) FROM payment_request"
  })

  return result.rows;

}

async function getPaymentByPaymentNumber(paymentNumber) {

  const result = await db.pool.query({
    text: "SELECT * FROM payment_request WHERE payment_number = $1",
    values: [paymentNumber]
  })
  return result.rows
}

async function getPaymentByInvoiceId(invoiceId) {
  const result = await db.pool.query({
    text: "SELECT * FROM payment_request WHERE invoice_id = $1",
    values: [invoiceId]
  })
  return result.rows
}

async function updatePaymentStatus(id, statusId) {

  const updated_at = moment().valueOf()
  const result = await db.pool.query({
    text: "UPDATE payment_request SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *",
    values: [statusId, updated_at, id]
  })
  return result
}

async function getPaymentByPaymentVendorIdentifier(paymentVendorIdentifier) {
  const result = await db.pool.query({
    text: "SELECT * FROM payment_request WHERE payment_vendor_identifier = $1",
    values: [paymentVendorIdentifier]
  })
  return result.rows
}

async function getPaymentById(id) {
  const result = await db.pool.query({
    text: "SELECT * FROM payment_request WHERE id = $1",
    values: [id]
  })
  return result.rows
}

async function getPaymentByPaymentNumber(paymentNumber) {
  const result = await db.pool.query({
    text: "SELECT * FROM payment_request WHERE payment_number = $1",
    values: [paymentNumber]
  })
  return result.rows
}

async function getPaymentDataByTrxId(trxId) {
  const result = await db.pool.query({
    text: "SELECT payment_request.id, invoice_id, payment_request_number, status, amount, payment_method_id, payment_number, payment_link, expire_date, payment_request.created_at, payment_request.payment_vendor_identifier FROM payment_request INNER JOIN invoices ON payment_request.invoice_id = invoices.id INNER JOIN transaction ON invoices.trx_id = transaction.id WHERE transaction.id = $1",
    values: [trxId]
  })
  return result.rows
}

async function validateSignature(data) {


  const merchantKey = process.env.MERCHANTKEY
  const merchantCode = process.env.MERCHANTCODE
  const paymentID = data.PaymentId
  const refNo = data.RefNo
  const amount = data.Amount
  const currency = "IDR"
  const status = data.TransId
  const responseSignature = data.Signature

  console.log("MK : " + merchantKey);
  console.log("MC : " + merchantCode);
  console.log("PID : " + paymentID);
  console.log("RN : " + refNo);
  console.log("Amount : " + amount);
  console.log("curr : " + currency)
  console.log("Status : " + status);
  console.log("RES SIGN DAT : " + responseSignature);








  const validSignature = await crypto.createHash("sha1").update(merchantKey + merchantCode + paymentID + refNo + amount + currency + status).digest("base64")

  console.log("VALID SIGN : " + validSignature);
  console.log("RES SIGN : " + responseSignature);



  if (validSignature === responseSignature) {
    return true
  }
  else {
    return false
  }


}

async function settlementToVendorUPL(paymentId) {

  const url = "https://api-reseller.uniplay.id/v1/confirm-payment"

  const accessToken = await generateUniplayToken()

  const date = await productController.generateTimestamp()

  const data = {
    api_key: process.env.UNIPLAYKEY,
    timestamp: date,
    inquiry_id: paymentId,
    pincode: process.env.UPYPIN
  }

  const signature = await productController.generateUPLSignature2(data)

  const response = await axios.post(url, data, {
    headers: {
      "UPL-SIGNATURE": signature,
      "UPL-ACCESS-TOKEN": accessToken.data.access_token
    }
  })

  return response.data



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

  const user = await db.pool.query({ text: "SELECT * FROM users WHERE id = $1", values: [dataBody.user_id] })

  const userData = user.rows[0]

  const userName = userData.first_name + " " + userData.last_name

  const userEmail = userData.email


  const data = {
    "MerchantCode": merchantCode,
    "PaymentId": 21,
    "RefNo": dataBody.ReferenceNo,
    "Amount": dataBody.TxnAmount,
    "Currency": "IDR",
    "ProdDesc": dataBody.ProdDesc,
    "UserName": userName,
    "UserEmail": userEmail,
    "UserContact": "08100000000",
    "Remark": "PandoorBox - " + dataBody.ProdDesc,
    "Lang": "UTF-8",
    "Signature": signature,
    "CallBackURL": "http://pandoorbox.com:" + process.env.PORT + "/api-v1/e2p/trx/callback/" + dataBody.ReferenceNo,
  };




  const response = await axios.post(url, data, {
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((res) => {
    return res.data
  }).catch((error) => {
    console.log("ERRROS");

    //console.error(error)
    const errorData = {
      Code: "500",
      message: error.message
    }
    return errorData
  })

  return response
}

async function paymentSettlement(paymentId, refValidationNumber) {

  const data = {}
  const paymentData = getPaymentById(paymentId)

  if (paymentData.length == 0) {
    return data = {
      status: 417,
      message: "Data Payment Not Found"
    }
  }

  const invoiceData = invoiceController.getInvoiceById(paymentData[0].invoice_id)

  if (invoiceData.length == 0) {
    return data = {
      status: 417,
      message: "Invoice not found"
    }
  }

  const created_at = moment().valueOf()
  const updated_at = moment().valueOf()

  const statusId = statusController.getStatusByName("Valid")

  const client = await db.pool.connect()

  await client.query("BEGIN")

  await client.query({
    text: "INSERT INTO settlement(transaction_id,payment_id,ref_validation_number,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6 ) RETURNING *",
    values: [
      invoiceData[0].trx_id,
      paymentData[0].id,
      refValidationNumber,
      statusId[0].id,
      created_at,
      updated_at
    ]
  }).then(async (result) => {
    if (!result.error) {
      await client.query("COMMIT")
      data = {
        status: 200,
        message: "success",
        result: result.rows
      }
    }
    else {
      await client.query("ROLLBACK")
      data = {
        status: 417,
        message: "error",
        result: result.rows
      }
    }
    await client.release()

    //SettlementToVendor
    const responseSettlementVendor = await productController.confirmPayment(paymentData[0].payment_link)

    return data
  })

}


module.exports.createNewPaymentRequest = createNewPaymentRequest
module.exports.validateSignature = validateSignature
module.exports.generateQRISE2Pay = generateQRISE2Pay



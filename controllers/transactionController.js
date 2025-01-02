const moment = require("moment");
const db = require("../util/dbconnections");
const verify = require("../verify");
const { text } = require("body-parser");
const validation = require("../validations");
const { Router } = require("express");
const productController = require("../controllers/productController");
const productVariatyController = require("../controllers/productVariatyController");
const statusController = require("../controllers/statusController");
const invoiceController = require("../controllers/invoiceController")
const paymentRequestController = require("../controllers/paymentRequestController")
const general = require("../general");

exports.createNewTransaction = async function (req, res) {
  try {
    const valid = await validation.createNewTransactionValidation(req.body);

    if (valid.error) {
      return res.status(417).send(valid.error);
    }

    statusId = await statusController.getStatusByName("Waiting for Payment");

    if (statusId.length == 0) {
      return res.status(417).send("Invalid Status");
    }

    let created_at = moment().valueOf();
    let updated_at = moment().valueOf();

    const trxRows = await countTranscationRows();
    let trx_number =
      "TX-" + moment().valueOf() + "-" + parseInt(trxRows[0].count + 1);
    let user_id = req.user.id;
    var validProduct;
    var total_amount = 0;
    console.log(trx_number);

    const array = req.body.product;

    for (var i = 0; i < array.length; i++) {
      validProduct = await productVariatyController.getProductVariatyById(
        array[i].product_variaty_id
      );
      if (validProduct.length == 0) {
        return res
          .status(417)
          .send("Invalid product line number " + parseInt(i + 1));
      }
      total_amount = total_amount + validProduct[0].price * array[i].qty;
    }



    if (total_amount != req.body.total_amount) {
      return res.status(417).send("Invalid Total Amount");
    }

    const manipulationTotalAmount = req.body.total_amount + "00"

    const client = await db.pool.connect()

    await client.query('BEGIN')

    await client.query(
      {
        text: "INSERT INTO transaction(trx_number,user_id,total_amount,status,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
        values: [
          trx_number,
          user_id,
          req.body.total_amount,
          statusId[0].id,
          created_at,
          updated_at,
        ],
      },
      async (error, result) => {
        if (error) {
          return res.status(417).send(error.message);
        }

        var data = {}

        for (var i = 0; i < array.length; i++) {
          validProduct = await productVariatyController.getProductVariatyById(
            array[i].product_variaty_id
          );

          const price = validProduct[0].price;
          const amount = price * array[i].qty;

          await client.query({
            text: "INSERT INTO transaction_detail(trx_id,product_variaty_id, description,amount,qty,price) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
            values: [
              result.rows[0].id,
              array[i].product_variaty_id,
              validProduct[0].variaty_name,
              amount,
              array[i].qty,
              price
            ],
          }).then((result) => {

            if (!result.error) {
              data = {
                status: 200,
                message: "success",
                result: result.rows
              }

            } else {
              client.query('ROLLBACK')
              data = {
                status: 417,
                message: "Error",
                result: result.error
              }
              return res.status(data.status).send(data.message)
            }
          });
        }

        await client.query('COMMIT')
        await client.release()

        //create invoice

        const invoiceData = {
          trx_id: result.rows[0].id,
          currency_name: 'Rupiah',
          amount: result.rows[0].total_amount
        }

        const response = await invoiceController.createNewInvoiceFunction(invoiceData)

        console.log(response);


        if (response.status === 417) {
          return res.status(response.status).send(response.message)
        }

        // console.log("INVOICEEEEE" + JSON.stringify(response.result[0]));


        // console.log(result.rows[0].id);

        const trx_detail = await getTransactionDetailByTransactionId(invoiceData.trx_id)

        // console.log(trx_detail);

        const productVariaty = await productVariatyController.getProductVariatyById(trx_detail[0].product_variaty_id)

        const product = await productController.getProductById(productVariaty[0].product_id)

        //get inqury to merchant
        const paymentRequest = await productController.paymentRequestUniplay(product[0].product_ref_number, productVariaty[0].variaty_ref_number)

        if (paymentRequest.Code === "500") {
          return res.status(500).send(paymentRequest.message)
        }

        console.log(paymentRequest);


        const pgdata = {
          ReferenceNo: trx_number,
          TxnAmount: manipulationTotalAmount,
          ProdDesc: productVariaty[0].variaty_name,
          user_id: req.user.id
        }


        //MUST GENERATE to PG REquest
        const pgRespond = await paymentRequestController.generateQRISE2Pay(pgdata)

        console.log(pgRespond);

        // const validSignature = await paymentRequestController.validateSignature(pgRespond)

        // if (!validSignature) {
        //   return res.status(400).send("Invalid Response")
        // }




        if (pgRespond.Code != "00") {
          return res.status(400).send(pgRespond)
        }


        const dataPayment = {
          invoice_id: response.result[0].id,
          amount: response.result[0].amount,
          payment_method_id: 1,
          payment_number: pgRespond.TransId,
          payment_link: pgRespond.Data.QRCode,
          payment_vendor: paymentRequest.inquiry_id,
          expire_date: pgRespond.Data.ExpireDate,
        }



        //Saving Payment Gateway Responses to DB
        const paymentRequestResult = await paymentRequestController.createNewPaymentRequest(dataPayment)

        console.log("HIGHLIGHT : " + JSON.stringify(paymentRequestResult));



        if (paymentRequestResult.status === 417) {
          return res.status(417).send(paymentRequestResult.message)
        }




        return res.status(200).send(paymentRequestResult)
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchTransactionByUserId = async function (req, res) {};

exports.searchTransactionByTransactionId = async function (req, res) {};

exports.searchTransactionByTransactionNumber = async function (req, res) {};

exports.searchTransactionByInvoiceId = async function (req, res) {};

// Function

async function getAllTransaction() {
  const result = await db.pool.query({ text: "SELECT * FROM transaction" });
  return result.rows;
}

async function countTranscationRows() {
  const result = await db.pool.query({ text: "SELECT COUNT(*) FROM transaction" });
  return result.rows;
}

async function getTransactionById(id) {
  const result = await db.pool.query({
    text: "SELECT * FROM transaction Where id = $1",
    values: [id],
  });
  return result.rows;
}

async function getTransactionDetailByTransactionId(id) {
  const result = await db.pool.query({
    text: "SELECT * FROM transaction_detail Where trx_id = $1",
    values: [id]
  });
  console.log(result.rows);

  return result.rows
}

module.exports.getTransactionById = getTransactionById;

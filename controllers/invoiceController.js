const moment = require("moment");
const db = require("../util/dbconnections");
const verify = require("../verify");
const { text } = require("body-parser");
const validation = require("../validations");
const { Router, response } = require("express");
const statusController = require("../controllers/statusController");
const currencyController = require("../controllers/currencyController");
const general = require("../general");
const transactionController = require("../controllers/transactionController");


async function createNewInvoiceFunction(data, client) {

  console.log("INCOMING : " + JSON.stringify(data));


  const valid = await validation.createNewInvoiceValidation(data);

  var response = {}

  if (valid.error) {
    response = {
      status: 417,
      message: 'Error',
      result: valid.error
    }
    return response;
  }

  const exist = await getInvoiceByTrxId(data.trx_id);

  if (exist != 0) {
    response = {
      status: 417,
      message: 'Error',
      result: "Failed create Invoice with this transaction due to duplicate"
    }

    return response
  }

  // const trx = await transactionController.getTransactionById(data.trx_id);

  // if (trx.length == 0) {
  //   response = {
  //     status: 417,
  //     message: 'Error',
  //     result: "Invalid Transaction"
  //   }
  //   return response
  // }

  const currency = await currencyController.getCurrencyByName(
    data.currency_name
  );

  if (currency.length == 0) {
    response = {
      status: 417,
      message: 'Error',
      result: 'Invalid Currency'
    }
    return response
  }

  const invRows = await countInvoiceRows();

  const date = new Date();

  let invoiceNumber =
    "INV-" +
    parseInt(date.getMonth() + 1) +
    "-" +
    date.getFullYear() +
    "-" +
    parseInt(invRows[0].count + 1);

  let created_at = moment().valueOf();

  let updated_at = moment().valueOf();

  const status = 1;

  // const client = await db.pool.connect()

  // await client.query('BEGIN')

  console.log("PRE DATA INVOICE : " + JSON.stringify(data));



  const responseQuery = await client.query(
    {
      text: "INSERT INTO invoices(invoice_number, trx_id,amount,currency_id,status,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      values: [
        invoiceNumber,
        data.trx_id,
        data.amount,
        currency[0].id,
        status,
        created_at,
        updated_at,
      ],
    }
  ).then(async (result) => {
    var response = {}

    if (!result.error) {
      // await client.query('COMMIT')
      response = {
        status: 200,
        message: 'success',
        result: result.rows
      }
    } else {
      // await client.query('ROLLBACK')
      data = {
        status: 417,
        message: 'Error',
        result: result.error
      }
    }
    // await client.release()
    return response

  });
  return responseQuery
}

exports.createNewInvoice = async function (req, res) {
  try {
    const valid = await validation.createNewInvoiceValidation(req.body);

    if (valid.error) {
      return res.status(417).send(valid.error);
    }

    const exist = await getInvoiceByTrxId(req.body.trx_id);

    if (exist != 0) {
      return res
        .status(417)
        .send("Failed create Invoice with this transaction due to duplicate");
    }

    const trx = await transactionController.getTransactionById(req.body.trx_id);

    if (trx.length == 0) {
      return res.status(417).send("Invalid Transaction");
    }

    const currency = await currencyController.getCurrencyByName(
      req.body.currency_name
    );

    if (currency.length == 0) {
      return res.status(417).send("Invalid Currency");
    }

    console.log(currency);
    const invRows = await countInvoiceRows();

    const date = new Date();

    let invoiceNumber =
      "INV-" +
      parseInt(date.getMonth() + 1) +
      "-" +
      date.getFullYear() +
      "-" +
      parseInt(invRows[0].count + 1);

    let created_at = moment().valueOf();

    let updated_at = moment().valueOf();

    const status = 1;

    await db.pool.query(
      {
        text: "INSERT INTO invoices(invoice_number, trx_id,amount,currency_id,status,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
        values: [
          invoiceNumber,
          req.body.trx_id,
          trx[0].total_amount,
          currency[0].id,
          status,
          created_at,
          updated_at,
        ],
      },
      (error, result) => {
        if (error) {
          return res.status(417).send(error.message);
        }

        return res.status(200).send(result.rows);
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchInvoiceByNumber = async function (req, res) {};

exports.searchInvoiceByTransactionId = async function (req, res) {};

// Function

async function getAllInvoice() {
  const result = await db.pool.query({ text: "SELECT * FROM invoices" });
  return result.rows;
}

async function countInvoiceRows() {
  const result = await db.pool.query({ text: "SELECT COUNT(*) FROM invoices" });
  return result.rows;
}

async function getInvoiceByTrxId(id) {
  const result = await db.pool.query({
    text: "SELECT * FROM invoices where trx_id = $1",
    values: [id],
  });
  return result.rows;
}

async function getInvoiceById(id) {
  const result = await db.pool.query({
    text: "SELECT * FROM invoices where id = $1",
    values: [id]
  })
  return result.rows
}

async function updateInvoiceStatusById(id, statusId) {
  const result = await db.pool.query({
    text: "UPDATE invoices SET status = $1 WHERE id = $2 RETURNING *",
    values: [statusId, id]
  })
  return result.rows
}
module.exports.updateInvoiceStatusById = updateInvoiceStatusById
module.exports.getInvoiceById = getInvoiceById;
module.exports.getInvoiceByTrxId = getInvoiceByTrxId;
module.exports.createNewInvoiceFunction = createNewInvoiceFunction

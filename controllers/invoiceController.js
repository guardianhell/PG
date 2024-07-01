const moment = require("moment");
const db = require("../util/dbconnections");
const verify = require("../verify");
const { text } = require("body-parser");
const validation = require("../validations");
const { Router } = require("express");
const statusController = require("../controllers/statusController");
const currencyController = require("../controllers/currencyController");
const general = require("../general");
const transactionController = require("../controllers/transactionController");

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
    const invRows = await getAllInvoice();

    const date = new Date();

    let invoiceNumber =
      "INV-" +
      parseInt(date.getMonth() + 1) +
      "-" +
      date.getFullYear() +
      "-" +
      parseInt(invRows.length + 1);

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

async function getInvoiceByTrxId(id) {
  const result = await db.pool.query({
    text: "SELECT * FROM invoices where trx_id = $1",
    values: [id],
  });
  return result.rows;
}

module.exports.getInvoiceByTrxId = getInvoiceByTrxId;

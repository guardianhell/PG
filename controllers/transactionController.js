const moment = require("moment");
const db = require("../util/dbconnections");
const verify = require("../verify");
const { text } = require("body-parser");
const validation = require("../validations");
const { Router } = require("express");
const productController = require("../controllers/productController");
const productVariatyController = require("../controllers/productVariatyController");
const statusController = require("../controllers/statusController");
const general = require("../general");

exports.createNewTransaction = async function (req, res) {
  try {
    const valid = await validation.createNewTransactionValidation(req.body);

    if (valid.error) {
      return res.status(417).send(valid.error);
    }

    statusId = await statusController.getStatusByName(req.body.status_name);

    if (statusId.length == 0) {
      return res.status(417).send("Invalid Status");
    }

    let created_at = moment().valueOf();
    let updated_at = moment().valueOf();

    const trxRows = await getAllTransaction();
    let trx_number =
      "TX-" + moment().valueOf() + "-" + parseInt(trxRows.length + 1);
    let user_id = 1;
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

    await db.pool.query(
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

        for (var i = 0; i < array.length; i++) {
          validProduct = await productVariatyController.getProductVariatyById(
            array[i].product_variaty_id
          );
          const price = validProduct[0].price;
          const amount = price * array[i].qty;

          await db.pool.query({
            text: "INSERT INTO transaction_detail(trx_id,product_variaty_id, description,amount,qty,price) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
            values: [
              result.rows[0].id,
              array[i].product_variaty_id,
              validProduct[0].variaty_name,
              amount,
              array[i].qty,
              price,
            ],
          });
        }

        return res.status(200).send(result.rows);
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

async function getTransactionById(id) {
  const result = await db.pool.query({
    text: "SELECT * FROM transaction Where id = $1",
    values: [id],
  });
  return result.rows;
}

module.exports.getTransactionById = getTransactionById;

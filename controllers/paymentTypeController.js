const moment = require("moment");
const db = require("../util/dbconnections");
const verify = require("../verify");
const { text } = require("body-parser");
const validation = require("../validations");
const { Router } = require("express");
const general = require("../general");
const statusController = require("../controllers/statusController");

exports.createNewPaymentType = async function (req, res) {
  try {
    const valid = await validation.createNewPaymentTypeValidation(req.body);

    if (valid.error) {
      return res.status(417).send(valid.error);
    }

    const exist = await getPaymentTypeByName(req.body.payment);

    if (exist.length != 0) {
      return res.status(417).send("Payment name has been used");
    }

    const status = await statusController.getStatusByName(req.body.status_name);

    if (status.length == 0) {
      return res.status(417).send("Invalid Status");
    }

    let created_at = moment().valueOf();
    let updated_at = moment().valueOf();

    await db.pool.query(
      {
        text: "INSERT INTO payment_type(payment,bank, account_name,account_number, payment_fee_chrg_to_system,payment_fee_chrg_to_customer,timelimit_payment,status,min_amount,max_amount,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *",
        values: [
          req.body.payment,
          req.body.bank,
          req.body.account_name,
          req.body.account_number,
          req.body.payment_fee_chrg_to_system,
          req.body.payment_fee_chrg_to_customer,
          req.body.timelimit_payment,
          req.body.min_amount,
          req.body.max_amount,
          status[0].id,
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

// Function
async function getAllPaymentType() {
  const result = await db.pool.query({ text: "SELECT * FROM payment_type" });
  return result.rows;
}

async function getPaymentTypeByName(name) {
  const result = await db.pool.query({
    text: "SELECT * FROM payment_type where payment = $1",
    values: [name],
  });
  return result.rows;
}


async function getPaymentTypeById(id) {
  const result = await db.pool.query({
    text: "SELECT * FROM payment_type where id = $1",
    values: [id],
  });
  return result.rows;
}

module.exports.getAllPaymentType = getAllPaymentType;
module.exports.getPaymentTypeById = getPaymentTypeById

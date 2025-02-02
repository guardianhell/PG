const moment = require("moment");
const db = require("../util/dbconnections");
const verify = require("../verify");
const { text } = require("body-parser");
const validation = require("../validations");
const { Router } = require("express");
const statusController = require("../controllers/statusController");
const general = require("../general");
const crypto = require("crypto");

exports.registerNewMerchant = async function (req, res) {
  try {
    const valid = await validation.registerNewMerchantValidation(req.body);

    if (valid.error) {
      return res.status(417).send(valid.error);
    }

    var exist = await getMerchantByName(req.body.merchant_name);

    if (exist.length != 0) {
      return res.status(417).send("Merchant name has been used");
    }

    const statusId = await statusController.getStatusByName(
      req.body.status_name
    );

    if (statusId.length == 0) {
      return res.status(417).send("Invalid Status");
    }

    const merchantRows = await countMechantRows();
    const uniqueNumber = await general.numberGenerator(
      5,
      merchantRows[0].count + 1
    );

    const merchantNumber = "MRT-" + uniqueNumber;

    exist = await getMerchantByNumber(merchantNumber);

    if (exist.length != 0) {
      return res.status(417).send("Merchant Number has been used");
    }

    let secret_key = crypto.randomBytes(64).toString("hex");

    let created_at = moment().valueOf();
    let updated_at = moment().valueOf();

    await db.pool.query(
      {
        text: "INSERT INTO merchant(merchant_registration_number,merchant_name,secret_key,merchant_tax_number,merchant_address,status,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
        values: [
          merchantNumber,
          req.body.merchant_name,
          secret_key,
          req.body.merchant_tax_number,
          req.body.merchant_address,
          statusId[0].id,
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

exports.searchAllMerchant = async function (req, res) {
  try {
    const result = await getAllMerchant();
    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchMerchantById = async function (req, res) {
  try {
    const valid = await validation.searchByIdValidation(req.params);
    if (valid.error) {
      return res.status(417).send(valid.error);
    }
    const result = await getMerchantById(req.params.id);
    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchMerchantByName = async function (req, res) {
  try {
    const valid = await validation.searchMerchantByNameValidation(req.params);
    if (valid.error) {
      return res.status(417).send(valid.error);
    }

    const result = await getMerchantByName(req.params.merchant_name);
    return result;
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

// Function

async function getMerchantByName(name) {
  const result = await db.pool.query({
    text: "SELECT * FROM merchant where LOWER(merchant_name) = $1",
    values: [name.toLowerCase()],
  });
  return result.rows;
}

async function getAllMerchant() {
  const result = await db.pool.query({ text: "SELECT * FROM merchant" });

  return result.rows;
}

async function countMechantRows() {
  const result = await db.pool.query({ text: "SELECT COUNT(*) FROM merchant" });

  return result.rows;
}

async function getMerchantByNumber(number) {
  const result = await db.pool.query({
    text: "SELECT * FROM merchant where merchant_registration_number = $1",
    values: [number],
  });

  return result.rows;
}

async function getMerchantById(id) {
  const result = await db.pool.query({
    text: "SELECT * FROM merchant where id = $1",
    values: [id],
  });
  return result.rows;
}


module.exports.getMerchantByNumber = getMerchantByNumber

const moment = require("moment");
const db = require("../util/dbconnections");
const verify = require("../verify");
const { text } = require("body-parser");
const validation = require("../validations");
const { Router } = require("express");

exports.addNewCurrency = async function (req, res) {
  try {
    const valid = await validation.addNewCurrencyValidation(req.body);

    if (valid.error) {
      return res.status(417).send(valid.error);
    }

    var exist = await getCurrencyByName(req.body.currency_name);

    if (exist.length != 0) {
      return res.status(417).send("Currency Name has been used");
    }

    let created_at = moment().valueOf();
    let updated_at = moment().valueOf();

    const result = await db.pool.query(
      {
        text: "INSERT INTO currency(currency_name, currency_symbol, country, created_at, updated_at) VALUES($1,$2,$3,$4,$5) RETURNING *",
        values: [
          req.body.currency_name,
          req.body.currency_symbol,
          req.body.country,
          created_at,
          updated_at,
        ],
      },
      (error, result) => {
        if (error) {
          console.log(error);
          return res.status(400).send(error);
        }
        return res.status(200).send(result.rows);
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchCurrencyByName = async function (req, res) {
  try {
    const valid = await validation.searchCurrencyByNameValidation(req.params);
    if (valid.error) {
      return res.status(417).send("Invalid Currency Name");
    }

    const result = await getCurrencyByName(req.body.currency_name);
    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchCurrencyById = async function (res, res) {
  try {
    const valid = await validation.searchByIdValidation(req.params);
    if (valid.error) {
      return res.status(417).send("Invalid Currency Id");
    }

    const result = await getCurrencyById(req.body.id);
    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchCurrencyBySymbol = async function (req, res) {
  try {
    const valid = await validation.searchCurrencyBySymbolValidation(req.params);
    if (valid.error) {
      return res.status(417).send("Invalid Currency Symbol");
    }

    const result = await getCurrencyBySymbol(req.body.currency_symbol);
    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchCurrencyByCountry = async function (req, res) {
  try {
    const valid = await validation.searchCurrencyByCountryValidation(
      req.params
    );
    if (valid.error) {
      return res.status(417).send("Invalid Country");
    }

    const result = await getCurrencyByCountry(req.body.country);
    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.getAllCurrencyData = async function (req, res) {
  try {
    const result = await getAllCurrency();
    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

//Function

async function getCurrencyByName(name) {
  const result = await db.pool.query({
    text: "SELECT * FROM currency where LOWER(currency_name) = $1",
    values: [name.toLowerCase()],
  });
  return result.rows;
}

async function getCurrencyBySymbol(symbol) {
  const result = await db.pool.query({
    text: "SELECT * FROM currency where currency_symbol = $1",
    values: [symbol],
  });
  return result.rows;
}

async function getCurrencyById(id) {
  const result = await db.pool.query({
    text: "SELECT * FROM currency where id = $1",
    values: [id],
  });
  return result.rows;
}

async function getAllCurrency() {
  const result = await db.pool.query({ text: "SELECT * FROM currency" });

  return result.rows;
}

async function getCurrencyByCountry(country) {
  const result = await db.pool.query({
    text: "SELECT * FROM currency where country = $1",
    values: [country],
  });
  return result.rows;
}

module.exports.getCurrencyByName = getCurrencyByName;

const moment = require("moment");
const db = require("../util/dbconnections");
const verify = require("../verify");
const { text } = require("body-parser");
const validation = require("../validations");
const { Router } = require("express");
const productController = require("../controllers/productController");
const unitController = require("../controllers/unitController");
const statusController = require("../controllers/statusController");
const currencyController = require("../controllers/currencyController");
const general = require("../general");

exports.addProductVariaty = async function (req, res) {
  try {
    const valid = await validation.addProductVariatyValidation(req.body);

    if (valid.error) {
      return res.status(417).send(valid.error);
    }

    const productId = await productController.getProductByName(
      req.body.product_name
    );

    if (productId.length == 0) {
      return res.status(417).send("Invalid Product Name");
    }

    var exist = await getProductVariatyByName(
      productId[0].id,
      req.body.variaty_name
    );

    if (exist.length != 0) {
      return res.status(417).send("Variaty Name has been used in this Product");
    }

    const statusId = await statusController.getStatusByName(
      req.body.status_name
    );

    if (statusId.length == 0) {
      return res.status(417).send("Invalid Status");
    }

    const unitId = await unitController.getUnitByName(req.body.unit_name);

    if (unitId.length == 0) {
      return res.status(417).send("Invalid Unit");
    }

    const currencyId = await currencyController.getCurrencyByName(
      req.body.currency_name
    );

    if (currencyId.length == 0) {
      return res.status(417).send("Invalid Currency");
    }

    const productVariatyRows = await getAllProductVariaty();

    const uniqueNumber = await general.numberGenerator(
      9,
      productVariatyRows.length + 1
    );

    const productVariatyNumber = "VAR-" + productId[0].id + "-" + uniqueNumber;

    exist = await getProductVariatyByVariatyNumber(productVariatyNumber);

    if (exist.length != 0) {
      return res.status(417).send("Variaty Number has been used");
    }

    let created_at = moment().valueOf();
    let updated_at = moment().valueOf();

    await db.pool.query(
      {
        text: "INSERT INTO product_variaty(product_id, variaty_name, variaty_number, price, unit_id, currency_id, url, status, published, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *",
        values: [
          productId[0].id,
          req.body.variaty_name,
          productVariatyNumber,
          req.body.price,
          unitId[0].id,
          currencyId[0].id,
          req.body.url,
          statusId[0].id,
          false,
          created_at,
          updated_at,
        ],
      },
      (error, result) => {
        if (error) {
          console.log(error);
          return res.status(417).send(error);
        }
        return res.status(200).send(result.rows);
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchProductVariatyById = async function (req, res) {
  try {
    const valid = await validation.searchByIdValidation(req.params);

    if (valid.error) {
      return res.status(417).send(valid.error);
    }

    const result = await getProductVariatyById(req.params.id);
    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchProductVariatyByName = async function (req, res) {
  try {
    const valid = await validation.searchProductVariatyByProductName(
      req.params
    );

    if (valid.error) {
      return res.status(417).send(valid.error);
    }

    const result = await getProductVariatyByName(
      req.params.product_id,
      req.params.variaty_name
    );

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.getAllProductVariatyByProductId = async function (req, res) {
  try {
    const valid = await validation.searchProductVariatyByProductId(req.params);
    if (valid.error) {
      return res.status(401).send(valid.error);
    }
    const result = await getAllProductVariatyByProductId(req.params.product_id);
    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.updateProductVariaty = async function (req, res) {};
//FUNCTION

async function getProductVariatyById(id) {
  const result = await db.pool.query({
    text: "SELECT * FROM product_variaty where id = $1",
    values: [id],
  });

  return result.rows;
}

async function getProductVariatyByName(productId, productVariatyName) {
  const result = await db.pool.query({
    text: "SELECT * FROM product_variaty where variaty_name = $1 and product_id = $2",
    values: [productVariatyName, productId],
  });

  return result.rows;
}

async function getProductVariatyByVariatyNumber(variatyNumber) {
  const result = await db.pool.query({
    text: "SELECT * FROM product_variaty where variaty_number = $1",
    values: [variatyNumber],
  });
  return result.rows;
}

async function getAllProductVariatyByProductId(productId) {
  const result = await db.pool.query({
    text: "SELECT * FROM product_variaty where product_id = $1",
    values: [productId],
  });

  return result.rows;
}

async function getAllProductVariaty() {
  const result = await db.pool.query({
    text: "SELECT * FROM product_variaty",
  });
  return result.rows;
}

module.exports.getProductVariatyByName = getProductVariatyByName;
module.exports.getProductVariatyById = getProductVariatyById;

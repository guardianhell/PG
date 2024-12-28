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
    const response = await addProductVariaty(req.body)
    console.log(response.status);


    if (response.status == 200) {
      return res.status(200).send(response.data)

    }
    else {
      return res.status(response.status).send(response.message)

    }

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

exports.getAllProductVariaty = async function (req, res) {
  const response = await getAllProductVariaty()
  console.log(response);

  res.send(response.rows)
}

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

exports.updateProductVariaty = async function (req, res) { };




//FUNCTION

async function newProductVariaty(data) {
  const valid = await validation.addProductVariatyValidation(data);

  if (valid.error) {
    console.log(valid.error);

    const error = {
      status: 417,
      message: valid.error
    }
    return error
  }

  const productId = await productController.getProductByName(
    data.product_name
  );

  if (productId.length == 0) {
    const error = {
      status: 417,
      message: "Invalid Product Name"
    }
    return error
  }

  var exist = await getProductVariatyByName(
    productId[0].id,
    data.variaty_name
  );

  if (exist.length != 0) {
    const error = {
      status: 417,
      message: "Variaty Name has been used in this Product"
    }
    return error
  }

  const statusId = await statusController.getStatusByName(
    data.status_name
  );

  if (statusId.length == 0) {
    const error = {
      status: 417,
      message: "Invalid Status"
    }
    return error;
  }

  const unitId = await unitController.getUnitByName(data.unit_name);

  if (unitId.length == 0) {
    const error = {
      status: 417,
      message: "Invalid Unit"
    }
    return error
  }

  const currencyId = await currencyController.getCurrencyByName(
    data.currency_name
  );

  if (currencyId.length == 0) {
    const error = {
      status: 417,
      message: "Invalid Currency"
    }
    return error;
  }





  exist = await getProductVariatyByVariatyNumber(data.product_variaty_number);

  if (exist.length != 0) {
    const error = {
      status: 417,
      message: "Variaty Number has been used"
    }

    return error
  }

  let created_at = moment().valueOf();
  let updated_at = moment().valueOf();


  const client = await db.pool.connect()

  await client.query('BEGIN')


  const response = await client.query(
    {
      text: "INSERT INTO product_variaty(product_id, variaty_name, variaty_number,variaty_ref_number,cost_price ,price, unit_id, currency_id, url, status, published, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *",
      values: [
        productId[0].id,
        data.variaty_name,
        data.product_variaty_number,
        data.variaty_ref_number,
        data.cost_price,
        data.price,
        unitId[0].id,
        currencyId[0].id,
        data.url,
        statusId[0].id,
        false,
        created_at,
        updated_at,
      ],
    }
  ).then((result) => {
    client.query('COMMIT')
    var data = {}
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
        message: result.error
      }
    }
    client.release()
    return data
  }
  )
  console.log(response);

  return response;
}

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

async function countProductVariatyRows() {
  const result = await db.pool.query({
    text: "SELECT COUNT(*) FROM product_variaty",
  });
  return result.rows;
}

async function generateVariatyNumber(productId) {

  const productVariatyRows = await countProductVariatyRows();

  const uniqueNumber = await general.numberGenerator(
    9,
    productVariatyRows[0].count + 1
  );

  const productVariatyNumber = "VAR-" + productId + "-" + uniqueNumber;

  return productVariatyNumber
}

module.exports.getProductVariatyByName = getProductVariatyByName;
module.exports.getProductVariatyById = getProductVariatyById;
module.exports.generateVariatyNumber = generateVariatyNumber;
module.exports.newProductVariaty = newProductVariaty;

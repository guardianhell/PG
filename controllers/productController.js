const moment = require("moment");
const db = require("../util/dbconnections");
const router = require("express").Router();
const verify = require("../verify");
const { func } = require("joi");
const validation = require("../validations");
const productCategoryController = require("../controllers/productCategoryController");
const statusController = require("../controllers/statusController");
const getProductCategoryByName =
  require("../controllers/productCategoryController").getProductCategoryByName;
const getStatusByName =
  require("../controllers/statusController").getStatusByName;
const general = require("../general");

exports.addNewProduct = async function (req, res) {
  try {
    const valid = await validation.addProductValidation(req.body);

    if (valid.error) {
      return res.status(417).send(valid.error);
    }

    var exist = await getProductByName(req.body.product_name);

    if (exist.length != 0) {
      return res.status(417).send("Product Name has been used");
    }

    const productCategoryId =
      await productCategoryController.getProductCategoryByName(
        req.body.category_name
      );

    if (productCategoryId.length == 0) {
      return res.status(417).send("Invalid Product Category");
    }
    console.log(productCategoryId);

    const statusId = await statusController.getStatusByName(
      req.body.status_name
    );

    if (statusId.length == 0) {
      return res.status(417).send("Invalid Status");
    }

    const productRows = await getAllProduct();

    const productUniqueNumber = await general.numberGenerator(
      5,
      productRows.length + 1
    );

    const productNumber =
      "PROD-" + req.body.category_name + "-" + productUniqueNumber;

    exist = await getProductByProductNumber(productNumber);

    if (exist.length != 0) {
      return res.status(417).send("Product Number has been used");
    }

    let created_at = moment().valueOf();
    let updated_at = moment().valueOf();

    await db.pool.query(
      {
        text: "INSERT INTO product(product_number, product_name , product_description, product_category_id, brand, product_thumbnail, status, published, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",
        values: [
          productNumber,
          req.body.product_name,
          req.body.product_description,
          productCategoryId[0].id,
          req.body.brand,
          req.body.product_thumbnail,
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

exports.searchProductByName = async function (req, res) {
  try {
    const valid = await validation.searchProductByNameValidation(req.params);

    if (valid.error) {
      console.log(valid.error);
      return res.status(417).send("Invalid Product Name");
    }

    const result = await getProductByName(req.params.name);

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchProductById = async function (req, res) {
  try {
    const valid = await validation.searchByIdValidation(req.params);

    if (valid.error) {
      console.log(valid.error);
      return res.status(417).send("Invalid Product Name");
    }

    const result = await getProductById(req.params.id);

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.updateProduct = async function (req, res) {};

exports.searchAllProduct = async function (res, res) {
  try {
    const result = await getAllProduct();

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchAllPublishedProduct = async function (req, res) {
  try {
    const result = await getAllPublishedProduct();

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

// FUNCTION

async function getProductByName(name) {
  const result = await db.pool.query({
    text: "SELECT * FROM product where LOWER(product_name) = $1",
    values: [name.toLowerCase()],
  });

  return result.rows;
}

async function getProductByProductNumber(productNumber) {
  const result = await db.pool.query({
    text: "SELECT * FROM product where LOWER(product_number) = $1",
    values: [productNumber.toLowerCase()],
  });
  return result.rows;
}

async function getProductById(id) {
  const result = await db.pool.query({
    text: "SELECT * FROM product where id = $1",
    values: [id],
  });

  return result.rows;
}

async function getAllProduct() {
  const result = await db.pool.query({ text: "SELECT * FROM product" });
  return result.rows;
}

async function getAllPublishedProduct() {
  const result = await db.pool.query({
    text: "SELECT * FROM product where published = true",
  });

  return result.rows;
}

module.exports.getProductByName = getProductByName;

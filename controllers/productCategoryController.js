const moment = require("moment");
const db = require("../util/dbconnections");
const verify = require("../verify");
const { text } = require("body-parser");
const validation = require("../validations");
const { Router } = require("express");

exports.addNewProductCategory = async function (req, res) {
  try {
    let valid = await validation.addProductCategoryValidation(req.body);

    if (valid.error) {
      console.log(valid.error);
      return res.status(401).send(valid.error);
    }
    //console.log(req.body.category_name);

    const exist = await getProductCategoryByName(req.body.category_name);

    // console.log(exist);

    if (exist.length != 0) {
      return res.status(417).send("Product Category Name has been used");
    }

    let created_at = moment().valueOf();
    let updated_at = moment().valueOf();

    await db.pool.query(
      {
        text: "INSERT INTO product_category (category_name,created_at,updated_at) VALUES ($1,$2,$3) RETURNING *",
        values: [req.body.category_name, created_at, updated_at],
      },
      (error, result) => {
        if (error) {
          return res.status(417).send(error);
        }
        return res.status(200).send(result.rows);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
};

exports.getAllCategoryData = async function (req, res) {
  try {
    const result = await db.pool.query({
      text: "SELECT * FROM product_category",
    });

    return res.status(200).send(result.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchProductCategoryByName = async function (req, res) {
  try {
    console.log(req.params.category_name);
    const valid = await validation.searchProductCategoryNameValidation(
      req.params
    );

    if (valid.error) {
      console.log(valid.error);
      return res.status(417).send("Invalid Product Category Name");
    }

    const result = await getProductCategoryByName(req.params.category_name);

    res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchProductCategoryById = async function (req, res) {
  try {
    const valid = await validation.searchByIdValidation(req.params);

    if (valid.error) {
      console.log(valid.error);
      return res.status(401).send("Invalid Product Category Id");
    }

    const result = await getProductCategoryById(req.params.id);

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.updateProductCategory = async function (req, res) {};

// FUNCTION
async function getProductCategoryByName(categoryName) {
  const result = await db.pool.query({
    text: "SELECT * FROM product_category where LOWER(category_name) = $1",
    values: [categoryName.toLowerCase()],
  });

  return result.rows;
}

async function getProductCategoryById(id) {
  const result = await db.pool.query({
    text: "SELECT * FROM product_category where id = $1",
    values: [id],
  });

  return result.rows;
}

module.exports.getProductCategoryByName = getProductCategoryByName;

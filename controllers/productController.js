const moment = require("moment");
const db = require("../util/dbconnections");

const router = require("express").Router();
const verify = require("../verify");
const crypto = require("crypto");
const qs = require("querystring");
const { func } = require("joi");
const validation = require("../validations");
const productCategoryController = require("../controllers/productCategoryController");
const statusController = require("../controllers/statusController");
const getProductCategoryByName =
  require("../controllers/productCategoryController").getProductCategoryByName;
const getStatusByName =
  require("../controllers/statusController").getStatusByName;
const general = require("../general");
const { default: axios } = require("axios");
const json = require("body-parser/lib/types/json");
const { log } = require("console");

exports.addNewProduct = async function (req, res) {
  try {
    const response = await addNewProduct(req.body)


    if (!response.status == 200) {
      return res.status(response.status).send(response.message)
    }

    return res.status(417).send(response.data)


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

exports.getTokenUniPlay = async function (req, res) {
  try {

    const response = await generateUniplayToken()

    if (response.data.status == 200) {
      return res.send(response.access_token)
    }


  }
  catch (error) {
    return res.status(500).send(error.message)

  }
}

exports.getVoucherUniplay = async function (req, res) {
  try {
    const response = await getVoucherUniplay()
    return res.send(response)
    console.log(response);



  }
  catch (error) {
    return res.status(500).send(error.message)
  }
}

exports.getDTUUniplay = async function (req, res) {
  try {
    const response = await getDTUUniplay()
    return res.send(response)
  } catch (error) {
    return res.status(500).send(error.message)
  }
}


exports.syncProductVoucherUniplay = async function (req, res) {
  try {

    const response = await getVoucherUniplay()
    console.log(response);
    console.log(response.list_voucher[0].denom);


    response.list_voucher.forEach(async element => {
      const exist = await getProductByProductNumber(element.id)

      const data = {
        product_name: element.name,
        product_number: element.id,
        product_description: element.publisher_website,
        category_name: "voucher",
        brand: element.publisher,
        product_thumbnail: element.image,
        status_name: "Active",
        publishe: false
      }

      if (exist.rows > 0) {

      }
      else {
        addNewProduct(data).then((result) => {

          ///add variaty
        })
      }
    })


  } catch (error) {
    return res.status(500).send(error.message)
  }


}

// FUNCTION


async function addNewProduct(data) {
  const valid = await validation.addProductValidation(data);

  if (valid.error) {
    const error = {
      status: 417,
      message: valid.error
    }
    return error
  }

  var exist = await getProductByName(data.product_name);

  if (exist.length != 0) {
    const error = {
      status: 417,
      message: "Product Name has been used"
    }
    return error;
  }

  const productCategoryId =
    await productCategoryController.getProductCategoryByName(
      data.category_name
    );

  if (productCategoryId.length == 0) {

    const error = {
      status: 417,
      message: "Invalid Product Category"
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

  exist = await getProductByProductNumber(data.product_number);

  if (exist.length != 0) {
    const error = {
      status: 417,
      message: "Product Number has been used"
    }
    return error
  }

  let created_at = moment().valueOf();
  let updated_at = moment().valueOf();


  const response = await db.pool.query(
    {
      text: "INSERT INTO product(product_number, product_name , product_description, product_category_id, brand, product_thumbnail, status, published, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",
      values: [
        data.product_number,
        data.product_name,
        data.product_description,
        productCategoryId[0].id,
        data.brand,
        data.product_thumbnail,
        statusId[0].id,
        false,
        created_at,
        updated_at,
      ]
    }
  ).then((result) => {
    var data = {}
    if (!result.error) {
      data = {
        status: 200,
        message: "success",
        result: result.rows
      }

    } else {
      data = {
        status: 417,
        message: result.error
      }
    }

    console.log(data);
    return data
  })

  return response
}

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

async function generateUPLSignature(date) {

  const jsonArray = {
    api_key: process.env.UNIPLAYKEY,
    timestamp: date
  }

  const jsonString = JSON.stringify(jsonArray)

  const hmackey = process.env.UNIPLAYKEY + "|" + jsonString;
  console.log(hmackey);

  const uplSignature = await crypto.createHmac('sha512', hmackey).update(jsonString).digest("hex")

  return uplSignature
}

async function generateTimestamp() {
  const dateFormat = "YYYY-MM-DD HH:mm:ss"
  const datedata = moment().format(dateFormat)
  console.log(datedata);

  return datedata
}

async function generateUniplayToken() {
  const datedata = await generateTimestamp()
  const signature = await generateUPLSignature(datedata)


  const data = JSON.stringify({
    api_key: process.env.UNIPLAYKEY,
    timestamp: datedata
  })

  const url = "https://api-reseller.uniplay.id/v1/access-token"


  const response = await axios.post(url, data, {
    headers: {
      "UPL-SIGNATURE": signature,
      'Content-Type': "application/json"
    }
  }
  )

  console.log(response.data);



  return response
}


async function getVoucherUniplay() {

  const responseToken = await generateUniplayToken()
  const url = "https://api-reseller.uniplay.id/v1/inquiry-voucher"
  const date = await generateTimestamp()
  const signature = await generateUPLSignature(date)



  const data = {
    api_key: process.env.UNIPLAYKEY,
    timestamp: date
  }



  const response = await axios.post(url, data, {
    headers: {
      "UPL-SIGNATURE": signature,
      "UPL-ACCESS-TOKEN": responseToken.data.access_token
    }
  })


  return response.data

}


async function getDTUUniplay() {

  const responseToken = await generateUniplayToken()
  const url = "https://api-reseller.uniplay.id/v1/inquiry-dtu"
  const date = await generateTimestamp()
  const signature = await generateUPLSignature(date)



  const data = {
    api_key: process.env.UNIPLAYKEY,
    timestamp: date
  }



  const response = await axios.post(url, data, {
    headers: {
      "UPL-SIGNATURE": signature,
      "UPL-ACCESS-TOKEN": responseToken.data.access_token
    }
  })


  console.log(response.data.list_dtu.splice(0, 10));

  return response.data.list_dtu.splice(0, 10)



}

async function generateProductNumber() {
  const productRows = await getAllProduct();

  const productUniqueNumber = await general.numberGenerator(
    5,
    productRows.length + 1
  );

  const productNumber =
    "PROD-" + req.body.category_name + "-" + productUniqueNumber;

  return productNumber
}



module.exports.getProductByName = getProductByName;

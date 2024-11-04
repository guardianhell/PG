const moment = require("moment");
const db = require("../util/dbconnections");

const router = require("express").Router();
const moments = require('moment-timezone');
const verify = require("../verify");
const crypto = require("crypto");
const qs = require("querystring");
const { func } = require("joi");
const validation = require("../validations");
const productCategoryController = require("../controllers/productCategoryController");
const productVariatyController = require("../controllers/productVariatyController")
const statusController = require("../controllers/statusController");
const getProductCategoryByName =
  require("../controllers/productCategoryController").getProductCategoryByName;
const getStatusByName =
  require("../controllers/statusController").getStatusByName;
const general = require("../general");
const { default: axios } = require("axios");
const json = require("body-parser/lib/types/json");
const { log } = require("console");
const { text } = require("stream/consumers");

exports.addNewProduct = async function (req, res) {
  try {
    const response = await addNewProduct(req.body)


    if (!response.status == 200) {
      return res.status(417).send(response.data)

    }
    else {
      return res.status(response.status).send(response.message)
    }

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

exports.updateProduct = async function (req, res) {

  updateProduct(req.body)

};

async function paymentRequestUniplay(entitasId, denomId) {
  const accessToken = await generateUniplayToken()

  const url = "https://api-reseller.uniplay.id/v1/inquiry-payment"

  const date = await generateTimestamp()


  const data = {
    api_key: process.env.UNIPLAYKEY,
    timestamp: date,
    entitas_id: entitasId,
    denom_id: denomId
  }

  const signature = await generateUPLSignature2(data)


  const response = await axios.post(url, data, {
    headers: {
      "UPL-SIGNATURE": signature,
      "UPL-ACCESS-TOKEN": accessToken.data.access_token
    }
  })



  console.log(response.data)
  return response.data

}

exports.paymentUniplay = async function (req, res) {
  try {
    paymentRequestUniplay(re)
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message)
  }

}

exports.confirmPayment = async function (req, res) {
  try {

    const url = "https://api-reseller.uniplay.id/v1/confirm-payment"

    const accessToken = await generateUniplayToken()

    const paymentId = "aVo0Wnd4cjZtdk9CbTRhcGxMWFlEY3hWOHEzc2tvbFlDckI3UHJ4MWlYK1hJSXpUVndSUUJkYnlKRU9qYjM3NlE5QnVLT2NORTlGTktIdEp6emNYOFE9PQ=="

    const date = await generateTimestamp()

    const data = {
      api_key: process.env.UNIPLAYKEY,
      timestamp: date,
      inquiry_id: paymentId,
      pincode: process.env.UPYPIN
    }

    const signature = await generateUPLSignature2(data)

    const response = await axios.post(url, data, {
      headers: {
        "UPL-SIGNATURE": signature,
        "UPL-ACCESS-TOKEN": accessToken.data.access_token
      }
    })

    console.log(response);
    return res.send(response.data)


  } catch (error) {
    return res.status(500).send(error.message)
  }
}

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

    const dataArray = response.list_voucher

    console.log(dataArray);


    const dataLength = dataArray.length

    const dataResult = {
      status: 200,
      message: "",
      result: []
    }

    for (var i = 0; i < dataLength; i++) {

      const exist = await getProductByProductNumber(dataArray[i].id)

      if (exist.length == 0) {

        const product_number = await generateProductNumber("voucher")

        console.log(product_number);
        console.log(dataArray[i].id);


        const data =
        {
          product_name: dataArray[i].name,
          product_number: product_number,
          product_ref_number: dataArray[i].id,
          product_description: "voucher " + dataArray[i].publisher + " " + dataArray[i].publisher_website,
          category_name: "voucher",
          brand: dataArray[i].publisher,
          merchant_id: 1,
          product_thumbnail: dataArray[i].image,
          status_name: "Active",
          published: false
        }


        const response = await addNewProduct(data).then(async (result) => {
          if (result.status == 200) {
            dataResult.result.push(result)
            for (var j = 0; j < dataArray[i].denom.length; j++) {

              const dataArray2 = dataArray[i].denom[j];
              console.log("AAAAA");

              console.log(result);

              const variatyNumber = await productVariatyController.generateVariatyNumber(1)
              const data2 = {
                product_name: dataArray[i].name,
                product_variaty_number: variatyNumber,
                variaty_ref_number: dataArray2.id,
                variaty_name: dataArray2.package,
                cost_price: dataArray2.price,
                price: Math.trunc((dataArray2.price / 0.95)),
                unit_name: "voucher",
                currency_name: "Rupiah",
                url: "www.pandoorbox.com",
                status_name: "active"
              }

              const response2 = await productVariatyController.newProductVariaty(data2).then(async (results2) => {
                if (results2.status == 200) {
                  dataResult.result.push(results2)
                }
                else {
                  console.log(results2);

                  dataResult.status = results2.status
                  dataResult.message = "Failed"
                  dataResult.result.push(results2)
                }
              })

            }
          }
          else {
            dataResult.status = result.status
            dataResult.message = "Failed"
            dataResult.result.push(result)
          }
        })
      }
    }

    if (dataResult.status == 200) {
      return res.status(200).send("Data Sync Success")
    }
    else {
      console.log(JSON.stringify(dataResult))
      return res.status(dataResult.status).send
        ("Data Sync Failed")
    }

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

  const client = await db.pool.connect()

  await client.query('BEGIN')

  const response = await client.query(
    {
      text: "INSERT INTO product(product_number,product_ref_number, product_name , product_description, product_category_id, brand, product_thumbnail,merchant_id ,status, published, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *",
      values: [
        data.product_number,
        data.product_ref_number,
        data.product_name,
        data.product_description,
        productCategoryId[0].id,
        data.brand,
        data.product_thumbnail,
        data.merchant_id,
        statusId[0].id,
        false,
        created_at,
        updated_at,
      ]
    }
  ).then(async (result) => {
    var data = {}
    if (!result.error) {
      await client.query('COMMIT')
      data = {
        status: 200,
        message: "success",
        result: result.rows
      }

    } else {
      await client.query('ROLLBACK')
      data = {
        status: 417,
        message: result.error
      }
    }
    await client.release()
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

async function generateUPLSignature2(data) {

  // const jsonArray = {
  //   api_key: process.env.UNIPLAYKEY,
  //   timestamp: date
  // }

  console.log("MMM " + data);


  const jsonString = JSON.stringify(data)

  const hmackey = process.env.UNIPLAYKEY + "|" + jsonString;
  console.log(hmackey);

  const uplSignature = await crypto.createHmac('sha512', hmackey).update(jsonString).digest("hex")

  return uplSignature
}

async function generateTimestamp() {
  const dateFormat = "YYYY-MM-DD HH:mm:ss"
  const datedata = moments().tz('Asia/Jakarta').format(dateFormat)
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

  console.log("TGL " + date);


  const data = {
    api_key: process.env.UNIPLAYKEY,
    timestamp: date
  }

  console.log("DATA  : " + data);

  const signature = await generateUPLSignature2(data)


  const response = await axios.post(url, data, {
    headers: {
      "UPL-SIGNATURE": signature,
      "UPL-ACCESS-TOKEN": responseToken.data.access_token
    }
  })

  console.log(response);


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

async function generateProductNumber(category) {
  const productRows = await getAllProduct();

  const productUniqueNumber = await general.numberGenerator(
    5,
    productRows.length + 1
  );

  const productNumber =
    "PROD-" + category + "-" + productUniqueNumber;

  return productNumber
}

async function updateProduct(data) {
  console.log(data);


  const updated_at = moment().valueOf()

  const result = await getProductByProductNumber(data.product_number)

  var category, status = null;

  console.log(data.category_name);


  if (data.category_name) {
    category =
      await productCategoryController.getProductCategoryByName(
        data.category_name
      );
  }

  console.log(category);


  if (category.length == 0) {

    const error = {
      status: 417,
      message: "Invalid Product Category"
    }
    return error
  }

  if (data.status) {
    status = await statusController.getStatusByName(data.status)
  }

  console.log(status);


  if (status.length == 0) {
    const error = {
      status: 417,
      message: "Invalid Status"
    }
    return error
  }

  // text: "UPDATE product SET product_name=COALESCE(NULLIF($1, ''), product_name), product_description=COALESCE(NULLIF($2, ''), product_description), product_category_id=COALESCE(NULLIF($3::bigint, ''), product_category_id), brand=COALESCE(NULLIF($4, ''), brand),product_thumbnail=COALESCE(NULLIF($5, ''), product_thumbnail),status=COALESCE(NULLIF($6::bigint, ''), status),published=COALESCE(NULLIF($7, ''), published),updated_at=$8 WHERE product_number=$9 RETURNING *",

  const response = await db.pool.query({
    text: "UPDATE product SET product_name=COALESCE(NULLIF($1, ''), product_name), product_description=COALESCE(NULLIF($2, ''), product_description), brand=COALESCE(NULLIF($3, ''), brand),product_thumbnail=COALESCE(NULLIF($4, ''), product_thumbnail),updated_at=$5 WHERE product_number=$6 RETURNING *",
    values: [data.product_name, data.product_description, data.brand, data.product_thumbnail, updated_at, data.product_number]
  }).then((results) => {
    var data = {}
    if (!results.error) {
      data = {
        status: 200,
        message: "success",
        result: results.rows
      }

    } else {
      data = {
        status: 417,
        message: results.error
      }
    }

    console.log(results);

    return data
  })
}


module.exports.getProductByName = getProductByName;
module.exports.getProductById = getProductById;
module.exports.paymentRequestUniplay = paymentRequestUniplay;
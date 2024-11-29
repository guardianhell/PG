const Joi = require("joi");
const moment = require("moment");

//General
exports.searchByIdValidation = function (data) {
  const schema = Joi.object({
    id: Joi.number().min(1).max(9999).positive().integer().required(),
  });
  return schema.validate(data);
};

// Status
exports.addStatusValidation = function (data) {
  const schema = Joi.object({
    status_name: Joi.string().min(1).max(256).required(),
  });
  return schema.validate(data);
};

exports.searchStatusNameValidation = function (data) {
  const schema = Joi.object({
    id: Joi.string().min(1).max(2048).required(),
  });
  return schema.validate(data);
};

// Product Category
exports.addProductCategoryValidation = function (data) {
  const schema = Joi.object({
    category_name: Joi.string().min(1).max(128).required(),
  });
  return schema.validate(data);
};

exports.searchProductCategoryNameValidation = function (data) {
  const schema = Joi.object({
    category_name: Joi.string().min(1).max(128).required(),
  });
  return schema.validate(data);
};

// Product Variaty
exports.addProductVariatyValidation = function (data) {
  const schema = Joi.object({
    product_name: Joi.string().min(1).max(256).required(),
    product_variaty_number: Joi.string().min(1).max(256).required(),
    variaty_ref_number: Joi.string().min(3).max(256).required(),
    variaty_name: Joi.string().min(1).max(256).required(),
    cost_price: Joi.number().positive().required(),
    price: Joi.number().positive().required(),
    unit_name: Joi.string().min(1).max(128).required(),
    currency_name: Joi.string().min(1).max(128).required(),
    url: Joi.string().required(),
    status_name: Joi.string().min(1).max(2048).required(),
  });
  return schema.validate(data);
};

exports.searchProductVariatyByProductId = function (data) {
  const schema = Joi.object({
    product_id: Joi.number().min(1).max(9999).positive().integer().required(),
  });
  return schema.validate(data);
};

exports.searchProductVariatyByProductName = function (data) {
  const schema = Joi.object({
    product_id: Joi.number().min(1).max(9999).positive().integer().required(),
    variaty_name: Joi.string().min(1).max(256).required(),
  });
  return schema.validate(data);
};

// Product

exports.addProductValidation = function (data) {
  const schema = Joi.object({
    product_name: Joi.string().min(1).max(256).required(),
    product_number: Joi.string().min(6).max(256).required(),
    product_ref_number: Joi.string().min(3).max(256).required(),
    product_description: Joi.string().min(1).max(2048).required(),
    category_name: Joi.string().min(1).max(128).required(),
    brand: Joi.string().min(1).max(265).required(),
    product_thumbnail: Joi.string(),
    merchant_id: Joi.number().required(),
    status_name: Joi.string().min(1).max(2048).required(),
    published: Joi.boolean().default(false).required(),
  });
  return schema.validate(data);
};

exports.searchProductByNameValidation = function (data) {
  const schema = Joi.object({
    product_name: Joi.string().min(1).max(256).required(),
  });
  return schema.validate(data);
};

exports.updateProductValidation = function (data) {
  const schema = Joi.object({
    product_number: Joi.string().min(1).max(2048),
    product_name: Joi.string().min(1).max(256),
    product_description: Joi.string().min(1).max(2048),
    product_category_id: Joi.number().min(1).max(9999).integer(),
    brand: Joi.string().min(1).max(265),
    product_thumbnail: Joi.string().dataUri(),
    status: Joi.number().min(1).max(9999).positive().integer(),
    published: Joi.boolean().default(false),
  });
  return schema.validate(data);
};

exports.addStatusValidation = function (data) {
  const schema = Joi.object({
    status_name: Joi.string().min(1).max(128).required(),
  });
  return schema.validate(data);
};

exports.addUnitValidation = function (data) {
  const schema = Joi.object({
    unit_name: Joi.string().min(1).max(128).required(),
  });
  return schema.validate(data);
};

exports.searchUnitByNameValidation = function (data) {
  const schema = Joi.object({
    unit_name: Joi.string().min(1).max(128).required(),
  });
  return schema.validate(data);
};

// currency

exports.searchCurrencyByNameValidation = function (data) {
  const schema = Joi.object({
    currency_name: Joi.string().min(1).max(128).required(),
  });
  return schema.validate(data);
};

exports.searchCurrencyBySymbolValidation = function (data) {
  const schema = Joi.object({
    currency_symbol: Joi.string().min(1).max(4).required(),
  });
  return schema.validate(data);
};

exports.searchCurrencyByCountryValidation = function (data) {
  const schema = Joi.object({
    country: Joi.string().min(1).max(128).required(),
  });
  return schema.validate(data);
};

exports.addNewCurrencyValidation = function (data) {
  const schema = Joi.object({
    currency_name: Joi.string().min(1).max(128).required(),
    currency_symbol: Joi.string().min(1).max(4).required(),
    country: Joi.string().min(1).max(128).required(),
  });
  return schema.validate(data);
};

// Merchant

exports.registerNewMerchantValidation = function (data) {
  const schema = Joi.object({
    merchant_name: Joi.string().min(1).max(128).required(),
    merchant_tax_number: Joi.string().min(1).max(128).required(),
    merchant_address: Joi.string().min(1).max(2048).required(),
    status_name: Joi.string().min(1).max(2048).required(),
  });
  return schema.validate(data);
};

exports.searchMerchantByNameValidation = function (data) {
  const schema = Joi.object({
    merchant_name: Joi.string().min(1).max(128).required(),
  });
};

// Transaction

exports.createNewTransactionValidation = function (data) {
  const schema = Joi.object({
    user_id: Joi.number().min(1).max(9999).positive().integer().required(),
    total_amount: Joi.number().min(1).max(9999999999).required(),
    status_name: Joi.string().min(1).max(2048).required(),
    product: Joi.array()
      .items({
        product_variaty_id: Joi.number()
          .min(1)
          .max(9999)
          .positive()
          .integer()
          .required(),
        qty: Joi.number().min(1).max(9999).required(),
      })
      .required(),
    currency_name: Joi.string().min(1).max(128).required(),
  });
  return schema.validate(data);
};

//Invoice

exports.createNewInvoiceValidation = function (data) {
  const schema = Joi.object({
    trx_id: Joi.number().min(1).max(999999999).positive().integer().required(),
    currency_name: Joi.string().min(1).max(128).required(),
    amount: Joi.number().positive().integer()
  });
  return schema.validate(data);
};

// Payment Type

exports.createNewPaymentTypeValidation = function (data) {
  const schema = Joi.object({
    payment: Joi.string().min(1).max(128).required(),
    bank: Joi.string().min(1).max(128).required(),
    account_name: Joi.string().min(1).max(128).required(),
    account_number: Joi.number().min(6).max(10000000000000).required(),
    payment_fee_chrg_to_system: Joi.number().min(0).max(100).required(),
    payment_fee_chrg_to_customer: Joi.number().min(0).max(100).required(),
    timelimit_payment: Joi.number().min(60).max(604800).required(),
    status_name: Joi.string().min(1).max(128).required(),
  });
  return schema.validate(data);
};


//Payment Request

exports.requestNewPaymentValidation = function(data){
  const schema = Joi.object({
    invoice_id: Joi.number().min(1).max(999999999).positive().integer().required(),
    amount: Joi.number().min(1).max(9999999999).required(),
    payment_method_id: Joi.number().min(1).max(999999999).positive().integer().required(),
    payment_number: Joi.string().min(1).max(256).required(),
    payment_link: Joi.string().min(1).max(256).required(),
    payment_vendor: Joi.string().min(1).max(256).required(),
    expire_date: Joi.date().timestamp('unix'),
  })
  return schema.validate(data)
}

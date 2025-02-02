const moment = require("moment")
const db = require('../util/dbconnections')
const validation = require("../validations")
const crypto = require('crypto')
const { getMerchantByNumber } = require("./merchantController")
const paymentRequestController = require('./paymentRequestController')
const paymentTypeController = require('./paymentTypeController')
const statusController = require('./statusController')
const currencyController = require('./currencyController')
const invoiceController = require('./invoiceController')
const { getInvoiceByMerchantTrxCode } = require("./invoiceController")
const constant = require('./constants')




exports.merchantPaymentRequest = async function (req, res) {

    console.log("TEST");


    const data = req.body

    //need validation
    const validRequest = await validation.merchantPaymentRequest(data)

    if (validRequest.error) {
        console.log(validRequest.error);
        return res.status(constant.invalidParameters.status).send(constant.invalidParameters)
    }

    const merchantCode = data.merchantCode

    const validMerchant = await getMerchantByNumber(merchantCode)

    if (!validMerchant) {
        return res.status(constant.invalidMerchant.status).send(constant.invalidMerchant)
    }

    const merchantKey = validMerchant[0].secret_key

    data.merchantKey = merchantKey

    //validateRequestSignature

    const checkSignature = requestSignature(data, merchantKey)

    if (!data.signature == checkSignature) {
        return res.status(constant.invalidSignature.status).send(constant.invalidSignature)
    }

    //check status 

    const status = await statusController.getStatusByName("Waiting for Payment");

    if (status.length == 0) {
        console.log("Invalid Status, status not found");
        return res.status(constant.serverError.status).send(constant.serverError);
    }

    //checkpayment


    const paymentMethod = paymentTypeController.getPaymentTypeById(data.paymentId)

    if (paymentMethod.length == 0) {
        console.log("Invalid Payment Method, payment method not found");
        return res.status(constant.serverError.status).send(constant.serverError);
    }

    //create timestamp

    let created_at = moment().valueOf();
    let updated_at = moment().valueOf();


    //generate trx number
    let trx_number = data.merchantTrxCode

    const userId = crypto.randomInt(1, 10)

    const client = await db.pool.connect()

    await client.query('BEGIN')

    const transaction = await client.query({
        text: "INSERT INTO transaction(trx_number,user_id,total_amount,status,created_at,updated_at,callbackurl) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
        values: [
            trx_number,
            userId,
            data.amount,
            status[0].id,
            created_at,
            updated_at,
            data.callbackURL
        ],
    }).catch(async (error) => {
        console.log(error);
        return { error: "ERROR" }
    })


    if (transaction.error) {
        await client.query('ROLLBACK')
        await client.release()
        console.log(transaction.error);
        return res.status(constant.serverError.status).send(constant.serverError)
    }
    console.log(transaction);


    const invoiceData = {
        trx_id: transaction.rows[0].id,
        amount: transaction.rows[0].total_amount,
        currency_name: 'IDR',
    }


    const validInvoiceData = await validation.createNewInvoiceValidation(invoiceData);

    if (validInvoiceData.error) {
        await client.query('ROLLBACK')
        await client.release()
        console.log(valid.error);
        return res.status(constant.invalidParameters.status).send(constant.invalidParameters)
    }


    const exist = await getInvoiceByMerchantTrxCode(data.merchantTrxCode, validMerchant[0].id)

    console.log(exist);


    if (exist.length != 0) {
        await client.query('ROLLBACK')
        await client.release()
        return res.status(constant.duplicateTrxCode.status).send(constant.duplicateTrxCode)
    }

    const currency = await currencyController.getCurrencyByName(
        data.currency
    );

    if (currency.length == 0) {
        await client.query('ROLLBACK')
        await client.release()
        return res.status(constant.invalidParameters.status).send(constant.invalidParameters)
    }

    const invRows = await invoiceController.countInvoiceRows();

    const date = new Date();

    let invoiceNumber =
        "INV-" +
        parseInt(date.getMonth() + 1) +
        "-" +
        date.getFullYear() +
        "-" +
        parseInt(invRows[0].count + 1);

    //create invoice to DB

    const invoice = await client.query(
        {
            text: "INSERT INTO invoices(invoice_number, trx_id,amount,currency_id,status,created_at,updated_at,merchant_id,merchant_trx_code) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
            values: [
                invoiceNumber,
                transaction[0].id,
                data.amount,
                currency[0].id,
                statusId[0].id,
                created_at,
                updated_at,
                validMerchant[0].id,
                data.merchantTrxCode
            ],
        }).catch(async (error) => {
            console.log(error);
            return { error: "ERROR" }
        })


    if (invoice.error) {
        console.log("Failed write Invoice to DB");
        await client.query('ROLLBACK')
        await client.release()
        return res.status(constant.serverError.status).send(constant.serverError)
    }

    const manipulationTotalAmount = data.amount + "00"

    const pgdata = {
        ReferenceNo: trx_number,
        TxnAmount: manipulationTotalAmount,
        ProdDesc: data.merchantTrxCode,
        user_id: userId,
        PaymentId: paymentMethod[0].account_number
    }

    const pgRespond = await paymentRequestController.generateQRISE2Pay(pgdata)

    if (pgRespond.Code != "00") {
        await client.query('ROLLBACK')
        await client.release()
        console.log("failed pg query!");
        console.log(pgRespond);
        return res.status(constant.serverError.status).send(constant.serverError)
    }


    const dataPayment = {
        invoice_id: invoice[0].id,
        amount: invoice[0].amount,
        payment_method_id: paymentMethod[0].id,
        payment_number: pgRespond.TransId,
        payment_link: pgRespond.Data.QRCode,
        payment_vendor: paymentRequest.inquiry_id,
        expire_date: pgRespond.Data.ExpireDate,
    }


    const validPayment = await validation.requestNewPaymentValidation(data)

    if (validPayment.error) {
        await client.query('ROLLBACK')
        await client.release()
        console.log(validPayment);
        return res.status(constant.invalidParameters.status).send(constant.invalidParameters)
    }

    const paymentNumber = await paymentRequestController.generatePaymentNumber(created_at)

    const responsePaymentRequest = await client.query({
        text: "INSERT INTO payment_request(invoice_id,payment_request_number, status,amount, payment_method_id,payment_number,payment_link,expire_date,payment_vendor_identifier,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *",
        values: [
            dataPayment.invoice_id,
            paymentNumber,
            status[0].id,
            dataPayment.amount,
            dataPayment.payment_method_id,
            dataPayment.payment_number,
            dataPayment.payment_link,
            dataPayment.expire_date,
            merchantCode,
            created_at,
            updated_at,
        ],
    }).catch(async (error) => {
        console.log(error);
        return { error: "ERROR" }
    })

    if (responsePaymentRequest.error) {
        console.log(responsePaymentRequest);
        await client.query('ROLLBACK')
        await client.release()
        return res.status(constant.serverError.status).send(constant.serverError)
    }

    await client.query('COMMIT')
    await client.release()

    var responseClient = {
        merchantCode: merchantCode,
        paymentId: paymentMethod[0].id,
        currency: data.currency,
        amount: dataPayment.amount,
        merchantTrxCode: data.merchantTrxCode,
        status: status[0].status_name,
        data: {
            qrCode: dataPayment.payment_link,
            paymentNumber: invoiceNumber,
            expireDate: dataPayment.expire_date
        }
    }

    const resSignature = await responseSignature(responseClient, merchantKey)

    responseClient.signature = resSignature


    return res.status(200).send(responseClient)

    // generate transaction based on paymentID

    // create trx

    // generateResponseSignature

}


async function responseSignature(data, secretkey) {

    //merchantCode+merchantKey+paymentId+currency+amount+merchantTrxCode+

    const merchantCode = data.merchantCode
    const merchantKey = secretkey
    const paymentId = data.paymentId
    const amount = data.amount
    const merchantTrxCode = data.amount
    const currency = data.currency
    const status = data.status

    const signature = await crypto.createHash("sha256").update(merchantCode + merchantKey + paymentId + currency + amount + merchantTrxCode + status).digest("base64")

    return signature

}


async function requestSignature(data, secret_key) {

    //merchantCode+merchantKey+paymentId+currency+amount+merchantTrxCode

    const merchantCode = data.merchantCode
    const merchantKey = secret_key
    const paymentId = data.paymentId
    const amount = data.amount
    const merchantTrxCode = data.amount
    const currency = data.currency

    const signature = await crypto.createHash("sha256").update(merchantCode + merchantKey + paymentId + currency + amount + merchantTrxCode).digest("base64")

    return signature

}
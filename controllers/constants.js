module.exports.invalidMerchant = Object.freeze(
    {
        status: 417,
        result: 2001,
        message: "Invalid Merchant"
    }
)

module.exports.duplicateTrxCode = Object.freeze(
    {
        status: 417,
        result: 2002,
        message: "Duplicate Transaction Code"
    }
)

module.exports.invalidParameters = Object.freeze(
    {
        status: 417,
        result: 2003,
        message: "Invalid Parameters"
    }
)


module.exports.serverError = Object.freeze(
    {
        status: 500,
        result: 2005,
        message: "Server Error"
    }
)


module.exports.invalidSignature = Object.freeze(
    {
        status: 417,
        result: 2110,
        message: "Invalid Signature"
    }
)

module.exports.merchantInactive = Object.freeze(
    {
        status: 417,
        result: 2301,
        message: "Merchant Inactive"
    }
)
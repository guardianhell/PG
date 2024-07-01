const router = require("express").Router();
const currencyController = require("../controllers/currencyController");
const verify = require("../verify");

router.post("/add", currencyController.addNewCurrency);

router.get("/currency/:currency_name", currencyController.searchCurrencyByName);

router.get("/id/:id", currencyController.searchCurrencyById);
router.get(
  "/symbol/:currency_symbol",
  currencyController.searchCurrencyBySymbol
);
router.get("/country/:country", currencyController.searchCurrencyByCountry);
router.get("/all", currencyController.getAllCurrencyData);

module.exports = router;

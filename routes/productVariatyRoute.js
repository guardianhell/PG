const router = require("express").Router();
const productVariatyController = require("../controllers/productVariatyController");
const { route } = require("./productCategoryRoute");

router.post("/add", productVariatyController.addProductVariaty);
router.get(
  "/all/:product_id",
  productVariatyController.getAllProductVariatyByProductId
);
router.get("id/:id", productVariatyController.searchProductVariatyById);
router.get(
  "/variaty-name/:product_id/:variaty_name",
  productVariatyController.searchProductVariatyByName
);

module.exports = router;

const router = require("express").Router();
const productCategoryController = require("../controllers/productCategoryController");
const verify = require("../verify");

router.post("/add", productCategoryController.addNewProductCategory);

router.get(
  "/category/:category_name",
  productCategoryController.searchProductCategoryByName
);

router.get("/id/:id", productCategoryController.searchProductCategoryById);
router.get("/all", productCategoryController.getAllCategoryData);

module.exports = router;

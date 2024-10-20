const router = require("express").Router();
const productController = require("../controllers/productController");

router.post("/add", productController.addNewProduct);
router.get("/name/:name", productController.searchProductByName);
router.get("/id/:id", productController.searchProductById);
router.get("/published/all", productController.searchAllPublishedProduct);
router.get("/all", productController.searchAllProduct);
router.post("/token", productController.getTokenUniPlay)
router.post("/voucher/", productController.getVoucherUniplay)
router.post("/games/", productController.getDTUUniplay)

module.exports = router

const router = require("express").Router();
const unitController = require("../controllers/unitController");

router.post("/add", unitController.addNewUnit);
router.get("/unit/:unit_name", unitController.searchUnitByName);
router.get("/id/:id", unitController.searchUnitById);
router.get("/all", unitController.getAllUnitData);

module.exports = router;

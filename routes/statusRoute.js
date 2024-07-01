const router = require("express").Router();
const statusController = require("../controllers/statusController");

router.post("/add", statusController.addNewStatus);
router.get("/status/:name", statusController.searchStatusByName);
router.get("/id/:id", statusController.searchStatusById);
router.get("/all", statusController.getAllStatusData);

module.exports = router;

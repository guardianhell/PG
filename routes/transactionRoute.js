const router = require("express").Router();
const transactionController = require("../controllers/transactionController");

router.post("/create", transactionController.createNewTransaction);
router.get("/", async function (req, res) {
  return res.send("HAI");
});

module.exports = router;

const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const imageOptimizer = require("../middleware/image-opti"); // Ensure the path is correct

const bookCtrl = require("../controllers/books");

router.get("/bestrating", bookCtrl.getBestRatedBook);
router.get("/:id", bookCtrl.getOneBook);
router.get("/", bookCtrl.getAllBooks);
router.post("/:id/rating", auth, bookCtrl.rateBook);
router.post("/", auth, multer, imageOptimizer, bookCtrl.createBook);
router.put("/:id", auth, multer, imageOptimizer, bookCtrl.modifyBook);
router.delete("/:id", auth, bookCtrl.deleteBook);

module.exports = router;

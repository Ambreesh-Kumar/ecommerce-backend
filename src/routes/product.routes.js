import express from "express"
import { auth } from "../middlewares/auth.js"
import { authorize } from "../middlewares/role.js"
import { ROLES } from "../constants/roles.js"
import { createProduct } from "../controllers/product.controller.js"
import { upload } from "../middlewares/multer.js"

const router = express.Router();

router.use(auth, authorize(ROLES.ADMIN));
// protected routes for admin
router.post("/", upload.array("images", 10) , createProduct)

export default router
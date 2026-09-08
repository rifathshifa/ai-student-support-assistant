import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studentSupportRouter from "./studentSupport";

const router: IRouter = Router();

router.use(healthRouter);
router.use(studentSupportRouter);

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import exampleRouter from "./example";

const router: IRouter = Router();

router.use(healthRouter);
router.use(exampleRouter);

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import schoolsRouter from "./schools";
import postsRouter from "./posts";
import commentsRouter from "./comments";
import reportsRouter from "./reports";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(schoolsRouter);
router.use(postsRouter);
router.use(commentsRouter);
router.use(reportsRouter);
router.use(adminRouter);

export default router;

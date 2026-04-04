import { Router, type IRouter } from "express";
import healthRouter          from "./health.js";
import meRouter              from "./me.js";
import lessonsRouter         from "./lessons.js";
import progressRouter        from "./progress.js";
import webhookRouter         from "./webhook.js";
import adminRouter           from "./admin.js";
import streakRouter          from "./streak.js";
import flashcardPositionRouter from "./flashcard-position.js";
import referralRouter        from "./referral.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(lessonsRouter);
router.use(progressRouter);
router.use(webhookRouter);
router.use(adminRouter);
router.use(streakRouter);
router.use(flashcardPositionRouter);
router.use(referralRouter);

export default router;

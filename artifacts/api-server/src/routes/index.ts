import { Router, type IRouter } from "express";
import healthRouter          from "./health.js";
import meRouter              from "./me.js";
import billingRouter         from "./billing.js";
import lessonsRouter         from "./lessons.js";
import progressRouter        from "./progress.js";
import webhookRouter         from "./webhook.js";
import adminRouter           from "./admin.js";
import streakRouter          from "./streak.js";
import flashcardPositionRouter from "./flashcard-position.js";
import referralRouter        from "./referral.js";
import themesRouter          from "./themes.js";
import brandingRouter        from "./branding.js";
import onboardingRouter      from "./onboarding.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(billingRouter);
router.use(lessonsRouter);
router.use(progressRouter);
router.use(webhookRouter);
router.use(streakRouter);
router.use(flashcardPositionRouter);
router.use(referralRouter);
router.use(themesRouter);
// branding must come before adminRouter — admin router has a blanket requireAuth
// middleware that intercepts all requests passing through it, including public ones
router.use(brandingRouter);
router.use(onboardingRouter);
router.use(adminRouter);

export default router;

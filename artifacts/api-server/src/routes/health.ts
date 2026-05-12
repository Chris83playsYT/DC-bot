import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// UptimeRobot ping endpoint — point your monitor here for 24/7 uptime
router.get("/ping", (_req, res) => {
  res.json({
    status: "alive",
    service: "Weird Guy Bot",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;

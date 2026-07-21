import { Router, type Request, type Response } from "express";
import { v4 as uuid } from "uuid";
import { runPipeline } from "./pipeline.js";
import type { ScanJob, ScanStage } from "./types.js";
import { STAGE_MESSAGES, STAGE_PROGRESS } from "./types.js";

const router = Router();

// In-memory store for scan jobs
const jobs = new Map<string, ScanJob>();

// POST /api/scan — start a scan
router.post("/scan", (req: Request, res: Response) => {
  const { repoUrl } = req.body;

  if (!repoUrl || typeof repoUrl !== "string") {
    res.status(400).json({ error: "Missing repoUrl in request body." });
    return;
  }

  // Validate GitHub URL
  const githubMatch = repoUrl.match(
    /^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/,
  );
  if (!githubMatch) {
    res.status(400).json({ error: "Only github.com URLs are supported." });
    return;
  }

  const scanId = uuid();
  const job: ScanJob = {
    scanId,
    repoUrl,
    repoName: `${githubMatch[1]}/${githubMatch[2]}`,
    status: { stage: "cloning", message: STAGE_MESSAGES.cloning, progress: STAGE_PROGRESS.cloning },
    result: null,
    error: null,
    startTime: Date.now(),
    tempDir: "",
  };

  jobs.set(scanId, job);

  // Run pipeline asynchronously (don't block response)
  runPipelineAsync(scanId, repoUrl, job);

  res.json({ scanId });
});

// GET /api/scan/:scanId/status
router.get("/scan/:scanId/status", (req: Request, res: Response) => {
  const scanId = req.params.scanId as string;
  const job = jobs.get(scanId);

  if (!job) {
    res.status(404).json({ error: "Scan not found." });
    return;
  }

  if (job.error) {
    res.json({ status: "error", errorMessage: job.error, stage: "error", message: job.error, progress: 0 });
    return;
  }

  res.json({
    status: job.status.stage === "done" ? "done" : "running",
    stage: job.status.stage,
    message: job.status.message,
    progress: job.status.progress,
  });
});

// GET /api/scan/:scanId/result
router.get("/scan/:scanId/result", (req: Request, res: Response) => {
  const scanId = req.params.scanId as string;
  const job = jobs.get(scanId);

  if (!job) {
    res.status(404).json({ error: "Scan not found." });
    return;
  }

  if (job.error) {
    res.status(422).json({ error: job.error });
    return;
  }

  if (!job.result) {
    res.status(425).json({ error: "Scan still in progress." });
    return;
  }

  res.json(job.result);
});

// GET /api/scan/:scanId/events — SSE endpoint for real-time status
router.get("/scan/:scanId/events", (req: Request, res: Response) => {
  const scanId = req.params.scanId as string;
  const job = jobs.get(scanId);

  if (!job) {
    res.status(404).json({ error: "Scan not found." });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // If already done, send final event immediately
  if (job.result || job.error) {
    const data = job.result
      ? { stage: "done", message: STAGE_MESSAGES.done, progress: 1 }
      : { stage: "error", message: job.error, progress: 0 };
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    res.end();
    return;
  }

  // Poll for status changes
  let lastStage = "";
  const interval = setInterval(() => {
    const current = jobs.get(scanId);
    if (!current) {
      clearInterval(interval);
      res.end();
      return;
    }

    if (current.status.stage !== lastStage) {
      lastStage = current.status.stage;
      const data = current.result
        ? { stage: "done", message: STAGE_MESSAGES.done, progress: 1 }
        : { stage: current.status.stage, message: current.status.message, progress: current.status.progress };
      res.write(`data: ${JSON.stringify(data)}\n\n`);

      if (current.status.stage === "done" || current.error) {
        clearInterval(interval);
        res.end();
      }
    }
  }, 200);

  req.on("close", () => {
    clearInterval(interval);
  });
});

async function runPipelineAsync(scanId: string, repoUrl: string, job: ScanJob) {
  try {
    const result = await runPipeline(repoUrl, (stage: ScanStage) => {
      const current = jobs.get(scanId);
      if (current) {
        current.status = {
          stage,
          message: STAGE_MESSAGES[stage],
          progress: STAGE_PROGRESS[stage],
        };
      }
    });

    const current = jobs.get(scanId);
    if (current) {
      current.result = result;
      current.status = {
        stage: "done",
        message: STAGE_MESSAGES.done,
        progress: STAGE_PROGRESS.done,
      };
    }
  } catch (err: unknown) {
    const current = jobs.get(scanId);
    if (current) {
      current.error = err instanceof Error ? err.message : "An unexpected error occurred.";
      current.status = {
        stage: "error",
        message: current.error,
        progress: 0,
      };
    }
  }
}

export default router;

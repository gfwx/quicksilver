import { Router, Request, Response } from "express";
// import { authMiddleware } from "../lib/middleware";
import dotenv from "dotenv";

dotenv.config();
const FASTAPI_ENDPOINT =
  process.env.FASTAPI_ENDPOINT || "http://127.0.0.1:8000";
const router = Router();

// add this after auth is setup and working --
// router.post('/', authMiddleware, async (req : Request, res : Response, next : NextFunction) => {
router.post("/", async (req: Request, res: Response) => {
  try {
    const { query, model } = req.body;
    if (!query || !model) {
      res
        .status(400)
        .json({ error: "Missing query or model", query: query, model: model });
      return;
    }

    const requestBody = {
      query: query as string,
      model: model as string,
    };

    const aiResponse = await fetch(`${FASTAPI_ENDPOINT}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!aiResponse || !aiResponse.body) {
      res.status(500).json({ error: "FastAPI AI service error" });
      return;
    }

    if (!aiResponse.ok) {
      res.status(aiResponse.status).json({ error: "FastAPI AI service error" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = aiResponse.body.getReader();

    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            break;
          }
          res.write(value);
        }
      } catch (error) {
        console.error("Error during streaming:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Streaming error" });
        }
        res.end();
      }
    };

    pump();
  } catch (error) {
    console.error("Error while streaming from FastAPI:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
    res.end();
  }
});

export default router;

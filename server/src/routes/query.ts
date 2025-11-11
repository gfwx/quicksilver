import { Router, Request, Response } from "express";
// import { authMiddleware } from "../lib/middleware";
import dotenv from "dotenv";
import { authMiddleware } from "../lib/middleware";

dotenv.config();
const FASTAPI_ENDPOINT =
  process.env.FASTAPI_ENDPOINT || "http://127.0.0.1:8000";
const router = Router();

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { query, project_id } = req.body;
    if (!query) {
      res.status(400).json({ error: "Missing / empty query" });
      return;
    }

    if (!project_id) {
      res.status(400).json({ error: "Missing / empty project id." });
      return;
    }

    const aiResponse = await fetch(`${FASTAPI_ENDPOINT}/api/vector`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query as string,
        project_id: project_id as string,
      }),
    });

    let topHits: string[] = [];
    if (!aiResponse.ok) {
      console.error(
        `Vector search failed with status ${aiResponse.status}:`,
        await aiResponse.text(),
      );
    } else {
      const data = await aiResponse.json();
      topHits = data.text || [];
    }

    res.status(200).json({ topHits });
  } catch (e) {
    res.status(500).json({ e });
  }
});

export default router;

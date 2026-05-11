import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { AppError } from "../middlewares/errorHandler";

const router: IRouter = Router();

const CreateItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const items: Array<{ id: number; name: string; description?: string }> = [];
let nextId = 1;

router.get("/items", (_req: Request, res: Response) => {
  res.json(items);
});

router.get("/items/:id", (req: Request, res: Response) => {
  const item = items.find((i) => i.id === Number(req.params["id"]));
  if (!item) throw new AppError(404, "Item not found");
  res.json(item);
});

router.post("/items", (req: Request, res: Response) => {
  const body = CreateItemSchema.parse(req.body);
  const item = { id: nextId++, ...body };
  items.push(item);
  res.status(201).json(item);
});

router.delete("/items/:id", (req: Request, res: Response) => {
  const idx = items.findIndex((i) => i.id === Number(req.params["id"]));
  if (idx === -1) throw new AppError(404, "Item not found");
  items.splice(idx, 1);
  res.status(204).send();
});

export default router;

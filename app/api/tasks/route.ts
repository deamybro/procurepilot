import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/src/api/response";
import { assertMutationRequest } from "@/src/api/security";
import { serverTasks } from "@/src/tasks/server-store";

const CreateTaskSchema = z.object({
  goal: z.string().min(10).max(4_000),
  budget: z.string().regex(/^\d+(\.\d{1,6})?$/),
  token: z.literal("USDC"),
});

export async function GET() {
  return apiSuccess(serverTasks.list());
}

export async function POST(request: NextRequest) {
  try {
    assertMutationRequest(request);
    const body = CreateTaskSchema.parse(await request.json());
    const task = {
      taskId: `task_${randomUUID().slice(0, 10)}`,
      ...body,
      state: "DRAFT" as const,
      plan: null,
      approvalHash: null,
      createdAt: new Date().toISOString(),
    };
    serverTasks.put(task);
    return apiSuccess(task, 201);
  } catch (error) {
    return apiError(
      "TASK_CREATE_FAILED",
      error instanceof Error ? error.message : "Task creation failed.",
    );
  }
}

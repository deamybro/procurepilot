import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/src/api/response";
import { assertMutationRequest } from "@/src/api/security";
import { transitionTask } from "@/src/domain/state-machine";
import { serverTasks } from "@/src/tasks/server-store";

const BodySchema = z.object({ approvalHash: z.string().startsWith("0x") });

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    assertMutationRequest(request);
    const body = BodySchema.parse(await request.json());
    const { taskId } = await context.params;
    const task = serverTasks.get(taskId);
    if (!task) return apiError("TASK_NOT_FOUND", "Task was not found.", 404);
    task.state = transitionTask(task.state, "APPROVED");
    task.approvalHash = body.approvalHash;
    serverTasks.put(task);
    return apiSuccess(task);
  } catch (error) {
    return apiError(
      "APPROVAL_FAILED",
      error instanceof Error ? error.message : "Approval failed.",
    );
  }
}

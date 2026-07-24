import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/src/api/response";
import { assertMutationRequest } from "@/src/api/security";
import { transitionTask } from "@/src/domain/state-machine";
import { serverTasks } from "@/src/tasks/server-store";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    assertMutationRequest(request);
    await request.json();
    const { taskId } = await context.params;
    const task = serverTasks.get(taskId);
    if (!task) return apiError("TASK_NOT_FOUND", "Task was not found.", 404);
    task.state = transitionTask(task.state, "CANCELLED");
    serverTasks.put(task);
    return apiSuccess(task);
  } catch (error) {
    return apiError(
      "CANCEL_FAILED",
      error instanceof Error ? error.message : "Cancellation failed.",
    );
  }
}

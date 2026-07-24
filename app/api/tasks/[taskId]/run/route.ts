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
    if (task.state !== "APPROVED") {
      return apiError(
        "APPROVAL_REQUIRED",
        "The task must be approved before it can run.",
      );
    }
    const states = [
      "PAYMENT_CREATING",
      "PAYMENT_AUTHORIZING",
      "PAYMENT_TRANSFERRING",
      "PROVIDER_WORKING",
      "VALIDATING_OUTPUT",
      "AGGREGATING",
      "COMPLETED",
    ] as const;
    for (const state of states) task.state = transitionTask(task.state, state);
    serverTasks.put(task);
    return apiSuccess({
      ...task,
      simulated: true,
      transactionHashes: [],
      note: "Demo mode never broadcasts.",
    });
  } catch (error) {
    return apiError(
      "TASK_RUN_FAILED",
      error instanceof Error ? error.message : "Task execution failed.",
    );
  }
}

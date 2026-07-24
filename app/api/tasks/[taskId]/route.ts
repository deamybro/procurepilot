import { apiError, apiSuccess } from "@/src/api/response";
import { serverTasks } from "@/src/tasks/server-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await context.params;
  const task = serverTasks.get(taskId);
  return task
    ? apiSuccess(task)
    : apiError("TASK_NOT_FOUND", "Task was not found.", 404, false);
}

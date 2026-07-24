import "server-only";
import type { ProcurementPlan, TaskState } from "@/src/domain/models";

export interface ServerTask {
  taskId: string;
  goal: string;
  budget: string;
  token: string;
  state: TaskState;
  plan: ProcurementPlan | null;
  approvalHash: string | null;
  createdAt: string;
}

const tasks = new Map<string, ServerTask>();

export const serverTasks = {
  list: () => [...tasks.values()],
  get: (id: string) => tasks.get(id),
  put: (task: ServerTask) => tasks.set(task.taskId, task),
};

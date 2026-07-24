import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { InMemoryRepository } from "@/src/domain/repositories";
import { ProcurePilotDexie } from "@/src/storage/dexie";

describe("repository adapters", () => {
  const dbNames: string[] = [];

  afterEach(async () => {
    for (const name of dbNames.splice(0)) {
      await new ProcurePilotDexie(name).delete();
    }
  });

  it("stores isolated server-test data in memory", async () => {
    const repository = new InMemoryRepository<Record<string, unknown>>();
    await repository.put("task_1", { state: "DRAFT" });
    expect(await repository.get("task_1")).toEqual({ state: "DRAFT" });
    await repository.clear();
    expect(await repository.list()).toEqual([]);
  });

  it("exports, imports and clears IndexedDB demo data", async () => {
    const name = `procurepilot-test-${Date.now()}`;
    dbNames.push(name);
    const db = new ProcurePilotDexie(name);
    await db.records.put({
      id: "task_1",
      kind: "task",
      value: { state: "COMPLETED" },
      updatedAt: new Date().toISOString(),
    });
    const exported = await db.exportAll();
    expect(exported).toHaveLength(1);
    await db.reset();
    expect(await db.exportAll()).toHaveLength(0);
    await db.importAll(exported);
    expect((await db.exportAll())[0].value.state).toBe("COMPLETED");
  });
});

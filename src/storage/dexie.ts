import Dexie, { type EntityTable } from "dexie";

export interface LocalRecord {
  id: string;
  kind: string;
  value: Record<string, unknown>;
  updatedAt: string;
}

export class ProcurePilotDexie extends Dexie {
  records!: EntityTable<LocalRecord, "id">;

  constructor(name = "procurepilot-demo") {
    super(name);
    this.version(1).stores({
      records: "id, kind, updatedAt",
    });
  }

  async exportAll(): Promise<LocalRecord[]> {
    return this.records.toArray();
  }

  async importAll(records: LocalRecord[]): Promise<void> {
    await this.transaction("rw", this.records, async () => {
      await this.records.clear();
      await this.records.bulkPut(records);
    });
  }

  async reset(): Promise<void> {
    await this.records.clear();
  }
}

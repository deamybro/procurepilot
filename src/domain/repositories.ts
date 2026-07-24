export interface Repository<T extends { [key: string]: unknown }> {
  get(id: string): Promise<T | undefined>;
  list(): Promise<T[]>;
  put(id: string, value: T): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

export class InMemoryRepository<T extends { [key: string]: unknown }>
  implements Repository<T>
{
  private readonly records = new Map<string, T>();

  async get(id: string): Promise<T | undefined> {
    return this.records.get(id);
  }

  async list(): Promise<T[]> {
    return [...this.records.values()];
  }

  async put(id: string, value: T): Promise<void> {
    this.records.set(id, structuredClone(value));
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }

  async clear(): Promise<void> {
    this.records.clear();
  }
}

export interface ProcurePilotRepositories {
  tasks: Repository<Record<string, unknown>>;
  plans: Repository<Record<string, unknown>>;
  providers: Repository<Record<string, unknown>>;
  quotes: Repository<Record<string, unknown>>;
  payments: Repository<Record<string, unknown>>;
  providerJobs: Repository<Record<string, unknown>>;
  auditEvents: Repository<Record<string, unknown>>;
  policies: Repository<Record<string, unknown>>;
  feedback: Repository<Record<string, unknown>>;
}

export function createInMemoryRepositories(): ProcurePilotRepositories {
  return {
    tasks: new InMemoryRepository(),
    plans: new InMemoryRepository(),
    providers: new InMemoryRepository(),
    quotes: new InMemoryRepository(),
    payments: new InMemoryRepository(),
    providerJobs: new InMemoryRepository(),
    auditEvents: new InMemoryRepository(),
    policies: new InMemoryRepository(),
    feedback: new InMemoryRepository(),
  };
}

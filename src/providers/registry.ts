import type { Provider } from "@/src/domain/models";
import { ProviderSchema } from "@/src/domain/models";
import { BUILT_IN_PROVIDERS } from "./seeds";

export interface ProviderRegistry {
  list(): Promise<Provider[]>;
  get(providerId: string): Promise<Provider | undefined>;
  discover(capability: string): Promise<Provider[]>;
  addLocal(provider: Provider): Promise<void>;
}

export class LocalProviderRegistry implements ProviderRegistry {
  private readonly providers = new Map<string, Provider>();

  constructor(seed: Provider[] = BUILT_IN_PROVIDERS) {
    for (const provider of seed) {
      const parsed = ProviderSchema.parse(provider);
      this.providers.set(parsed.providerId, parsed);
    }
  }

  async list(): Promise<Provider[]> {
    return [...this.providers.values()].filter((provider) => provider.active);
  }

  async get(providerId: string): Promise<Provider | undefined> {
    return this.providers.get(providerId);
  }

  async discover(capability: string): Promise<Provider[]> {
    const target = capability.toLowerCase();
    return (await this.list()).filter((provider) =>
      provider.capabilities.some(
        (value) =>
          value.toLowerCase().includes(target) ||
          target.includes(value.toLowerCase()),
      ),
    );
  }

  async addLocal(provider: Provider): Promise<void> {
    const parsed = ProviderSchema.parse({
      ...provider,
      source: "LOCAL",
      verificationStatus: "LOCAL_PROFILE",
      erc8004AgentId: null,
      erc8004Registry: null,
    });
    this.providers.set(parsed.providerId, parsed);
  }
}

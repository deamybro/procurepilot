import type { Provider, ProviderScore } from "./models";
import { toAtomic } from "./money";

export interface RankingWeights {
  capability: number;
  price: number;
  reputation: number;
  reliability: number;
  speed: number;
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  capability: 0.35,
  price: 0.2,
  reputation: 0.2,
  reliability: 0.15,
  speed: 0.1,
};

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function capabilityScore(
  provider: Provider,
  requiredCapability: string,
): number {
  const target = requiredCapability.toLowerCase();
  if (provider.capabilities.some((value) => value.toLowerCase() === target)) {
    return 100;
  }
  if (
    provider.capabilities.some(
      (value) =>
        value.toLowerCase().includes(target) ||
        target.includes(value.toLowerCase()),
    )
  ) {
    return 80;
  }
  return 0;
}

export function rankProviders(
  providers: Provider[],
  capability: string,
  token: string,
  chain: string,
  weights: RankingWeights = DEFAULT_RANKING_WEIGHTS,
): ProviderScore[] {
  const eligible = providers.filter(
    (provider) =>
      provider.active &&
      provider.supportedTokens.includes(token) &&
      provider.supportedChains.includes(chain) &&
      capabilityScore(provider, capability) > 0,
  );
  const maxPrice = eligible.reduce(
    (max, provider) =>
      toAtomic(provider.basePrice) > max ? toAtomic(provider.basePrice) : max,
    0n,
  );
  const maxSpeed = eligible.reduce(
    (max, provider) =>
      provider.averageCompletionTime > max
        ? provider.averageCompletionTime
        : max,
    1,
  );

  return eligible
    .map((provider) => {
      const capabilityMatch = capabilityScore(provider, capability);
      const priceScore =
        maxPrice === 0n
          ? 100
          : Number(
              ((maxPrice - toAtomic(provider.basePrice)) * 70n) / maxPrice +
                30n,
            );
      const reputationScore = provider.averageRating * 20;
      const totalJobs = provider.completedJobs + provider.failedJobs;
      const reliabilityScore =
        totalJobs === 0 ? 50 : (provider.completedJobs / totalJobs) * 100;
      const speedScore =
        100 - (provider.averageCompletionTime / maxSpeed) * 60;
      const finalScore =
        capabilityMatch * weights.capability +
        priceScore * weights.price +
        reputationScore * weights.reputation +
        reliabilityScore * weights.reliability +
        speedScore * weights.speed;
      return {
        providerId: provider.providerId,
        capabilityMatch: round(capabilityMatch),
        priceScore: round(priceScore),
        reputationScore: round(reputationScore),
        reliabilityScore: round(reliabilityScore),
        speedScore: round(speedScore),
        finalScore: round(finalScore),
        reasons: [
          `${capabilityMatch}% capability match`,
          `${provider.basePrice} ${token} quoted`,
          `${provider.averageRating.toFixed(1)}/5 reputation`,
          `${round(reliabilityScore)}% completion reliability`,
          `~${provider.averageCompletionTime}s demo completion`,
        ],
      };
    })
    .sort(
      (a, b) =>
        b.finalScore - a.finalScore ||
        a.providerId.localeCompare(b.providerId),
    );
}

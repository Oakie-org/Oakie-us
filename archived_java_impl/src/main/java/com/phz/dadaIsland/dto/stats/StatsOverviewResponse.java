package com.phz.dadaIsland.dto.stats;

import java.time.Instant;

/**
 * Aggregated landing metrics surfaced via {@code /stats/overview}.
 *
 * @param activeProjects number of projects currently recruiting or building
 * @param creators distinct creators who have published at least one project
 * @param successfulLaunches number of completed projects
 * @param generatedAt timestamp when this snapshot was produced
 */
public record StatsOverviewResponse(long activeProjects,
									long creators,
									long successfulLaunches,
									Instant generatedAt) {
}

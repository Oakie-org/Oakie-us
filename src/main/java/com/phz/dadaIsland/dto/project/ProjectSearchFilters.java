package com.phz.dadaIsland.dto.project;

import java.util.List;

import com.phz.dadaIsland.domain.enums.ProjectStatus;

/**
 * Filter set powering the discovery feed search.
 */
public record ProjectSearchFilters(
		String keyword,
		String city,
		String school,
		String stage,
		ProjectStatus status,
		List<Long> tagIds,
		List<Long> skillTagIds,
		Boolean remoteOnly,
		ProjectSortOption sortOption) {
}

package com.phz.dadaIsland.dto.project;

import java.time.LocalDateTime;
import java.util.Set;

import com.phz.dadaIsland.domain.enums.ProjectStatus;
import com.phz.dadaIsland.domain.enums.ProjectVisibility;

public record ProjectSummary(
		Long id,
		String slug,
		String title,
		String summary,
		ProjectVisibility visibility,
		ProjectStatus status,
		String city,
		String school,
		String stage,
		LocalDateTime updatedAt,
		Set<String> tags) {
}

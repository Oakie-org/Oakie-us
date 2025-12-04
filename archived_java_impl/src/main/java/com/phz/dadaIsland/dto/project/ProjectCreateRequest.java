package com.phz.dadaIsland.dto.project;

import java.util.Set;

public record ProjectCreateRequest(
		String title,
		String summary,
		String description,
		String city,
		String school,
		Set<Long> requiredSkillTagIds,
		Set<Long> tagIds) {
}

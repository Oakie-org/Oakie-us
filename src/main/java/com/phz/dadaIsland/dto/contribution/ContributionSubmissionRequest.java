package com.phz.dadaIsland.dto.contribution;

import com.phz.dadaIsland.domain.enums.ArtifactType;

public record ContributionSubmissionRequest(
		Long projectId,
		String title,
		String artifactUrl,
		ArtifactType artifactType,
		String summary) {
}

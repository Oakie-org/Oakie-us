package com.phz.dadaIsland.domain.model;

import java.time.LocalDateTime;

import com.phz.dadaIsland.domain.enums.ArtifactType;
import com.phz.dadaIsland.domain.enums.ContributionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contribution {

	private Long id;
	private Long projectId;
	private Long contributorId;
	private String title;
	private String artifactUrl;
	private ArtifactType artifactType;
	private String summary;
	private ContributionStatus status;
	private LocalDateTime submittedAt;
	private LocalDateTime updatedAt;
}

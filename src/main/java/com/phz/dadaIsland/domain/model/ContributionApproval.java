package com.phz.dadaIsland.domain.model;

import java.time.LocalDateTime;

import com.phz.dadaIsland.domain.enums.ContributionDecision;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContributionApproval {

	private Long id;
	private Long contributionId;
	private Long reviewerId;
	private ContributionDecision decision;
	private String comment;
	private LocalDateTime decidedAt;
}

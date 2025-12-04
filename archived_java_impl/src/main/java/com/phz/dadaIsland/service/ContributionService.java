package com.phz.dadaIsland.service;

import java.util.List;

import com.phz.dadaIsland.domain.model.Contribution;
import com.phz.dadaIsland.dto.contribution.ContributionSubmissionRequest;

public interface ContributionService {

	void submitContribution(Long userId, ContributionSubmissionRequest request);

	List<Contribution> listProjectContributions(Long projectId);

	Contribution getContribution(Long contributionId);
}

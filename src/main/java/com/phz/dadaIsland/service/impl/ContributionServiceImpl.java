package com.phz.dadaIsland.service.impl;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;

import com.phz.dadaIsland.domain.model.Contribution;
import com.phz.dadaIsland.dto.contribution.ContributionSubmissionRequest;
import com.phz.dadaIsland.service.ContributionService;

@Service
public class ContributionServiceImpl implements ContributionService {

	@Override
	public void submitContribution(Long userId, ContributionSubmissionRequest request) {
		// TODO persist contribution and emit approval workflow events
	}

	@Override
	public List<Contribution> listProjectContributions(Long projectId) {
		// TODO query contributions by project
		return Collections.emptyList();
	}

	@Override
	public Contribution getContribution(Long contributionId) {
		// TODO fetch contribution detail
		return null;
	}
}

package com.phz.dadaIsland.controller;

import java.util.List;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phz.dadaIsland.domain.model.Contribution;
import com.phz.dadaIsland.dto.contribution.ContributionSubmissionRequest;
import com.phz.dadaIsland.service.ContributionService;

@Validated
@RestController
@RequestMapping("/api/contributions")
@RequiredArgsConstructor
public class ContributionController {

	private final ContributionService contributionService;

	@PostMapping
	public ResponseEntity<Void> submitContribution(@RequestBody ContributionSubmissionRequest request) {
		// TODO derive contributor from authentication context
		contributionService.submitContribution(null, request);
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@GetMapping("/project/{projectId}")
	public ResponseEntity<List<Contribution>> listProjectContributions(@PathVariable Long projectId) {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
				.body(contributionService.listProjectContributions(projectId));
	}

	@GetMapping("/{contributionId}")
	public ResponseEntity<Contribution> getContribution(@PathVariable Long contributionId) {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
				.body(contributionService.getContribution(contributionId));
	}
}

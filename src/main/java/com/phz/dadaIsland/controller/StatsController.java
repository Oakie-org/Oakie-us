package com.phz.dadaIsland.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phz.dadaIsland.dto.stats.StatsOverviewResponse;
import com.phz.dadaIsland.service.StatsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

	private final StatsService statsService;

	@GetMapping("/overview")
	public ResponseEntity<StatsOverviewResponse> getOverview() {
		return ResponseEntity.ok(statsService.getOverview());
	}
}

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

import com.phz.dadaIsland.dto.project.ProjectCreateRequest;
import com.phz.dadaIsland.dto.project.ProjectSummary;
import com.phz.dadaIsland.service.ProjectService;

@Validated
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

	private final ProjectService projectService;

	@PostMapping
	public ResponseEntity<Void> createProject(@RequestBody ProjectCreateRequest request) {
		// TODO derive owner from authenticated user context
		projectService.createProject(null, request);
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@GetMapping
	public ResponseEntity<List<ProjectSummary>> listProjects() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(projectService.listProjects());
	}

	@GetMapping("/{projectId}")
	public ResponseEntity<ProjectSummary> getProject(@PathVariable Long projectId) {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(projectService.getProject(projectId));
	}
}

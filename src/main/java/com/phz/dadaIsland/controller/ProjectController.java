package com.phz.dadaIsland.controller;

import java.util.List;
import java.util.Locale;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.phz.dadaIsland.domain.enums.ProjectStatus;
import com.phz.dadaIsland.dto.common.PageRequest;
import com.phz.dadaIsland.dto.common.PageResponse;
import com.phz.dadaIsland.dto.project.ProjectCreateRequest;
import com.phz.dadaIsland.dto.project.ProjectSearchFilters;
import com.phz.dadaIsland.dto.project.ProjectSortOption;
import com.phz.dadaIsland.dto.project.ProjectSummary;
import com.phz.dadaIsland.service.ProjectService;
import com.phz.dadaIsland.util.ListUtils;

import static com.phz.dadaIsland.util.TextUtils.trimToNull;

import org.springframework.web.server.ResponseStatusException;

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
	public ResponseEntity<PageResponse<ProjectSummary>> listProjects(
			@RequestParam(value = "keyword", required = false) String keyword,
			@RequestParam(value = "city", required = false) String city,
			@RequestParam(value = "school", required = false) String school,
			@RequestParam(value = "stage", required = false) String stage,
			@RequestParam(value = "status", required = false) String status,
			@RequestParam(value = "tags", required = false) List<Long> tagIds,
			@RequestParam(value = "skills", required = false) List<Long> skillTagIds,
			@RequestParam(value = "remote_only", required = false) Boolean remoteOnly,
			@RequestParam(value = "sort", required = false) String sort,
			@RequestParam(value = "page", required = false) Integer page,
			@RequestParam(value = "page_size", required = false) Integer pageSize) {
		ProjectStatus projectStatus = parseStatus(status);
		ProjectSortOption sortOption = ProjectSortOption.fromNullable(sort);
		ProjectSearchFilters filters = new ProjectSearchFilters(
				trimToNull(keyword),
				trimToNull(city),
				trimToNull(school),
				trimToNull(stage),
				projectStatus,
				ListUtils.distinctNonNull(tagIds),
				ListUtils.distinctNonNull(skillTagIds),
				remoteOnly,
				sortOption);
		PageRequest pageRequest = PageRequest.of(page, pageSize);
		PageResponse<ProjectSummary> response = projectService.searchProjects(filters, pageRequest);
		return ResponseEntity.ok(response);
	}

	@GetMapping("/{projectId}")
	public ResponseEntity<ProjectSummary> getProject(@PathVariable Long projectId) {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(projectService.getProject(projectId));
	}

	private ProjectStatus parseStatus(String raw) {
		if (raw == null || raw.isBlank()) {
			return null;
		}
		try {
			String normalized = trimToNull(raw);
			if (normalized == null) {
				return null;
			}
			return ProjectStatus.valueOf(normalized.toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status parameter: " + raw);
		}
	}

}

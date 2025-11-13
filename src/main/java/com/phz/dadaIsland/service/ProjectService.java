package com.phz.dadaIsland.service;

import com.phz.dadaIsland.dto.common.PageRequest;
import com.phz.dadaIsland.dto.common.PageResponse;
import com.phz.dadaIsland.dto.project.ProjectCreateRequest;
import com.phz.dadaIsland.dto.project.ProjectSearchFilters;
import com.phz.dadaIsland.dto.project.ProjectSummary;

public interface ProjectService {

	void createProject(Long ownerId, ProjectCreateRequest request);

	PageResponse<ProjectSummary> searchProjects(ProjectSearchFilters filters, PageRequest pageRequest);

	ProjectSummary getProject(Long projectId);
}

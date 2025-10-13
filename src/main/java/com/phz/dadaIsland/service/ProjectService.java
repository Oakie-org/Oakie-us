package com.phz.dadaIsland.service;

import java.util.List;

import com.phz.dadaIsland.dto.project.ProjectCreateRequest;
import com.phz.dadaIsland.dto.project.ProjectSummary;

public interface ProjectService {

	void createProject(Long ownerId, ProjectCreateRequest request);

	List<ProjectSummary> listProjects();

	ProjectSummary getProject(Long projectId);
}

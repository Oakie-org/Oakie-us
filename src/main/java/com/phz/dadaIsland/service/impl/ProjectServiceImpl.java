package com.phz.dadaIsland.service.impl;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;

import com.phz.dadaIsland.dto.project.ProjectCreateRequest;
import com.phz.dadaIsland.dto.project.ProjectSummary;
import com.phz.dadaIsland.service.ProjectService;

@Service
public class ProjectServiceImpl implements ProjectService {

	@Override
	public void createProject(Long ownerId, ProjectCreateRequest request) {
		// TODO persist project and related metadata
	}

	@Override
	public List<ProjectSummary> listProjects() {
		// TODO retrieve projects with pagination and filters
		return Collections.emptyList();
	}

	@Override
	public ProjectSummary getProject(Long projectId) {
		// TODO retrieve project detail
		return null;
	}
}

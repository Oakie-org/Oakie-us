package com.phz.dadaIsland.service.impl;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import com.phz.dadaIsland.domain.model.Project;
import com.phz.dadaIsland.domain.model.ProjectTag;
import com.phz.dadaIsland.domain.model.Tag;
import com.phz.dadaIsland.dto.common.PageRequest;
import com.phz.dadaIsland.dto.common.PageResponse;
import com.phz.dadaIsland.dto.common.PaginationMeta;
import com.phz.dadaIsland.dto.project.ProjectCreateRequest;
import com.phz.dadaIsland.dto.project.ProjectSearchCriteria;
import com.phz.dadaIsland.dto.project.ProjectSearchFilters;
import com.phz.dadaIsland.dto.project.ProjectSortOption;
import com.phz.dadaIsland.dto.project.ProjectSummary;
import com.phz.dadaIsland.exception.BusinessException;
import com.phz.dadaIsland.mapper.ProjectMapper;
import com.phz.dadaIsland.mapper.ProjectTagMapper;
import com.phz.dadaIsland.mapper.TagMapper;
import com.phz.dadaIsland.service.ProjectService;
import com.phz.dadaIsland.util.ListUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import static com.phz.dadaIsland.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectServiceImpl implements ProjectService {

	private final ProjectMapper projectMapper;
	private final ProjectTagMapper projectTagMapper;
	private final TagMapper tagMapper;

	/**
	 * Validates the incoming payload and fails fast because persistence is not yet implemented.
	 */
	@Override
	public void createProject(Long ownerId, ProjectCreateRequest request) {
		if (ownerId == null) {
			throw new BusinessException("Project owner is required");
		}
		if (request == null) {
			throw new BusinessException("Project payload cannot be null");
		}
		String title = trimToNull(request.title());
		if (title == null) {
			throw new BusinessException("Project title is required");
		}
		log.info("Project creation invoked by owner {} for title '{}'; feature not yet implemented", ownerId, title);
		throw new BusinessException("Project creation is not available yet");
	}

	/**
	 * Queries projects matching the supplied filters and wraps database results into a paged DTO.
	 */
	@Override
	@Transactional(readOnly = true)
	public PageResponse<ProjectSummary> searchProjects(ProjectSearchFilters filters, PageRequest pageRequest) {
		if (pageRequest == null) {
			throw new BusinessException("Pagination parameters are required");
		}
		log.debug("Searching projects with filters {} and page {}", filters, pageRequest);
		ProjectSearchCriteria criteria = buildCriteria(filters, pageRequest);
		long total = projectMapper.countByCriteria(criteria);
		if (total == 0) {
			log.debug("Project search returned no results for criteria {}", criteria);
			return PageResponse.empty(pageRequest);
		}
		List<Project> projects = projectMapper.searchByCriteria(criteria);
		log.debug("Project search resolved {} results (pageSize={}, total={})", projects.size(), pageRequest.pageSize(), total);
		return assembleSummaries(projects, pageRequest, total);
	}

	/**
	 * Loads a single project with its tag labels or raises an exception when the id is invalid.
	 */
	@Override
	@Transactional(readOnly = true)
	public ProjectSummary getProject(Long projectId) {
		if (projectId == null || projectId <= 0) {
			throw new BusinessException("Project id is required");
		}
		log.debug("Fetching project detail for id {}", projectId);
		Project project = projectMapper.findById(projectId)
				.orElseThrow(() -> {
					log.warn("Project {} not found", projectId);
					return new BusinessException("Project not found");
				});
		Map<Long, Set<String>> tagsByProject = resolveTagLabels(List.of(project));
		Set<String> tags = tagsByProject.getOrDefault(project.getId(), Collections.emptySet());
		return toSummary(project, tags);
	}

	/**
	 * Builds the MyBatis criteria object used by both count/search queries from the external filters.
	 */
	private ProjectSearchCriteria buildCriteria(ProjectSearchFilters filters, PageRequest pageRequest) {
		ProjectSearchFilters safeFilters = filters != null ? filters : new ProjectSearchFilters(null, null, null, null,
				null, null, null, null, null);
		List<Long> tagIds = ListUtils.distinctNonNull(safeFilters.tagIds());
		List<Long> skillTagIds = ListUtils.distinctNonNull(safeFilters.skillTagIds());
		ProjectSortOption sort = safeFilters.sortOption() != null ? safeFilters.sortOption() : ProjectSortOption.RECENT;
		return ProjectSearchCriteria.builder()
				.keyword(trimToNull(safeFilters.keyword()))
				.city(trimToNull(safeFilters.city()))
				.school(trimToNull(safeFilters.school()))
				.stage(trimToNull(safeFilters.stage()))
				.status(safeFilters.status())
				.tagIds(tagIds)
				.skillTagIds(skillTagIds)
				.remoteOnly(Boolean.TRUE.equals(safeFilters.remoteOnly()))
				.offset(pageRequest.offset())
				.pageSize(pageRequest.pageSize())
				.sort(sort)
				.build();
	}

	/**
	 * Creates the page response by expanding domain projects into DTOs and attaching pagination metadata.
	 */
	private PageResponse<ProjectSummary> assembleSummaries(List<Project> projects, PageRequest pageRequest, long total) {
		Map<Long, Set<String>> projectTags = resolveTagLabels(projects);
		List<ProjectSummary> summaries = projects.stream()
				.map(project -> toSummary(project, projectTags.getOrDefault(project.getId(), Collections.emptySet())))
				.toList();
		return new PageResponse<>(summaries, PaginationMeta.of(pageRequest, total));
	}

	/**
	 * Loads tags for the provided projects using a batched mapper query and groups labels per project id.
	 */
	private Map<Long, Set<String>> resolveTagLabels(List<Project> projects) {
		if (CollectionUtils.isEmpty(projects)) {
			return Collections.emptyMap();
		}
		List<Long> projectIds = projects.stream()
				.map(Project::getId)
				.filter(Objects::nonNull)
				.toList();
		if (projectIds.isEmpty()) {
			return Collections.emptyMap();
		}
		List<ProjectTag> mappings = projectTagMapper.findByProjectIds(projectIds);
		if (CollectionUtils.isEmpty(mappings)) {
			return Collections.emptyMap();
		}
		Set<Long> tagIds = mappings.stream()
				.map(ProjectTag::getTagId)
				.filter(Objects::nonNull)
				.collect(Collectors.toCollection(LinkedHashSet::new));
		if (tagIds.isEmpty()) {
			return Collections.emptyMap();
		}
		List<Tag> tags = tagMapper.findByIds(tagIds.stream().toList());
		Map<Long, String> labelById = tags.stream()
				.filter(tag -> tag.getId() != null)
				.collect(Collectors.toMap(Tag::getId, Tag::getLabel, (left, right) -> left, LinkedHashMap::new));
		Map<Long, Set<String>> result = new LinkedHashMap<>();
		for (ProjectTag mapping : mappings) {
			if (mapping.getProjectId() == null || mapping.getTagId() == null) {
				continue;
			}
			String label = labelById.get(mapping.getTagId());
			if (label == null) {
				continue;
			}
			result.computeIfAbsent(mapping.getProjectId(), ignored -> new LinkedHashSet<>()).add(label);
		}
		return result;
	}

	private ProjectSummary toSummary(Project project, Set<String> tags) {
		return new ProjectSummary(
				project.getId(),
				project.getSlug(),
				project.getTitle(),
				project.getSummary(),
				project.getVisibility(),
				project.getStatus(),
				project.getCity(),
				project.getSchool(),
				project.getProgressState(),
				project.getUpdatedAt(),
				tags == null ? Collections.emptySet() : tags);
	}

}

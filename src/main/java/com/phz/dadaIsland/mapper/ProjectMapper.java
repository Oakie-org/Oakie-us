package com.phz.dadaIsland.mapper;

import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.phz.dadaIsland.domain.model.Project;
import com.phz.dadaIsland.dto.project.ProjectSearchCriteria;

@Mapper
public interface ProjectMapper {

	void insert(Project project);

	Optional<Project> findById(@Param("id") Long id);

	Optional<Project> findBySlug(@Param("slug") String slug);

	List<Project> findAll();

	void update(Project project);

	List<Project> searchByCriteria(ProjectSearchCriteria criteria);

	long countByCriteria(ProjectSearchCriteria criteria);
}

package com.phz.dadaIsland.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.phz.dadaIsland.domain.model.ProjectSkillRequirement;

@Mapper
public interface ProjectSkillRequirementMapper {

	void insert(ProjectSkillRequirement requirement);

	void deleteByProjectId(@Param("projectId") Long projectId);

	List<ProjectSkillRequirement> findByProjectId(@Param("projectId") Long projectId);
}

package com.phz.dadaIsland.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.phz.dadaIsland.domain.model.ProjectTag;

@Mapper
public interface ProjectTagMapper {

	void insert(ProjectTag projectTag);

	void deleteByProjectId(@Param("projectId") Long projectId);

	List<ProjectTag> findByProjectId(@Param("projectId") Long projectId);

	List<ProjectTag> findByProjectIds(@Param("projectIds") List<Long> projectIds);
}

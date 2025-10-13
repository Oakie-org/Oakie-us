package com.phz.dadaIsland.mapper;

import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.phz.dadaIsland.domain.model.ProjectMember;

@Mapper
public interface ProjectMemberMapper {

	void insert(ProjectMember member);

	void update(ProjectMember member);

	Optional<ProjectMember> findMember(@Param("projectId") Long projectId, @Param("userId") Long userId);

	List<ProjectMember> findByProjectId(@Param("projectId") Long projectId);

	List<ProjectMember> findByUserId(@Param("userId") Long userId);
}

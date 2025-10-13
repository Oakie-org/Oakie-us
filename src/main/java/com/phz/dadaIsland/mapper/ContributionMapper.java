package com.phz.dadaIsland.mapper;

import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.phz.dadaIsland.domain.model.Contribution;

@Mapper
public interface ContributionMapper {

	void insert(Contribution contribution);

	Optional<Contribution> findById(@Param("id") Long id);

	List<Contribution> findByProjectId(@Param("projectId") Long projectId);

	void updateStatus(@Param("id") Long id, @Param("status") String status);
}

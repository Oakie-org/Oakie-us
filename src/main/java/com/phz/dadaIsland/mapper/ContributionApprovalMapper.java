package com.phz.dadaIsland.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.phz.dadaIsland.domain.model.ContributionApproval;

@Mapper
public interface ContributionApprovalMapper {

	void insert(ContributionApproval approval);

	List<ContributionApproval> findByContributionId(@Param("contributionId") Long contributionId);
}

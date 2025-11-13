package com.phz.dadaIsland.mapper;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface StatsMapper {

	long countActiveProjects();

	long countUniqueCreators();

	long countSuccessfulLaunches();
}

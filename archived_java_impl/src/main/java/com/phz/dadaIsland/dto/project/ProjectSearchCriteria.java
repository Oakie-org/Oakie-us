package com.phz.dadaIsland.dto.project;

import java.util.List;

import com.phz.dadaIsland.domain.enums.ProjectStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSearchCriteria {

	private String keyword;
	private String city;
	private String school;
	private String stage;
	private ProjectStatus status;
	private List<Long> tagIds;
	private List<Long> skillTagIds;
	private Boolean remoteOnly;
	private int offset;
	private int pageSize;
	private ProjectSortOption sort;
}

package com.phz.dadaIsland.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSkillRequirement {

	private Long projectId;
	private Long tagId;
	private Short levelRequired;
	private String notes;
}

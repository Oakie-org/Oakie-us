package com.phz.dadaIsland.domain.model;

import java.time.LocalDateTime;

import com.phz.dadaIsland.domain.enums.ProjectStatus;
import com.phz.dadaIsland.domain.enums.ProjectVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Project {

	private Long id;
	private Long ownerId;
	private String slug;
	private String title;
	private String summary;
	private String description;
	private ProjectVisibility visibility;
	private String city;
	private String school;
	private ProjectStatus status;
	private String progressState;
	private LocalDateTime startAt;
	private LocalDateTime endAt;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}

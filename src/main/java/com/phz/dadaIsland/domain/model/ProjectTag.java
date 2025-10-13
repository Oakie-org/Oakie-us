package com.phz.dadaIsland.domain.model;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectTag {

	private Long projectId;
	private Long tagId;
	private Long addedBy;
	private LocalDateTime addedAt;
}

package com.phz.dadaIsland.domain.model;

import java.time.LocalDateTime;

import com.phz.dadaIsland.domain.enums.TagType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tag {

	private Long id;
	private String slug;
	private String label;
	private TagType type;
	private String description;
	private Integer usageCount;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}

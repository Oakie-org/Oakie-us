package com.phz.dadaIsland.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSkill {

	private Long userId;
	private Long tagId;
	private Short level;
	private Integer endorsedCount;
}

package com.phz.dadaIsland.domain.model;

import java.time.LocalDateTime;

import com.phz.dadaIsland.domain.enums.MembershipStatus;
import com.phz.dadaIsland.domain.enums.ProjectRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMember {

	private Long projectId;
	private Long userId;
	private ProjectRole role;
	private MembershipStatus membershipStatus;
	private LocalDateTime joinedAt;
	private LocalDateTime leftAt;
	private String notes;
}

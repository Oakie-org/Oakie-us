package com.phz.dadaIsland.domain.model;

import java.time.LocalDateTime;
import java.util.Set;

import com.phz.dadaIsland.domain.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

	private Long id;
	private String userId;
	private String phoneNumber;
	private String email;
	private String passwordHash;
	private String displayName;
	private String avatarUrl;
	private String city;
	private String school;
	private String bio;
	private Set<String> roles;
	private UserStatus status;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}

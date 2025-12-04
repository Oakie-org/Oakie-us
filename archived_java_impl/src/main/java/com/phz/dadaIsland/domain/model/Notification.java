package com.phz.dadaIsland.domain.model;

import java.time.LocalDateTime;

import com.phz.dadaIsland.domain.enums.NotificationChannel;
import com.phz.dadaIsland.domain.enums.NotificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

	private Long id;
	private Long userId;
	private Long eventId;
	private String templateCode;
	private NotificationChannel channel;
	private NotificationStatus status;
	private String payload;
	private LocalDateTime sentAt;
	private LocalDateTime readAt;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}

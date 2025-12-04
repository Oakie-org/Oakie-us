package com.phz.dadaIsland.dto.notification;

import java.time.LocalDateTime;

import com.phz.dadaIsland.domain.enums.NotificationChannel;
import com.phz.dadaIsland.domain.enums.NotificationStatus;

public record NotificationResponse(
		Long id,
		String templateCode,
		NotificationChannel channel,
		NotificationStatus status,
		String payload,
		LocalDateTime sentAt,
		LocalDateTime readAt) {
}

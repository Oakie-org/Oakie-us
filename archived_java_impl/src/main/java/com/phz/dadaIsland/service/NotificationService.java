package com.phz.dadaIsland.service;

import java.util.List;

import com.phz.dadaIsland.dto.notification.NotificationResponse;

public interface NotificationService {

	List<NotificationResponse> listNotifications(Long userId);

	void markAsRead(Long notificationId, Long userId);
}

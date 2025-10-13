package com.phz.dadaIsland.service.impl;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;

import com.phz.dadaIsland.dto.notification.NotificationResponse;
import com.phz.dadaIsland.service.NotificationService;

@Service
public class NotificationServiceImpl implements NotificationService {

	@Override
	public List<NotificationResponse> listNotifications(Long userId) {
		// TODO retrieve notifications for the current user
		return Collections.emptyList();
	}

	@Override
	public void markAsRead(Long notificationId, Long userId) {
		// TODO update notification read state
	}
}

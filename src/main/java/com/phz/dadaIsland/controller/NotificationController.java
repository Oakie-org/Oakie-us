package com.phz.dadaIsland.controller;

import java.util.List;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phz.dadaIsland.dto.notification.NotificationResponse;
import com.phz.dadaIsland.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

	private final NotificationService notificationService;

	@GetMapping
	public ResponseEntity<List<NotificationResponse>> listNotifications() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
				.body(notificationService.listNotifications(null));
	}

	@PostMapping("/{notificationId}/read")
	public ResponseEntity<Void> markAsRead(@PathVariable Long notificationId) {
		notificationService.markAsRead(notificationId, null);
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}
}

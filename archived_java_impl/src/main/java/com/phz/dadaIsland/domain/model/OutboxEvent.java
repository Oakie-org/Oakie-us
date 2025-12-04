package com.phz.dadaIsland.domain.model;

import java.time.LocalDateTime;

import com.phz.dadaIsland.domain.enums.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboxEvent {

	private Long id;
	private String aggregateType;
	private String aggregateId;
	private String eventType;
	private String payload;
	private EventStatus status;
	private LocalDateTime availableAt;
	private LocalDateTime publishedAt;
	private Integer retryCount;
	private String lastError;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}

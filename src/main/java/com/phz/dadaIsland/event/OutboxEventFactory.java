package com.phz.dadaIsland.event;

import java.time.LocalDateTime;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phz.dadaIsland.domain.enums.EventStatus;
import com.phz.dadaIsland.domain.model.OutboxEvent;
import org.springframework.stereotype.Component;

@Component
public class OutboxEventFactory {

	private final ObjectMapper objectMapper;

	public OutboxEventFactory(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	public OutboxEvent create(String aggregateType, String aggregateId, EventType eventType, Object payload) {
		String serializedPayload = serialize(payload);
		return OutboxEvent.builder()
				.aggregateType(aggregateType)
				.aggregateId(aggregateId)
				.eventType(eventType.name())
				.payload(serializedPayload)
				.status(EventStatus.PENDING)
				.availableAt(LocalDateTime.now())
				.retryCount(0)
				.build();
	}

	private String serialize(Object payload) {
		try {
			return objectMapper.writeValueAsString(payload);
		} catch (JsonProcessingException ex) {
			throw new IllegalArgumentException("Failed to serialize event payload", ex);
		}
	}
}

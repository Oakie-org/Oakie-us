package com.phz.dadaIsland.service.impl;

import org.springframework.stereotype.Service;

import com.phz.dadaIsland.domain.model.OutboxEvent;
import com.phz.dadaIsland.service.EventPublisher;

@Service
public class RocketMqEventPublisher implements EventPublisher {

	@Override
	public void publish(OutboxEvent event) {
		// TODO forward event to RocketMQ producer template
	}
}

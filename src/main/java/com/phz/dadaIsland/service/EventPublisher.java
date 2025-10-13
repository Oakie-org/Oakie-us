package com.phz.dadaIsland.service;

import com.phz.dadaIsland.domain.model.OutboxEvent;

public interface EventPublisher {

	void publish(OutboxEvent event);
}

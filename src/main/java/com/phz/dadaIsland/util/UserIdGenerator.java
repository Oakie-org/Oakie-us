package com.phz.dadaIsland.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Generates compact numeric user identifiers. The layout is second-based timestamp since a custom epoch
 * followed by a two-digit node id and a two-digit sequence, keeping IDs around 10-12 digits today.
 */
@Component
public class UserIdGenerator {

	private static final long DEFAULT_EPOCH_MILLIS = 1704067200000L;

	private static final long MAX_NODE_ID = 99L;
	private static final long MAX_SEQUENCE = 99L;

	private final long nodeId;
	private final long customEpochMillis;

	private long lastSecond = -1L;
	private long sequence = 0L;

	public UserIdGenerator(@Value("${app.user-id.node-id:0}") long nodeId,
						   @Value("${app.user-id.epoch-millis:1704067200000}") long customEpochMillis) {
		if (nodeId < 0 || nodeId > MAX_NODE_ID) {
			throw new IllegalArgumentException("Node id must be between 0 and " + MAX_NODE_ID);
		}
		this.nodeId = nodeId;
		this.customEpochMillis = customEpochMillis;
	}

	public synchronized long generate() {
		long currentSecond = currentSecond();

		if (currentSecond < lastSecond) {
			currentSecond = waitNextSecond(lastSecond);
		}

		if (currentSecond == lastSecond) {
			if (sequence >= MAX_SEQUENCE) {
				currentSecond = waitNextSecond(currentSecond);
				sequence = 0L;
			} else {
				sequence++;
			}
		} else {
			sequence = 0L;
		}

		lastSecond = currentSecond;

		long id = (currentSecond * 10_000) + (nodeId * 100) + sequence;
		if (id < 0) {
			throw new IllegalStateException("Generated negative user id, check epoch configuration");
		}
		return id;
	}

	private long waitNextSecond(long referenceSecond) {
		long second = currentSecond();
		while (second <= referenceSecond) {
			second = currentSecond();
		}
		return second;
	}

	private long currentSecond() {
		long diff = System.currentTimeMillis() - customEpochMillis;
		if (diff < 0) {
			diff = 0;
		}
		return diff / 1000;
	}
}

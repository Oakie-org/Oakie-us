package com.phz.dadaIsland.service;

import java.time.Duration;

/**
 * Provides rate-limiting primitives backed by Redis.
 */
public interface RateLimiterService {

	/**
	 * Attempts to consume a token for the provided key within the configured window.
	 *
	 * @param key unique identifier for the limiter (e.g., phone number)
	 * @param limit maximum number of allowed actions during the window
	 * @param window time window
	 * @return {@code true} if the action is allowed, {@code false} otherwise
	 */
	boolean tryConsume(String key, long limit, Duration window);
}

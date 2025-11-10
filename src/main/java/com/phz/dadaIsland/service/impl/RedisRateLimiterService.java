package com.phz.dadaIsland.service.impl;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.springframework.data.redis.connection.ReturnType;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import com.phz.dadaIsland.service.RateLimiterService;

/**
 * Redis-backed token bucket limiter that supports burst capacity and smooth refill semantics.
 * <p>
 * Each key stores a small hash with the remaining tokens and the last refill timestamp; a Lua script
 * runs atomically inside Redis to refill tokens based on elapsed time, consume one token when available,
 * and reject requests once the bucket is empty.
 * </p>
 */
@Service
public class RedisRateLimiterService implements RateLimiterService {

	private static final byte[] SCRIPT = """
			local key = KEYS[1]
			local capacity = tonumber(ARGV[1])
			local window = tonumber(ARGV[2])
			local now = tonumber(ARGV[3])
			local rate = capacity / window

			local data = redis.call('HMGET', key, 'tokens', 'timestamp')
			local tokens = tonumber(data[1])
			local last_refill = tonumber(data[2])

			if tokens == nil then
			  tokens = capacity
			  last_refill = now
			else
			  local delta = now - last_refill
			  if delta > 0 then
			    local refill = delta * rate
			    tokens = math.min(capacity, tokens + refill)
			    last_refill = now
			  end
			end

			if tokens < 1 then
			  redis.call('HMSET', key, 'tokens', tokens, 'timestamp', last_refill)
			  redis.call('PEXPIRE', key, window)
			  return 0
			else
			  tokens = tokens - 1
			  redis.call('HMSET', key, 'tokens', tokens, 'timestamp', now)
			  redis.call('PEXPIRE', key, window)
			  return 1
			end
			""".getBytes(StandardCharsets.UTF_8);

	private final StringRedisTemplate redisTemplate;

	public RedisRateLimiterService(StringRedisTemplate redisTemplate) {
		this.redisTemplate = redisTemplate;
	}

	@Override
	public boolean tryConsume(String key, long limit, Duration window) {
		Assert.hasText(key, "Rate limiter key must not be empty");
		if (limit <= 0 || window == null || window.isZero() || window.isNegative()) {
			return false;
		}
		long now = System.currentTimeMillis();
		Long result = redisTemplate.execute(connection -> connection.scriptingCommands()
				.eval(SCRIPT, ReturnType.INTEGER, 1,
						key.getBytes(StandardCharsets.UTF_8),
						String.valueOf(limit).getBytes(StandardCharsets.UTF_8),
						String.valueOf(window.toMillis()).getBytes(StandardCharsets.UTF_8),
						String.valueOf(now).getBytes(StandardCharsets.UTF_8)), false, false);
		return result != null && result == 1L;
	}
}

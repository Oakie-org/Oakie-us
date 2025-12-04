package com.phz.dadaIsland.service.impl;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.connection.ReturnType;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisScriptingCommands;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;

import static org.mockito.Mockito.*;

class RedisRateLimiterServiceTest {

	@Test
	void tokenBucketDelegatesToLuaScript() {
		RedisConnection redisConnection = mock(RedisConnection.class);
		RedisScriptingCommands scriptingCommands = returnsResult(redisConnection, 1L);
		StringRedisTemplate template = mock(StringRedisTemplate.class);
		when(template.execute(any(), anyBoolean(), anyBoolean())).then(invocation -> {
			var callback = invocation.getArgument(0);
			return ((RedisCallback<?>) callback).doInRedis(redisConnection);
		});

		RedisRateLimiterService service = new RedisRateLimiterService(template);
		boolean allowed = service.tryConsume("key", 5, Duration.ofSeconds(10));

		assertTrue(allowed);

		ArgumentCaptor<byte[]> scriptCaptor = ArgumentCaptor.forClass(byte[].class);
		verify(scriptingCommands).eval(
				scriptCaptor.capture(),
				eq(ReturnType.INTEGER),
				eq(1),
				any(byte[].class),
				any(byte[].class),
				any(byte[].class),
				any(byte[].class));
	}

	@Test
	void tokenBucketRejectsWhenLuaReturnsZero() {
		RedisConnection redisConnection = mock(RedisConnection.class);
		returnsResult(redisConnection, 0L);
		StringRedisTemplate template = mock(StringRedisTemplate.class);
		when(template.execute(any(), anyBoolean(), anyBoolean())).then(invocation -> {
			var callback = invocation.getArgument(0);
			return ((RedisCallback<?>) callback).doInRedis(redisConnection);
		});

		RedisRateLimiterService service = new RedisRateLimiterService(template);
		boolean allowed = service.tryConsume("key", 5, Duration.ofSeconds(10));

		assertFalse(allowed);
	}

	private RedisScriptingCommands returnsResult(RedisConnection connection, long value) {
		RedisScriptingCommands scriptingCommands = mock(RedisScriptingCommands.class);
		when(connection.scriptingCommands()).thenReturn(scriptingCommands);
		when(scriptingCommands.eval(any(), eq(ReturnType.INTEGER), eq(1), any(byte[].class), any(byte[].class),
				any(byte[].class), any(byte[].class))).thenReturn(value);
		return scriptingCommands;
	}
}

package com.phz.dadaIsland.service.impl;

import java.security.SecureRandom;
import java.time.Duration;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import com.phz.dadaIsland.exception.BusinessException;
import com.phz.dadaIsland.service.OtpService;

/**
 * Redis-backed OTP store that generates numeric verification codes.
 */
@Service
public class RedisOtpService implements OtpService {

	private static final String KEY_PREFIX = "otp:";
	private static final SecureRandom RANDOM = new SecureRandom();

	private final StringRedisTemplate redisTemplate;

	public RedisOtpService(StringRedisTemplate redisTemplate) {
		this.redisTemplate = redisTemplate;
	}

	@Override
	public String generateAndStore(String identifier, Duration ttl) {
		String key = buildKey(identifier);
		String otp = "%06d".formatted(RANDOM.nextInt(1_000_000));
		redisTemplate.opsForValue().set(key, otp, ttl);
		return otp;
	}

	@Override
	public void validate(String identifier, String otpCode) {
		String key = buildKey(identifier);
		String stored = redisTemplate.opsForValue().get(key);
		if (stored == null || otpCode == null || !stored.equals(otpCode)) {
			throw new BusinessException("OTP code is invalid or expired");
		}
		redisTemplate.delete(key);
	}

	private String buildKey(String identifier) {
		Assert.hasText(identifier, "OTP identifier must not be empty");
		return KEY_PREFIX + identifier.trim();
	}
}

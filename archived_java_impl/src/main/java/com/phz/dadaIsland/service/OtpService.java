package com.phz.dadaIsland.service;

import java.time.Duration;

/**
 * Stores and validates OTP codes using Redis as backing store.
 */
public interface OtpService {

	/**
	 * Generates a new OTP for the provided identifier, stores it with TTL, and returns the code.
	 *
	 * @param identifier phone number or email
	 * @param ttl expiration duration
	 * @return generated OTP code
	 */
	String generateAndStore(String identifier, Duration ttl);

	/**
	 * Validates and consumes the OTP for the given identifier.
	 *
	 * @param identifier phone number or email
	 * @param otpCode code to validate
	 */
	void validate(String identifier, String otpCode);
}

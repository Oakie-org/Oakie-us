package com.phz.dadaIsland.service.impl;

import java.security.PublicKey;
import java.util.regex.Pattern;

import com.phz.dadaIsland.domain.model.User;
import com.phz.dadaIsland.mapper.UserMapper;
import com.phz.dadaIsland.util.UserIdGenerator;
import lombok.extern.log4j.Log4j;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.phz.dadaIsland.dto.auth.AuthTokenResponse;
import com.phz.dadaIsland.dto.auth.LoginRequest;
import com.phz.dadaIsland.dto.auth.RegisterRequest;
import com.phz.dadaIsland.exception.BusinessException;
import com.phz.dadaIsland.service.AuthService;

@Service
@Slf4j
public class AuthServiceImpl implements AuthService {

	private static final Pattern EMAIL_PATTERN = Pattern
			.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$", Pattern.CASE_INSENSITIVE);
	private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9]{7,15}$");
	private static final int MIN_PASSWORD_LENGTH = 8;
	private static final int MIN_DISPLAY_NAME_LENGTH = 2;
	private static final int MAX_DISPLAY_NAME_LENGTH = 50;
	private final UserMapper userMapper;
	private final UserIdGenerator userIdGenerator;

	public AuthServiceImpl(UserMapper userMapper, UserIdGenerator userIdGenerator) {
		this.userMapper = userMapper;
		this.userIdGenerator = userIdGenerator;
	}


	@Override
	@Transactional
	public void register(RegisterRequest request) {
		validateRegisterRequest(request);
		log.debug("Registration request validated successfully");
		if (userMapper.findByEmail(request.email()).isPresent()) {
			log.debug("Email {} is already registered", request.email());
			throw new BusinessException("Email is already registered");
		}
		if (userMapper.findByPhoneNumber(request.phoneNumber()).isPresent()) {
			log.debug("Phone number {} is already registered", request.phoneNumber());
			throw new BusinessException("Phone number is already registered");

		}

		userMapper.insert(User.builder()
				.phoneNumber(request.phoneNumber())
				.email(request.email())
				.build());

		// TODO implement registration workflow

	}

	@Override
	public AuthTokenResponse login(LoginRequest request) {
		// TODO implement login workflow
		return null;
	}

	private void validateRegisterRequest(RegisterRequest request) {
		if (request == null) {
			throw new BusinessException("Register request cannot be null");
		}

		String phoneNumber = normalize(request.phoneNumber());
		String email = normalize(request.email());
		String displayName = normalize(request.displayName());
		String password = request.password();
		if (log.isDebugEnabled()) {
			log.debug("Validating registration for email: {}, phone: {}, displayName: {}", email, phoneNumber, displayName);
		}
		if (phoneNumber == null) {
			throw new BusinessException("Phone number is required");
		}

		if (!PHONE_PATTERN.matcher(phoneNumber).matches()) {
			throw new BusinessException("Invalid phone number format");
		}

		if (email != null && !EMAIL_PATTERN.matcher(email).matches()) {
			throw new BusinessException("Invalid email format");
		}

		if (password == null || password.isBlank()) {
			throw new BusinessException("Password cannot be empty");
		}

		if (password.length() < MIN_PASSWORD_LENGTH) {
			throw new BusinessException("Password must be at least %d characters long".formatted(MIN_PASSWORD_LENGTH));
		}

		if (displayName == null || displayName.length() < MIN_DISPLAY_NAME_LENGTH) {
			throw new BusinessException("Display name must be at least %d characters"
					.formatted(MIN_DISPLAY_NAME_LENGTH));
		}

		if (displayName.length() > MAX_DISPLAY_NAME_LENGTH) {
			throw new BusinessException("Display name must be at most %d characters"
					.formatted(MAX_DISPLAY_NAME_LENGTH));
		}
	}

	private String normalize(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}

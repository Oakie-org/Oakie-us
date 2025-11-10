package com.phz.dadaIsland.service.impl;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.regex.Pattern;

import com.phz.dadaIsland.domain.enums.UserStatus;
import com.phz.dadaIsland.domain.model.AuthRefreshToken;
import com.phz.dadaIsland.domain.model.User;
import com.phz.dadaIsland.mapper.AuthRefreshTokenMapper;
import com.phz.dadaIsland.mapper.UserMapper;
import com.phz.dadaIsland.dto.auth.AuthTokenResponse;
import com.phz.dadaIsland.dto.auth.LoginRequest;
import com.phz.dadaIsland.dto.auth.RegisterRequest;
import com.phz.dadaIsland.dto.auth.RefreshTokenRequest;
import com.phz.dadaIsland.dto.auth.SendOtpRequest;
import com.phz.dadaIsland.exception.BusinessException;
import com.phz.dadaIsland.security.JwtTokenProvider;
import com.phz.dadaIsland.service.AuthService;
import com.phz.dadaIsland.service.OtpService;
import com.phz.dadaIsland.service.RateLimiterService;
import com.phz.dadaIsland.util.TokenHashUtil;
import com.phz.dadaIsland.util.UserIdGenerator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Default {@link AuthService} implementation that handles registration, password-based login,
 * and token refresh by coordinating MyBatis mappers, password hashing, and JWT generation.
 *
 * <p>The service centralizes credential validation rules and refresh-token persistence so the
 * controller layer can remain thin.</p>
 *
 * @author Phz
 * @since 0.0.1
 */
@Service
@Slf4j
public class AuthServiceImpl implements AuthService {

	private static final Pattern EMAIL_PATTERN = Pattern
			.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$", Pattern.CASE_INSENSITIVE);
	private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9]{7,15}$");
	private static final int MIN_PASSWORD_LENGTH = 8;
	private static final int MAX_DISPLAY_NAME_LENGTH = 50;
	private final UserMapper userMapper;
    private final UserIdGenerator userIdGenerator;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthRefreshTokenMapper authRefreshTokenMapper;
	private final OtpService otpService;
	private final RateLimiterService rateLimiterService;
	private static final String DEFAULT_NICKNAME = "哒哒";
	private static final String LOGIN_RATE_LIMIT_PREFIX = "rl:login:";
	private static final String OTP_RATE_LIMIT_PREFIX = "rl:otp:";
	// Rate limiter knobs (configurable through application properties)
	private final Duration loginRateWindow;
	private final long loginRateLimit;
	private final Duration otpTtl;
	private final Duration otpRateWindow;
	private final long otpRateLimit;


    /**
     * Creates the authentication service with the collaborating infrastructure components.
     *
     * @param userMapper mapper for user persistence and lookups
     * @param userIdGenerator generator for stable public user identifiers
     * @param passwordEncoder encoder used to hash and verify passwords
     * @param jwtTokenProvider component responsible for issuing JWT access and refresh tokens
     * @param authRefreshTokenMapper mapper for refresh-token storage
	 * @param otpService Redis-backed OTP service
	 * @param rateLimiterService Redis-backed rate limiter
	 * @param loginRateLimit max login attempts allowed per {@code loginRateWindow}
	 * @param loginRateWindow sliding window for login attempts
	 * @param otpRateLimit max OTP requests allowed per {@code otpRateWindow}
	 * @param otpRateWindow sliding window for OTP requests
	 * @param otpTtl TTL applied to generated OTP codes
     */
    public AuthServiceImpl(UserMapper userMapper,
            UserIdGenerator userIdGenerator,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            AuthRefreshTokenMapper authRefreshTokenMapper,
			OtpService otpService,
			RateLimiterService rateLimiterService,
			@Value("${security.auth.login-rate-limit:5}") long loginRateLimit,
			@Value("${security.auth.login-rate-window:PT5M}") Duration loginRateWindow,
			@Value("${security.auth.otp-rate-limit:1}") long otpRateLimit,
			@Value("${security.auth.otp-rate-window:PT1M}") Duration otpRateWindow,
			@Value("${security.auth.otp-ttl:PT5M}") Duration otpTtl) {
        this.userMapper = userMapper;
        this.userIdGenerator = userIdGenerator;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authRefreshTokenMapper = authRefreshTokenMapper;
		this.otpService = otpService;
		this.rateLimiterService = rateLimiterService;
		this.loginRateLimit = loginRateLimit;
		this.loginRateWindow = loginRateWindow;
		this.otpRateLimit = otpRateLimit;
		this.otpRateWindow = otpRateWindow;
		this.otpTtl = otpTtl;
    }


	/**
	 * Creates a new user account and returns the initial token pair.
	 *
	 * @param request registration payload containing identifiers and password
	 * @return {@link AuthTokenResponse} representing access and refresh tokens
	 */
	@Override
	@Transactional
	public AuthTokenResponse register(RegisterRequest request) {
		validateRegisterRequest(request);

		String phoneNumber = requirePhoneNumber(request.phoneNumber());
		String email = normalize(request.email());
		String otpCode = normalize(request.otpCode());
		ensurePhoneNumberAvailable(phoneNumber);
		ensureEmailAvailable(email);
		otpService.validate(phoneNumber, otpCode);

		String displayName = resolveDisplayName(request.displayName());
		String passwordHash = passwordEncoder.encode(request.password());
		String userUid = String.valueOf(userIdGenerator.generate());

		User user = User.builder()
				.userId(userUid)
				.phoneNumber(phoneNumber)
				.email(email)
				.displayName(displayName)
				.passwordHash(passwordHash)
				.build();

		userMapper.insert(user);

		User persistedUser = userMapper.findByPhoneNumber(phoneNumber)
				.orElseThrow(() -> new IllegalStateException("Failed to load persisted user for phone: " + phoneNumber));

		return issueTokens(persistedUser, userUid);
    }

	@Override
	public void sendRegistrationOtp(SendOtpRequest request) {
		String phoneNumber = requirePhoneNumber(request.phoneNumber());
		if (!rateLimiterService.tryConsume(OTP_RATE_LIMIT_PREFIX + phoneNumber, otpRateLimit, otpRateWindow)) {
			throw new BusinessException("OTP requests are too frequent. Please try again later.");
		}
		ensurePhoneNumberAvailable(phoneNumber, true);
		otpService.generateAndStore(phoneNumber, otpTtl);
		if (log.isDebugEnabled()) {
			log.debug("OTP generated for phone {} with TTL {} seconds", maskPhone(phoneNumber), otpTtl.toSeconds());
		}
	}

    /**
     * Persists the hashed refresh token issued to the user so future refresh calls can validate it.
     *
     * @param user user receiving the refresh token
     * @param userUid uid claim to attach to the token
     * @param refreshToken plaintext refresh token
     * @param refreshTtlSeconds expiration window in seconds
     */
    private void persistRefreshToken(User user, String userUid, String refreshToken, long refreshTtlSeconds) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(refreshTtlSeconds);
        String tokenHash = TokenHashUtil.sha256Hex(refreshToken);
        AuthRefreshToken entity = AuthRefreshToken.builder()
                .userId(user.getId())
                .userUid(userUid)
                .tokenHash(tokenHash)
                .issuedAt(now)
                .expiresAt(expiresAt)
                .build();
        authRefreshTokenMapper.insert(entity);
	}

	/**
	 * Authenticates a user by phone number and password and issues a fresh token pair.
	 *
	 * @param request login payload containing credentials
	 * @return {@link AuthTokenResponse} with access and refresh tokens
	 */
	@Override
	@Transactional
	public AuthTokenResponse login(LoginRequest request) {
		String phoneNumber = requirePhoneNumber(request.phoneNumber());
		if (!rateLimiterService.tryConsume(LOGIN_RATE_LIMIT_PREFIX + phoneNumber, loginRateLimit, loginRateWindow)) {
			throw new BusinessException("Too many login attempts. Please try again later.");
		}
		User user = loadUserByPhoneNumber(phoneNumber);
		ensureActiveUser(user);
		verifyPassword(user, request.password());
		return issueTokens(user, user.getUserId());
	}

	/**
	 * Invalidates the provided refresh token and returns a new token pair.
	 *
	 * @param request refresh token payload
	 * @return {@link AuthTokenResponse} with renewed access and refresh tokens
	 */
	@Override
	@Transactional
	public AuthTokenResponse refreshToken(RefreshTokenRequest request) {
		if (request == null || request.refreshToken() == null || request.refreshToken().isBlank()) {
			throw new BusinessException("Refresh token is required");
		}
		LocalDateTime now = LocalDateTime.now();
		String tokenHash = TokenHashUtil.sha256Hex(request.refreshToken());
		var existingToken = authRefreshTokenMapper.findActiveByHash(tokenHash, now)
			.orElseThrow(() -> new BusinessException("Refresh token is invalid or expired"));
		authRefreshTokenMapper.revokeById(existingToken.getId(), now);
		User user = userMapper.findById(existingToken.getUserId())
			.orElseThrow(() -> new BusinessException("Account not found for refresh token"));
		return issueTokens(user, existingToken.getUserUid());
	}

	/**
	 * Issues access and refresh tokens for the supplied user, persists the refresh-token hash,
	 * and returns the composed response object.
	 *
	 * @param user domain user entity
	 * @param userUidOverride optional override for the user UID claim
	 * @return {@link AuthTokenResponse} containing fresh access and refresh tokens
	 */
	private AuthTokenResponse issueTokens(User user, String userUidOverride) {
		Long userPk = user.getId();
		if (userPk == null) {
			throw new BusinessException("Account data is invalid");
		}
		String userUid = normalize(userUidOverride != null ? userUidOverride : user.getUserId());
		if (userUid == null) {
			throw new BusinessException("Account data is invalid");
		}
		String subject = resolveSubject(user);

		String accessToken = jwtTokenProvider.generateAccessToken(subject, userPk, userUid);
		long accessTtl = jwtTokenProvider.getAccessTokenTtlSeconds();
		String refreshToken = jwtTokenProvider.generateRefreshToken(subject, userPk, userUid);
		long refreshTtl = jwtTokenProvider.getRefreshTokenTtlSeconds();

		persistRefreshToken(user, userUid, refreshToken, refreshTtl);
		return new AuthTokenResponse(accessToken, accessTtl, refreshToken, refreshTtl);
	}

	/**
	 * Determines the string used as the JWT subject claim for the supplied user.
	 *
	 * @param user domain user entity
	 * @return subject value for JWTs
	 */
	private String resolveSubject(User user) {
		String email = normalize(user.getEmail());
		if (email != null) {
			return email;
		}
		String phoneNumber = normalize(user.getPhoneNumber());
		if (phoneNumber != null) {
			return phoneNumber;
		}
		throw new BusinessException("Account data is invalid");
	}

	/**
	 * Normalizes and validates the provided phone number string.
	 *
	 * @param phoneNumber raw phone number input
	 * @return normalized phone number
	 */
	private String requirePhoneNumber(String phoneNumber) {
		String normalized = normalize(phoneNumber);
		if (normalized == null) {
			throw new BusinessException("Phone number is required");
		}
		return normalized;
	}

	/**
	 * Loads a user entity by phone number or raises a {@link BusinessException} if not found.
	 *
	 * @param phoneNumber normalized phone number
	 * @return matching user entity
	 */
	private User loadUserByPhoneNumber(String phoneNumber) {
		return userMapper.findByPhoneNumber(phoneNumber)
				.orElseThrow(() -> new BusinessException("Invalid credentials"));
	}

	/**
	 * Ensures the user account is in an active state before authentication proceeds.
	 *
	 * @param user domain user entity
	 */
	private void ensureActiveUser(User user) {
		if (user.getStatus() != null && user.getStatus() != UserStatus.ACTIVE) {
			throw new BusinessException("Account is not active");
		}
	}

	/**
	 * Validates the supplied plaintext password against the stored hash.
	 *
	 * @param user domain user entity
	 * @param rawPassword plaintext password to verify
	 */
	private void verifyPassword(User user, String rawPassword) {
		if (rawPassword == null || rawPassword.isBlank() || !passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
			throw new BusinessException("Invalid credentials");
		}
	}

	/**
	 * Computes the persisted display name, falling back to the default nickname when none is supplied.
	 *
	 * @param displayName raw display name input
	 * @return sanitized display name
	 */
	private String resolveDisplayName(String displayName) {
		String normalizedDisplayName = normalize(displayName);
		return normalizedDisplayName != null ? normalizedDisplayName : DEFAULT_NICKNAME;
	}

	/**
	 * Checks for an existing account with the same phone number and raises a {@link BusinessException} if found.
	 *
	 * @param phoneNumber normalized phone number
	 */
	private void ensurePhoneNumberAvailable(String phoneNumber) {
		ensurePhoneNumberAvailable(phoneNumber, false);
	}

	private void ensurePhoneNumberAvailable(String phoneNumber, boolean suppressDisclosure) {
		if (phoneNumber == null) {
			throw new IllegalStateException("Phone number must be provided");
		}
		if (userMapper.findByPhoneNumber(phoneNumber).isPresent()) {
			log.debug("Phone number {} is already registered", maskPhone(phoneNumber));
			if (suppressDisclosure) {
				throw new BusinessException("Unable to process request at this time");
			}
			throw new BusinessException("Phone number is already registered");
		}
	}

	/**
	 * Checks for an existing account with the same email and raises a {@link BusinessException} if found.
	 *
	 * @param email normalized email address
	 */
	private void ensureEmailAvailable(String email) {
		if (email != null && userMapper.findByEmail(email).isPresent()) {
			log.debug("Email {} is already registered", email);
			throw new BusinessException("Email is already registered");
		}
	}

	/**
	 * Performs basic validation against the registration request payload prior to persistence.
	 *
	 * @param request registration payload
	 */
	private void validateRegisterRequest(RegisterRequest request) {
		if (request == null) {
			throw new BusinessException("Register request cannot be null");
		}

		String phoneNumber = normalize(request.phoneNumber());
		String email = normalize(request.email());
		String otpCode = normalize(request.otpCode());
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

		if (otpCode == null) {
			throw new BusinessException("OTP code is required");
		}

		if (displayName != null && displayName.length() > MAX_DISPLAY_NAME_LENGTH) {
			throw new BusinessException("Display name must be at most %d characters".formatted(MAX_DISPLAY_NAME_LENGTH));
		}
	}

	/**
	 * Trims and normalizes string inputs, returning {@code null} when blank.
	 *
	 * @param value raw string input
	 * @return trimmed string or {@code null} if blank
	 */
	private String normalize(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}

	private String maskPhone(String phoneNumber) {
		if (phoneNumber == null || phoneNumber.length() < 4) {
			return "****";
		}
		int prefixLength = Math.min(3, phoneNumber.length() - 2);
		String prefix = phoneNumber.substring(0, prefixLength);
		String suffix = phoneNumber.substring(phoneNumber.length() - 2);
		return prefix + "***" + suffix;
	}
}

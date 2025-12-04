package com.phz.dadaIsland.exception;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;

public record ApiErrorResponse(
		Instant timestamp,
		int status,
		String error,
		String code,
		String message,
		String path,
		List<ApiErrorDetail> details) {

	public record ApiErrorDetail(String field, String issue) {
	}

	public static ApiErrorResponse of(HttpStatus status, String code, String message, String path,
			List<ApiErrorDetail> details) {
		List<ApiErrorDetail> normalizedDetails = (details == null || details.isEmpty()) ? null : List.copyOf(details);
		return new ApiErrorResponse(
				Instant.now(),
				status.value(),
				status.getReasonPhrase(),
				code,
				message,
				path,
				normalizedDetails);
	}
}

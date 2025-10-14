package com.phz.dadaIsland.exception;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex,
			HttpServletRequest request) {
		List<ApiErrorResponse.ApiErrorDetail> details = ex.getBindingResult().getFieldErrors().stream()
				.map(this::toDetail)
				.collect(Collectors.toList());
		ApiErrorResponse body = ApiErrorResponse.of(
				HttpStatus.BAD_REQUEST,
				"VALIDATION_FAILED",
				"One or more fields are invalid",
				request.getRequestURI(),
				details);
		return ResponseEntity.badRequest().body(body);
	}

	@ExceptionHandler(BusinessException.class)
	public ResponseEntity<ApiErrorResponse> handleBusiness(BusinessException ex, HttpServletRequest request) {
		ApiErrorResponse body = ApiErrorResponse.of(
				HttpStatus.UNPROCESSABLE_ENTITY,
				"BUSINESS_RULE_VIOLATION",
				ex.getMessage(),
				request.getRequestURI(),
				null);
		return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiErrorResponse> handleMalformedBody(HttpMessageNotReadableException ex,
			HttpServletRequest request) {
		ApiErrorResponse body = ApiErrorResponse.of(
				HttpStatus.BAD_REQUEST,
				"MALFORMED_REQUEST",
				"Request body is missing or malformed JSON",
				request.getRequestURI(),
				null);
		return ResponseEntity.badRequest().body(body);
	}

	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	public ResponseEntity<ApiErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex,
			HttpServletRequest request) {
		ApiErrorResponse body = ApiErrorResponse.of(
				HttpStatus.METHOD_NOT_ALLOWED,
				"METHOD_NOT_ALLOWED",
				ex.getMessage(),
				request.getRequestURI(),
				null);
		return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(body);
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex,
			HttpServletRequest request) {
		ApiErrorResponse body = ApiErrorResponse.of(
				HttpStatus.FORBIDDEN,
				"ACCESS_DENIED",
				"You do not have permission to perform this action",
				request.getRequestURI(),
				null);
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
	}

	@ExceptionHandler(DataAccessException.class)
	public ResponseEntity<ApiErrorResponse> handleDataAccess(DataAccessException ex, HttpServletRequest request) {
		log.error("Database operation failed on {}", request.getRequestURI(), ex);
		ApiErrorResponse body = ApiErrorResponse.of(
				HttpStatus.INTERNAL_SERVER_ERROR,
				"DATA_ACCESS_ERROR",
				"A database error occurred",
				request.getRequestURI(),
				null);
		return ResponseEntity.internalServerError().body(body);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
		log.error("Unhandled exception on {}", request.getRequestURI(), ex);
		ApiErrorResponse body = ApiErrorResponse.of(
				HttpStatus.INTERNAL_SERVER_ERROR,
				"INTERNAL_ERROR",
				"An unexpected error occurred",
				request.getRequestURI(),
				null);
		return ResponseEntity.internalServerError().body(body);
	}

	private ApiErrorResponse.ApiErrorDetail toDetail(FieldError error) {
		String issue = error.getDefaultMessage() != null
				? error.getDefaultMessage()
				: "Rejected value: " + error.getRejectedValue();
		return new ApiErrorResponse.ApiErrorDetail(error.getField(), issue);
	}
}

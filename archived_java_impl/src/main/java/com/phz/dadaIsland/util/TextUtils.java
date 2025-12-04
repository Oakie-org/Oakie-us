package com.phz.dadaIsland.util;

/**
 * Lightweight string helpers shared across controllers and services to enforce consistent trimming
 * behavior without sprinkling {@code null} checks throughout the codebase.
 */
public final class TextUtils {

	private TextUtils() {
	}

	/**
	 * Trims the provided value and returns {@code null} if the result is empty.
	 *
	 * @param value raw string input
	 * @return trimmed value or {@code null} when blank
	 */
	public static String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}

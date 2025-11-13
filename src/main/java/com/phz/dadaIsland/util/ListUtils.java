package com.phz.dadaIsland.util;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Internal list helpers that keep controller/service code concise without pulling in heavier
 * dependencies for simple operations.
 */
public final class ListUtils {

	private ListUtils() {
	}

	/**
	 * Returns a new list containing the distinct non-null elements of {@code source} while
	 * preserving encounter order.
	 *
	 * @param source candidate list
	 * @param <T> element type
	 * @return deduplicated, non-null list (may be empty but never {@code null})
	 */
	public static <T> List<T> distinctNonNull(List<T> source) {
		if (source == null || source.isEmpty()) {
			return Collections.emptyList();
		}
		return source.stream()
				.filter(Objects::nonNull)
				.distinct()
				.collect(Collectors.toList());
	}
}

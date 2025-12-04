package com.phz.dadaIsland.dto.project;

import java.util.Locale;

import com.phz.dadaIsland.util.TextUtils;

/**
 * Sorting heuristics for the discovery feed.
 */
public enum ProjectSortOption {
	RECENT,
	OLDEST,
	POPULAR;

	public static ProjectSortOption fromNullable(String raw) {
		String normalized = TextUtils.trimToNull(raw);
		if (normalized == null) {
			return RECENT;
		}
		try {
			return ProjectSortOption.valueOf(normalized.toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException ignored) {
			return RECENT;
		}
	}
}

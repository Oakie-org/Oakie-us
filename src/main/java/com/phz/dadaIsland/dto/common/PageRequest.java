package com.phz.dadaIsland.dto.common;

/**
 * Immutable pagination request carrying page index and size while enforcing sane bounds.
 */
public record PageRequest(int page, int pageSize) {

	private static final int DEFAULT_PAGE = 1;
	private static final int DEFAULT_PAGE_SIZE = 20;
	private static final int MAX_PAGE_SIZE = 50;

	public PageRequest {
		int normalizedPage = page <= 0 ? DEFAULT_PAGE : page;
		int normalizedSize = pageSize <= 0 ? DEFAULT_PAGE_SIZE : Math.min(pageSize, MAX_PAGE_SIZE);
		page = normalizedPage;
		pageSize = normalizedSize;
	}

	public static PageRequest of(Integer page, Integer pageSize) {
		int resolvedPage = page == null ? DEFAULT_PAGE : page;
		int resolvedSize = pageSize == null ? DEFAULT_PAGE_SIZE : pageSize;
		return new PageRequest(resolvedPage, resolvedSize);
	}

	public int offset() {
		return (page - 1) * pageSize;
	}
}

package com.phz.dadaIsland.dto.common;

/**
 * Metadata describing a single page of results returned to the client.
 *
 * @param page current page index (1-based)
 * @param pageSize number of records per page
 * @param totalItems total records that match the query
 * @param totalPages total pages given current {@code pageSize}
 */
public record PaginationMeta(int page, int pageSize, long totalItems, long totalPages) {

	public static PaginationMeta of(PageRequest pageRequest, long totalItems) {
		long totalPages = totalItems <= 0 ? 0 : (long) Math.ceil((double) totalItems / pageRequest.pageSize());
		return new PaginationMeta(pageRequest.page(), pageRequest.pageSize(), totalItems, totalPages);
	}
}

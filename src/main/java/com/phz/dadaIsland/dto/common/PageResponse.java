package com.phz.dadaIsland.dto.common;

import java.util.List;

/**
 * Generic paginated response envelope aligning with the product API contract.
 *
 * @param data current page data
 * @param pagination associated metadata such as totals and size
 * @param <T> content type
 */
public record PageResponse<T>(List<T> data, PaginationMeta pagination) {

	public PageResponse {
		data = data == null ? List.of() : List.copyOf(data);
		pagination = pagination == null ? new PaginationMeta(1, 0, 0, 0) : pagination;
	}

	public static <T> PageResponse<T> empty(PageRequest pageRequest) {
		return new PageResponse<>(List.of(), PaginationMeta.of(pageRequest, 0));
	}
}

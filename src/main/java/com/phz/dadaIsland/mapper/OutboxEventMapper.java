package com.phz.dadaIsland.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.phz.dadaIsland.domain.model.OutboxEvent;

@Mapper
public interface OutboxEventMapper {

	void insert(OutboxEvent event);

	List<OutboxEvent> findPendingEvents(@Param("limit") int limit);

	void markPublished(@Param("id") Long id);

	void markFailed(@Param("id") Long id, @Param("lastError") String lastError);
}

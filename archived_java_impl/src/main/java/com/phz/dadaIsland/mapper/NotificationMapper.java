package com.phz.dadaIsland.mapper;

import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.phz.dadaIsland.domain.model.Notification;

@Mapper
public interface NotificationMapper {

	void insert(Notification notification);

	Optional<Notification> findById(@Param("id") Long id);

	List<Notification> findByUserId(@Param("userId") Long userId);

	void markAsRead(@Param("id") Long id);
}

package com.phz.dadaIsland.mapper;

import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.phz.dadaIsland.domain.model.Tag;

@Mapper
public interface TagMapper {

	void insert(Tag tag);

	Optional<Tag> findById(@Param("id") Long id);

	Optional<Tag> findBySlug(@Param("slug") String slug);

	List<Tag> findAll();
}

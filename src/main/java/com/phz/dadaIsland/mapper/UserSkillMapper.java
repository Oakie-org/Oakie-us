package com.phz.dadaIsland.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.phz.dadaIsland.domain.model.UserSkill;

@Mapper
public interface UserSkillMapper {

	void upsert(UserSkill userSkill);

	List<UserSkill> findByUserId(@Param("userId") Long userId);
}

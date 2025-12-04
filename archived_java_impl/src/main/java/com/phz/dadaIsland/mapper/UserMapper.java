package com.phz.dadaIsland.mapper;

import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.phz.dadaIsland.domain.model.User;

@Mapper
public interface UserMapper {

	void insert(User user);

	Optional<User> findById(@Param("id") Long id);

	Optional<User> findByEmail(@Param("email") String email);

	Optional<User> findByPhoneNumber(@Param("phoneNumber") String phoneNumber);


	void update(User user);
}

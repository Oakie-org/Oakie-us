package com.phz.dadaIsland.service.impl;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.phz.dadaIsland.domain.model.User;
import com.phz.dadaIsland.mapper.UserMapper;
import com.phz.dadaIsland.service.UserService;

@Service
public class UserServiceImpl implements UserService {

	private final UserMapper userMapper;

	public UserServiceImpl(UserMapper userMapper) {
		this.userMapper = userMapper;
	}

	@Override
	public Optional<User> findById(Long id) {
		return id == null ? Optional.empty() : userMapper.findById(id);
	}

	@Override
	public Optional<User> findByEmail(String email) {
		return email == null ? Optional.empty() : userMapper.findByEmail(email);
	}

	@Override
	public Optional<User> findByPhoneNumber(String phoneNumber) {
		return phoneNumber == null ? Optional.empty() : userMapper.findByPhoneNumber(phoneNumber);
	}

	@Override
	public void updateProfile(User user) {
		// TODO persist profile updates
	}
}

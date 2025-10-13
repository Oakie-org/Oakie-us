package com.phz.dadaIsland.service.impl;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.phz.dadaIsland.domain.model.User;
import com.phz.dadaIsland.service.UserService;

@Service
public class UserServiceImpl implements UserService {

	@Override
	public Optional<User> findById(Long id) {
		// TODO query user by primary key
		return Optional.empty();
	}

	@Override
	public Optional<User> findByEmail(String email) {
		// TODO query user by email
		return Optional.empty();
	}

	@Override
	public Optional<User> findByPhoneNumber(String phoneNumber) {
		// TODO query user by phone number
		return Optional.empty();
	}

	@Override
	public void updateProfile(User user) {
		// TODO persist profile updates
	}
}

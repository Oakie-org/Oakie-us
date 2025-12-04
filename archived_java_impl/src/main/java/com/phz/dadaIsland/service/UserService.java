package com.phz.dadaIsland.service;

import java.util.Optional;

import com.phz.dadaIsland.domain.model.User;

public interface UserService {

	Optional<User> findById(Long id);

	Optional<User> findByEmail(String email);

	Optional<User> findByPhoneNumber(String phoneNumber);


	void updateProfile(User user);
}

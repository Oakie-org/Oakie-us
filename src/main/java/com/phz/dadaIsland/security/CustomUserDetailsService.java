package com.phz.dadaIsland.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.phz.dadaIsland.service.UserService;

@Service
public class CustomUserDetailsService implements UserDetailsService {

	private final UserService userService;

	public CustomUserDetailsService(UserService userService) {
		this.userService = userService;
	}

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		var domainUser = userService.findByEmail(username)
				.or(() -> userService.findByPhoneNumber(username))
				.orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
		Collection<? extends GrantedAuthority> authorities = domainUser.getRoles() == null
				? List.of()
				: domainUser.getRoles().stream()
						.map(SimpleGrantedAuthority::new)
						.toList();
		String principal = domainUser.getEmail() != null ? domainUser.getEmail() : domainUser.getPhoneNumber();
		return new User(principal, domainUser.getPasswordHash(), authorities);
	}
}

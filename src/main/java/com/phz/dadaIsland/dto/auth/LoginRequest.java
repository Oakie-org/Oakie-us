package com.phz.dadaIsland.dto.auth;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        String phoneNumber,
        String email,
        @NotBlank(message = "Password cannot be empty") String password) {
    @AssertTrue(message = "Either phone number or email must be provided")
    public boolean isProvided() {
        return (phoneNumber != null && !phoneNumber.isBlank()) ||
                (email != null && !email.isBlank());
    }
}

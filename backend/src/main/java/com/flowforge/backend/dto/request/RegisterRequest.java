package com.flowforge.backend.dto.request;

import com.flowforge.backend.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "Please provide your full name")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "An email address is required to register")
    @Email(message = "Please provide a valid email address format (e.g., user@example.com)")
    private String email;

    @NotBlank(message = "A password is required to secure your account")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters long for security")
    private String password;

    private UserRole role;
}


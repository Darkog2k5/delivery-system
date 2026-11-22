package vn.ptit.spx.userservice.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        String phone,
        String identifier,
        @NotBlank(message = "Mật khẩu không được để trống")
        String password
) {
    public String resolvedIdentifier() {
        if (identifier != null && !identifier.isBlank()) {
            return identifier.trim();
        }
        return phone != null ? phone.trim() : "";
    }
}

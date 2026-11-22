package vn.ptit.spx.userservice.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresInMs,
        UserDto user
) {}

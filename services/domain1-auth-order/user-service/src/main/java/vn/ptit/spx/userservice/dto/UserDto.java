package vn.ptit.spx.userservice.dto;

import vn.ptit.spx.userservice.entity.User;
import java.time.Instant;

public record UserDto(
        Long id,
        String userCode,
        String fullName,
        String phone,
        String email,
        String role,
        String hubCode,
        String defaultAddress,
        boolean active,
        Instant createdAt
) {
    public static UserDto from(User u) {
        return new UserDto(
                u.getId(),
                u.getUserCode(),
                u.getFullName(),
                u.getPhone(),
                u.getEmail(),
                u.getRole(),
                u.getHubCode(),
                u.getDefaultAddress(),
                u.isActive(),
                u.getCreatedAt()
        );
    }
}

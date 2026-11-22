package vn.ptit.spx.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Họ tên không được để trống")
        @Size(min = 2, max = 120, message = "Họ tên phải từ 2 đến 120 ký tự")
        String fullName,

        @NotBlank(message = "Số điện thoại không được để trống")
        @Pattern(regexp = "^0\\d{9,10}$", message = "Số điện thoại phải bắt đầu bằng 0 và gồm 10-11 chữ số")
        String phone,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 6, max = 64, message = "Mật khẩu phải từ 6 ký tự trở lên")
        String password,

        String role,
        String email,
        String hubCode,
        String defaultAddress
) {}

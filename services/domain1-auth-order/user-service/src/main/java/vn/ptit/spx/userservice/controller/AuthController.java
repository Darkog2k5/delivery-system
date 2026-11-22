package vn.ptit.spx.userservice.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.ptit.spx.userservice.common.ApiResponse;
import vn.ptit.spx.userservice.dto.AuthResponse;
import vn.ptit.spx.userservice.dto.LoginRequest;
import vn.ptit.spx.userservice.dto.RegisterRequest;
import vn.ptit.spx.userservice.dto.UserDto;
import vn.ptit.spx.userservice.exception.ApiException;
import vn.ptit.spx.userservice.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse result = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Đăng ký tài khoản thành công", result));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse result = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Đăng nhập thành công", result));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> me(
            @RequestHeader(value = "X-User-Code", required = false) String userCode
    ) {
        if (userCode == null || userCode.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Chưa xác thực người dùng", "ERR_UNAUTHORIZED");
        }
        return ResponseEntity.ok(ApiResponse.ok(authService.getProfileByCode(userCode)));
    }
}

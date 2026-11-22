package vn.ptit.spx.userservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.ptit.spx.userservice.common.ApiResponse;
import vn.ptit.spx.userservice.dto.UserDto;
import vn.ptit.spx.userservice.service.AuthService;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/shippers")
    public ResponseEntity<ApiResponse<List<UserDto>>> listShippers() {
        return ResponseEntity.ok(ApiResponse.ok(authService.listShippers()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDto>>> listAllUsers() {
        return ResponseEntity.ok(ApiResponse.ok(authService.listAllUsers()));
    }
}

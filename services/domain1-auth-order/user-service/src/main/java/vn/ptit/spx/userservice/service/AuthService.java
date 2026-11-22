package vn.ptit.spx.userservice.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ptit.spx.userservice.dto.*;
import vn.ptit.spx.userservice.entity.User;
import vn.ptit.spx.userservice.exception.ApiException;
import vn.ptit.spx.userservice.repository.UserRepository;
import vn.ptit.spx.userservice.security.JwtTokenProvider;

import java.util.List;
import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String cleanPhone = request.phone().trim();
        if (userRepository.existsByPhone(cleanPhone)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Số điện thoại đã tồn tại trong hệ thống",
                    "ERR_PHONE_ALREADY_EXISTS",
                    "phone");
        }

        String normalizedRole = normalizeRole(request.role());
        String prefix = "ROLE_SHIPPER".equals(normalizedRole) ? "SHIP_" : "SHOP_";
        String userCode = generateUniqueCode(prefix);

        User user = new User();
        user.setUserCode(userCode);
        user.setFullName(request.fullName().trim());
        user.setPhone(cleanPhone);
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(normalizedRole);
        user.setHubCode("ROLE_SHIPPER".equals(normalizedRole)
                ? (request.hubCode() != null && !request.hubCode().isBlank() ? request.hubCode() : "HUB-Q1")
                : null);
        user.setDefaultAddress(request.defaultAddress() != null && !request.defaultAddress().isBlank()
                ? request.defaultAddress().trim()
                : "Quận 1, TP. Hồ Chí Minh");
        user.setActive(true);

        User saved = userRepository.save(user);
        String token = jwtTokenProvider.generateToken(saved);
        return new AuthResponse(token, "Bearer", jwtTokenProvider.getExpirationMs(), UserDto.from(saved));
    }

    public AuthResponse login(LoginRequest request) {
        String id = request.resolvedIdentifier();
        if (id.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Vui lòng nhập số điện thoại hoặc mã tài khoản",
                    "ERR_MISSING_IDENTIFIER",
                    "phone");
        }

        User user = userRepository.findByPhone(id)
                .or(() -> userRepository.findByUserCodeIgnoreCase(id))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,
                        "Thông tin đăng nhập không chính xác",
                        "ERR_INVALID_CREDENTIALS"));

        if (!user.isActive()) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Tài khoản đã bị khóa",
                    "ERR_ACCOUNT_LOCKED");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED,
                    "Số điện thoại hoặc mật khẩu không chính xác",
                    "ERR_INVALID_CREDENTIALS");
        }

        String token = jwtTokenProvider.generateToken(user);
        return new AuthResponse(token, "Bearer", jwtTokenProvider.getExpirationMs(), UserDto.from(user));
    }

    public UserDto getProfileByCode(String userCode) {
        User user = userRepository.findByUserCodeIgnoreCase(userCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy người dùng",
                        "ERR_USER_NOT_FOUND"));
        return UserDto.from(user);
    }

    public List<UserDto> listShippers() {
        return userRepository.findByRoleOrderByUserCodeAsc("ROLE_SHIPPER")
                .stream().map(UserDto::from).toList();
    }

    public List<UserDto> listAllUsers() {
        return userRepository.findAll().stream().map(UserDto::from).toList();
    }

    private String normalizeRole(String rawRole) {
        if (rawRole == null || rawRole.isBlank()) {
            return "ROLE_CUSTOMER";
        }
        String upper = rawRole.trim().toUpperCase(Locale.ROOT);
        if ("CUSTOMER".equals(upper) || "ROLE_CUSTOMER".equals(upper) || "MERCHANT".equals(upper) || "ROLE_MERCHANT".equals(upper)) {
            return "ROLE_CUSTOMER";
        }
        if ("SHIPPER".equals(upper) || "ROLE_SHIPPER".equals(upper)) {
            return "ROLE_SHIPPER";
        }
        if ("ADMIN".equals(upper) || "ROLE_ADMIN".equals(upper)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Không được phép tự đăng ký tài khoản Quản trị viên",
                    "ERR_INVALID_ROLE",
                    "role");
        }
        throw new ApiException(HttpStatus.BAD_REQUEST,
                "Vai trò không hợp lệ (chỉ chấp nhận CUSTOMER hoặc SHIPPER)",
                "ERR_INVALID_ROLE",
                "role");
    }

    private String generateUniqueCode(String prefix) {
        long count = userRepository.count() + 1;
        String candidate = prefix + String.format("%03d", count);
        while (userRepository.existsByUserCodeIgnoreCase(candidate)) {
            count++;
            candidate = prefix + String.format("%03d", count);
        }
        return candidate;
    }
}

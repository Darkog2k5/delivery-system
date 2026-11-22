package vn.ptit.spx.gateway.security;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Centralized JWT verification and Role-Based Access Control (RBAC) filter
 * enforced at the single API Gateway entry point (Port 8080).
 */
@Component
public class JwtAuthenticationGatewayFilter implements GlobalFilter, Ordered {

    private static final Set<String> ADMIN_ROLE = Set.of("ROLE_ADMIN");
    private static final Set<String> SHIPPER_OR_ADMIN = Set.of("ROLE_SHIPPER", "ROLE_ADMIN");

    private final JwtTokenValidator jwtTokenValidator;
    private final ObjectMapper objectMapper;

    public JwtAuthenticationGatewayFilter(JwtTokenValidator jwtTokenValidator, ObjectMapper objectMapper) {
        this.jwtTokenValidator = jwtTokenValidator;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        HttpMethod method = request.getMethod();
        String path = request.getURI().getPath();

        if (HttpMethod.OPTIONS.equals(method)) {
            return chain.filter(exchange);
        }

        if (path.contains("/internal/")) {
            return writeJsonError(exchange, HttpStatus.FORBIDDEN,
                    "Không thể truy cập endpoint nội bộ từ bên ngoài",
                    "ERR_INTERNAL_ROUTE_FORBIDDEN");
        }

        if (isPublicEndpoint(method, path)) {
            return chain.filter(exchange);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return writeJsonError(exchange, HttpStatus.UNAUTHORIZED,
                    "Thiếu hoặc sai định dạng JWT Token xác thực",
                    "ERR_UNAUTHORIZED");
        }

        String token = authHeader.substring(7).trim();
        Claims claims;
        try {
            claims = jwtTokenValidator.parseAndValidate(token);
        } catch (JwtException | IllegalArgumentException ex) {
            return writeJsonError(exchange, HttpStatus.UNAUTHORIZED,
                    "JWT Token không hợp lệ hoặc đã hết hạn",
                    "ERR_INVALID_TOKEN");
        }

        String role = stringClaim(claims, "role");
        Set<String> allowedRoles = resolveAllowedRoles(method, path);
        if (allowedRoles != null && !allowedRoles.contains(role)) {
            return writeJsonError(exchange, HttpStatus.FORBIDDEN,
                    "Tài khoản không đủ thẩm quyền truy cập tài nguyên này",
                    "ERR_FORBIDDEN",
                    Map.of("currentRole", role, "requiredRoles", allowedRoles));
        }

        String userId = claims.get("userId") != null ? String.valueOf(claims.get("userId")) : "";
        String userCode = stringClaim(claims, "userCode");
        if (userCode.isEmpty() && claims.getSubject() != null) {
            userCode = claims.getSubject();
        }
        String phone = stringClaim(claims, "phone");
        String fullName = stringClaim(claims, "fullName");
        String hubCode = stringClaim(claims, "hubCode");

        String finalUserCode = userCode;
        ServerHttpRequest mutatedRequest = request.mutate()
                .headers(headers -> {
                    headers.remove("X-User-Id");
                    headers.remove("X-User-Code");
                    headers.remove("X-User-Role");
                    headers.remove("X-User-Phone");
                    headers.remove("X-User-Name");
                    headers.remove("X-User-Hub");
                    headers.add("X-User-Id", userId);
                    headers.add("X-User-Code", finalUserCode);
                    headers.add("X-User-Role", role);
                    headers.add("X-User-Phone", phone);
                    headers.add("X-User-Name", URLEncoder.encode(fullName, StandardCharsets.UTF_8));
                    headers.add("X-User-Hub", hubCode);
                })
                .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    private boolean isPublicEndpoint(HttpMethod method, String path) {
        if (path.startsWith("/actuator/health") || path.startsWith("/actuator/info")) {
            return true;
        }
        if (HttpMethod.POST.equals(method) &&
                ("/api/auth/login".equals(path) || "/api/auth/register".equals(path))) {
            return true;
        }
        if (HttpMethod.GET.equals(method) && path.startsWith("/api/tracking")) {
            return true;
        }
        if (HttpMethod.GET.equals(method) && "/api/orders/locations".equals(path)) {
            return true;
        }
        if (HttpMethod.POST.equals(method) && "/api/orders/calculate-fee".equals(path)) {
            return true;
        }
        return false;
    }

    /**
     * Returns required roles for restricted endpoints, or null if any authenticated role is permitted.
     */
    private Set<String> resolveAllowedRoles(HttpMethod method, String path) {
        // Admin-only Dispatch endpoints
        if (path.startsWith("/api/dispatch/assign")
                || path.startsWith("/api/dispatch/dashboard")
                || path.startsWith("/api/dispatch/hubs")
                || path.startsWith("/api/dispatch/shippers")) {
            return ADMIN_ROLE;
        }
        // Admin-only User directory
        if (HttpMethod.GET.equals(method) && ("/api/users".equals(path) || "/api/users/shippers".equals(path))) {
            return ADMIN_ROLE;
        }
        // Admin-only full system order listing
        if (HttpMethod.GET.equals(method) && "/api/orders".equals(path)) {
            return ADMIN_ROLE;
        }
        // Shipper / Admin operational dispatch endpoints
        if (path.startsWith("/api/dispatch/shipper") || path.startsWith("/api/dispatch/orders")) {
            return SHIPPER_OR_ADMIN;
        }
        // Creating order allowed for Shop (CUSTOMER) or Admin
        if (HttpMethod.POST.equals(method) && "/api/orders".equals(path)) {
            return Set.of("ROLE_CUSTOMER", "ROLE_ADMIN");
        }
        return null;
    }

    private String stringClaim(Claims claims, String key) {
        Object val = claims.get(key);
        return val == null ? "" : String.valueOf(val);
    }

    private Mono<Void> writeJsonError(ServerWebExchange exchange, HttpStatus status, String message, String errorCode) {
        return writeJsonError(exchange, status, message, errorCode, Map.of());
    }

    private Mono<Void> writeJsonError(ServerWebExchange exchange, HttpStatus status, String message, String errorCode, Map<String, Object> extraData) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(new MediaType(MediaType.APPLICATION_JSON, StandardCharsets.UTF_8));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("errorCode", errorCode);
        data.putAll(extraData);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.value());
        body.put("message", message);
        body.put("data", data);

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(body);
        } catch (JsonProcessingException e) {
            bytes = ("{\"status\":" + status.value() + ",\"message\":\"" + message + "\",\"data\":null}")
                    .getBytes(StandardCharsets.UTF_8);
        }
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}

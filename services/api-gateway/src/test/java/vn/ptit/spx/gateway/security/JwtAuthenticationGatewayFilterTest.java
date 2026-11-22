package vn.ptit.spx.gateway.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;

class JwtAuthenticationGatewayFilterTest {

    private static final String SECRET = "SpxDeliverySystemSecretKeyForMicroservices2026PTITNhom24MustBeLongEnough256Bits";

    private final JwtTokenValidator validator = new JwtTokenValidator(SECRET);
    private final JwtAuthenticationGatewayFilter filter = new JwtAuthenticationGatewayFilter(validator, new ObjectMapper());

    private String issueToken(String userCode, String role) {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .subject(userCode)
                .claim("userId", 1L)
                .claim("userCode", userCode)
                .claim("role", role)
                .claim("phone", "0988000001")
                .claim("fullName", "Nguyễn Văn Test")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(key)
                .compact();
    }

    @Test
    void allowsPublicTrackingWithoutToken() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/tracking/SPX20260501089").build()
        );
        AtomicBoolean called = new AtomicBoolean(false);
        GatewayFilterChain chain = ex -> {
            called.set(true);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();
        assertTrue(called.get());
    }

    @Test
    void rejectsMissingTokenOnProtectedEndpointWith401() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/orders").build()
        );
        GatewayFilterChain chain = ex -> Mono.empty();

        filter.filter(exchange, chain).block();
        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void blocksCustomerCallingAdminDispatchAssignWith403() {
        String customerToken = issueToken("SHOP_01", "ROLE_CUSTOMER");
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/dispatch/assign")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken)
                        .build()
        );
        AtomicBoolean called = new AtomicBoolean(false);
        GatewayFilterChain chain = ex -> {
            called.set(true);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();
        assertFalse(called.get());
        assertEquals(HttpStatus.FORBIDDEN, exchange.getResponse().getStatusCode());
    }

    @Test
    void forwardsAuthenticatedAdminAndEncodesVietnameseHeader() {
        String adminToken = issueToken("ADMIN_01", "ROLE_ADMIN");
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/dispatch/assign")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .build()
        );
        AtomicBoolean called = new AtomicBoolean(false);
        GatewayFilterChain chain = ex -> {
            called.set(true);
            assertEquals("ADMIN_01", ex.getRequest().getHeaders().getFirst("X-User-Code"));
            assertEquals("ROLE_ADMIN", ex.getRequest().getHeaders().getFirst("X-User-Role"));
            assertNotNull(ex.getRequest().getHeaders().getFirst("X-User-Name"));
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();
        assertTrue(called.get());
    }
}

package vn.ptit.spx.userservice.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import vn.ptit.spx.userservice.dto.AuthResponse;
import vn.ptit.spx.userservice.dto.LoginRequest;
import vn.ptit.spx.userservice.dto.RegisterRequest;
import vn.ptit.spx.userservice.exception.ApiException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:user_test_db;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Test
    void registerSuccessAndRejectDuplicatePhone() {
        RegisterRequest req = new RegisterRequest(
                "Nguyễn Văn Kiểm Thử",
                "0901234567",
                "123456",
                "CUSTOMER",
                null,
                null,
                "Quận 1, TP. Hồ Chí Minh"
        );

        AuthResponse first = authService.register(req);
        assertEquals("ROLE_CUSTOMER", first.user().role());
        assertNotNull(first.accessToken());

        ApiException duplicate = assertThrows(ApiException.class, () -> authService.register(req));
        assertEquals(HttpStatus.CONFLICT, duplicate.getStatus());
    }

    @Test
    void seededAccountsCanLoginByCodeAndPhone() {
        AuthResponse admin = authService.login(new LoginRequest("0900000001", null, "123456"));
        assertEquals("ROLE_ADMIN", admin.user().role());

        AuthResponse shipper = authService.login(new LoginRequest(null, "SHIPPER_01", "123456"));
        assertEquals("ROLE_SHIPPER", shipper.user().role());
        assertEquals("HUB-Q1", shipper.user().hubCode());
    }
}

package vn.ptit.spx.userservice.seed;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.ptit.spx.userservice.entity.User;
import vn.ptit.spx.userservice.repository.UserRepository;

import java.util.List;

/**
 * Idempotent seed data for 9 standardized demo accounts (1 Admin, 3 Shippers, 5 Shops).
 * Default password for all seeded accounts: "123456".
 */
@Component
public class UserDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserDataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        List<SeedAccount> accounts = List.of(
                new SeedAccount("ADMIN_01", "Nguyễn Quản Trị", "0900000001", "admin@spx.local", "ROLE_ADMIN", "HUB-Q1", "Quận 1, TP. Hồ Chí Minh"),
                new SeedAccount("SHIPPER_01", "Nguyễn Văn Tài", "0911000001", "shipper1@spx.local", "ROLE_SHIPPER", "HUB-Q1", "Quận 1, TP. Hồ Chí Minh"),
                new SeedAccount("SHIPPER_02", "Trần Minh Tuấn", "0911000002", "shipper2@spx.local", "ROLE_SHIPPER", "HUB-TD", "TP. Thủ Đức, TP. Hồ Chí Minh"),
                new SeedAccount("SHIPPER_03", "Lê Hoàng Nam", "0911000003", "shipper3@spx.local", "ROLE_SHIPPER", "HUB-TB", "Quận Tân Bình, TP. Hồ Chí Minh"),
                new SeedAccount("SHOP_01", "Shop Thời Trang Sài Gòn", "0988000001", "shop1@spx.local", "ROLE_CUSTOMER", null, "120 Lê Lợi, Quận 1, TP. Hồ Chí Minh"),
                new SeedAccount("SHOP_02", "Cửa Hàng Điện Tử Minh Anh", "0988000002", "shop2@spx.local", "ROLE_CUSTOMER", null, "45 Cộng Hòa, Quận Tân Bình, TP. Hồ Chí Minh"),
                new SeedAccount("SHOP_03", "Mỹ Phẩm Lan Chi", "0988000003", "shop3@spx.local", "ROLE_CUSTOMER", null, "88 Võ Văn Tần, Quận 3, TP. Hồ Chí Minh"),
                new SeedAccount("SHOP_04", "Gia Dụng Phú Quý", "0988000004", "shop4@spx.local", "ROLE_CUSTOMER", null, "210 Xô Viết Nghệ Tĩnh, Quận Bình Thạnh, TP. Hồ Chí Minh"),
                new SeedAccount("SHOP_05", "Nhà Sách Tri Thức", "0988000005", "shop5@spx.local", "ROLE_CUSTOMER", null, "15 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh")
        );

        String defaultHash = passwordEncoder.encode("123456");
        for (SeedAccount acc : accounts) {
            if (!userRepository.existsByUserCodeIgnoreCase(acc.code) && !userRepository.existsByPhone(acc.phone)) {
                User u = new User();
                u.setUserCode(acc.code);
                u.setFullName(acc.fullName);
                u.setPhone(acc.phone);
                u.setEmail(acc.email);
                u.setPasswordHash(defaultHash);
                u.setRole(acc.role);
                u.setHubCode(acc.hubCode);
                u.setDefaultAddress(acc.address);
                u.setActive(true);
                userRepository.save(u);
            }
        }
    }

    private record SeedAccount(String code, String fullName, String phone, String email, String role, String hubCode, String address) {}
}

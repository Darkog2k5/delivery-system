package vn.ptit.spx.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.ptit.spx.userservice.entity.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhone(String phone);
    Optional<User> findByUserCodeIgnoreCase(String userCode);
    boolean existsByPhone(String phone);
    boolean existsByUserCodeIgnoreCase(String userCode);
    List<User> findByRoleOrderByUserCodeAsc(String role);
}

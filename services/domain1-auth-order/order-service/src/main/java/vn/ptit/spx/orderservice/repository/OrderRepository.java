package vn.ptit.spx.orderservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.ptit.spx.orderservice.entity.Order;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByTrackingCodeIgnoreCase(String trackingCode);
    boolean existsByTrackingCodeIgnoreCase(String trackingCode);
    List<Order> findByCustomerCodeOrderByCreatedAtDesc(String customerCode);
    List<Order> findAllByOrderByCreatedAtDesc();
}

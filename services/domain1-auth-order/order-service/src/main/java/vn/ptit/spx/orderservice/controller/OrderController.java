package vn.ptit.spx.orderservice.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.ptit.spx.orderservice.common.ApiResponse;
import vn.ptit.spx.orderservice.domain.LocationCatalog;
import vn.ptit.spx.orderservice.domain.ShippingFeeCalculator;
import vn.ptit.spx.orderservice.dto.*;
import vn.ptit.spx.orderservice.service.OrderService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/locations")
    public ResponseEntity<ApiResponse<List<LocationCatalog.DistrictLocation>>> getLocations() {
        return ResponseEntity.ok(ApiResponse.ok(LocationCatalog.getAll()));
    }

    @PostMapping("/calculate-fee")
    public ResponseEntity<ApiResponse<ShippingFeeCalculator.FeeCalculationResult>> calculateFee(
            @Valid @RequestBody CalculateFeeRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.calculateFee(request)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderDto>> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @RequestHeader(value = "X-User-Code", required = false) String userCode,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Phone", required = false) String userPhone
    ) {
        OrderDto created = orderService.createOrder(request, userCode, userName, userPhone);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo vận đơn thành công", created));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getMyOrders(
            @RequestHeader(value = "X-User-Code", defaultValue = "SHOP_01") String userCode
    ) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.listMyOrders(userCode)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderDto>>> getAllOrders() {
        return ResponseEntity.ok(ApiResponse.ok(orderService.listAllOrders()));
    }

    @GetMapping("/{trackingCode}")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderByCode(@PathVariable String trackingCode) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrderByTrackingCode(trackingCode)));
    }

    @GetMapping("/{trackingCode}/label")
    public ResponseEntity<ApiResponse<OrderLabelDto>> getOrderLabel(@PathVariable String trackingCode) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getShippingLabel(trackingCode)));
    }

    @PatchMapping("/{trackingCode}/status")
    public ResponseEntity<ApiResponse<OrderDto>> updateStatus(
            @PathVariable String trackingCode,
            @RequestBody OrderStatusUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái vận đơn thành công",
                orderService.updateOrderStatus(trackingCode, request)));
    }

    @PostMapping("/internal/events")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> receiveInternalEvent(@RequestBody Map<String, Object> event) {
        String trackingCode = event.get("trackingCode") != null ? String.valueOf(event.get("trackingCode")) : null;
        if (trackingCode != null) {
            String status = event.get("orderStatus") != null ? String.valueOf(event.get("orderStatus")) : null;
            String shipper = event.get("assignedShipperCode") != null ? String.valueOf(event.get("assignedShipperCode")) : null;
            Integer attempts = event.get("deliveryAttempts") instanceof Number n ? n.intValue() : null;
            String failReason = event.get("failReason") != null ? String.valueOf(event.get("failReason")) : null;
            String proof = event.get("proofImageUrl") != null ? String.valueOf(event.get("proofImageUrl")) : null;
            String signature = event.get("receiverSignature") != null ? String.valueOf(event.get("receiverSignature")) : null;
            orderService.syncFromDispatchEvent(trackingCode, status, shipper, attempts, failReason, proof, signature);
        }
        return ResponseEntity.ok(ApiResponse.ok(Map.of("synced", true)));
    }
}

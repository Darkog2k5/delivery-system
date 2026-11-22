package vn.ptit.spx.orderservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ptit.spx.orderservice.domain.LocationCatalog;
import vn.ptit.spx.orderservice.domain.ShippingFeeCalculator;
import vn.ptit.spx.orderservice.domain.WaybillStateMachine;
import vn.ptit.spx.orderservice.dto.*;
import vn.ptit.spx.orderservice.entity.Order;
import vn.ptit.spx.orderservice.exception.ApiException;
import vn.ptit.spx.orderservice.messaging.OrderEventPublisher;
import vn.ptit.spx.orderservice.repository.OrderRepository;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class OrderService {

    private static final DateTimeFormatter DATE_PREFIX = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final OrderRepository orderRepository;
    private final OrderEventPublisher orderEventPublisher;
    private final String publicTrackBaseUrl;

    public OrderService(
            OrderRepository orderRepository,
            OrderEventPublisher orderEventPublisher,
            @Value("${integration.public-track-base-url:http://localhost:3000/track}") String publicTrackBaseUrl
    ) {
        this.orderRepository = orderRepository;
        this.orderEventPublisher = orderEventPublisher;
        this.publicTrackBaseUrl = publicTrackBaseUrl;
    }

    public ShippingFeeCalculator.FeeCalculationResult calculateFee(CalculateFeeRequest request) {
        return ShippingFeeCalculator.calculate(
                request.senderDistrict(),
                request.receiverDistrict(),
                request.resolvedWeightGram(),
                request.weightKg(),
                request.lengthCm(),
                request.widthCm(),
                request.heightCm()
        );
    }

    @Transactional
    public OrderDto createOrder(
            CreateOrderRequest req,
            String customerCode,
            String encodedCustomerName,
            String customerPhone
    ) {
        ShippingFeeCalculator.FeeCalculationResult fee = ShippingFeeCalculator.calculate(
                req.senderDistrict(),
                req.receiverDistrict(),
                req.resolvedWeightGram(),
                req.weightKg(),
                req.lengthCm(),
                req.widthCm(),
                req.heightCm()
        );

        String decodedCustomerName = decodeName(encodedCustomerName, "Shop Khách hàng");
        String resolvedCustomerCode = (customerCode != null && !customerCode.isBlank()) ? customerCode : "SHOP_GUEST";

        Order order = new Order();
        order.setTrackingCode(generateUniqueTrackingCode());
        order.setCustomerCode(resolvedCustomerCode);
        order.setCustomerName(decodedCustomerName);
        order.setSenderName(req.senderName() != null && !req.senderName().isBlank() ? req.senderName().trim() : decodedCustomerName);
        order.setSenderPhone(req.senderPhone() != null && !req.senderPhone().isBlank() ? req.senderPhone().trim() : (customerPhone != null ? customerPhone : ""));
        order.setSenderAddress(req.senderAddress().trim());
        order.setSenderDistrict(LocationCatalog.resolveOrThrow(req.senderDistrict(), "senderDistrict").district());
        order.setReceiverName(req.receiverName().trim());
        order.setReceiverPhone(req.receiverPhone().trim());
        order.setReceiverAddress(req.receiverAddress().trim());
        order.setReceiverDistrict(LocationCatalog.resolveOrThrow(req.receiverDistrict(), "receiverDistrict").district());
        order.setItemName(req.itemName().trim());
        order.setActualWeightGram(fee.actualWeightGram());
        order.setLengthCm(req.lengthCm() != null && req.lengthCm() > 0 ? req.lengthCm() : 10.0);
        order.setWidthCm(req.widthCm() != null && req.widthCm() > 0 ? req.widthCm() : 10.0);
        order.setHeightCm(req.heightCm() != null && req.heightCm() > 0 ? req.heightCm() : 10.0);
        order.setVolumetricWeightGram(fee.volumetricWeightGram());
        order.setChargeableWeightGram(fee.chargeableWeightGram());
        order.setDistanceKm(fee.distanceKm());
        order.setShippingFee(fee.shippingFee());
        order.setCodAmount(req.codAmount() != null ? req.codAmount() : 0L);
        order.setNote(req.note());
        order.setHubCode(fee.originHubCode());
        order.setOrderStatus(WaybillStateMachine.CREATED);
        order.setDeliveryAttempts(0);

        Order saved = orderRepository.save(order);
        orderEventPublisher.publishOrderCreated(saved);
        return OrderDto.from(saved);
    }

    public List<OrderDto> listMyOrders(String customerCode) {
        return orderRepository.findByCustomerCodeOrderByCreatedAtDesc(customerCode)
                .stream().map(OrderDto::from).toList();
    }

    public List<OrderDto> listAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(OrderDto::from).toList();
    }

    public OrderDto getOrderByTrackingCode(String trackingCode) {
        Order order = findOrderOrThrow(trackingCode);
        return OrderDto.from(order);
    }

    public OrderLabelDto getShippingLabel(String trackingCode) {
        Order o = findOrderOrThrow(trackingCode);
        String qrUrl = publicTrackBaseUrl + "?code=" + o.getTrackingCode();
        return new OrderLabelDto(
                o.getTrackingCode(),
                "CODE128",
                o.getTrackingCode(),
                qrUrl,
                "100x150",
                o.getHubCode(),
                o.getSenderName(),
                o.getSenderPhone(),
                o.getSenderAddress() + ", " + o.getSenderDistrict(),
                o.getReceiverName(),
                o.getReceiverPhone(),
                o.getReceiverAddress() + ", " + o.getReceiverDistrict(),
                o.getItemName(),
                o.getChargeableWeightGram(),
                o.getCodAmount(),
                o.getShippingFee(),
                o.getNote(),
                o.getOrderStatus(),
                o.getCreatedAt()
        );
    }

    @Transactional
    public OrderDto updateOrderStatus(String trackingCode, OrderStatusUpdateRequest req) {
        Order order = findOrderOrThrow(trackingCode);
        WaybillStateMachine.validateTransition(order.getOrderStatus(), req.targetStatus(), order.getDeliveryAttempts());

        order.setOrderStatus(req.targetStatus());
        if (req.assignedShipperCode() != null && !req.assignedShipperCode().isBlank()) {
            order.setAssignedShipperCode(req.assignedShipperCode());
        }
        if (WaybillStateMachine.FAILED.equals(req.targetStatus())) {
            int nextAttempts = req.deliveryAttempts() != null ? req.deliveryAttempts() : order.getDeliveryAttempts() + 1;
            order.setDeliveryAttempts(nextAttempts);
            order.setFailReason(req.failReason());
        }
        if (req.proofImageUrl() != null) order.setProofImageUrl(req.proofImageUrl());
        if (req.receiverSignature() != null) order.setReceiverSignature(req.receiverSignature());

        return OrderDto.from(orderRepository.save(order));
    }

    @Transactional
    public void syncFromDispatchEvent(String trackingCode, String newStatus, String shipperCode, Integer attempts, String failReason, String proofImageUrl, String signature) {
        orderRepository.findByTrackingCodeIgnoreCase(trackingCode).ifPresent(order -> {
            if (newStatus != null && !newStatus.isBlank() && !newStatus.equals(order.getOrderStatus())) {
                order.setOrderStatus(newStatus);
            }
            if (shipperCode != null && !shipperCode.isBlank()) {
                order.setAssignedShipperCode(shipperCode);
            }
            if (attempts != null) {
                order.setDeliveryAttempts(attempts);
            }
            if (failReason != null) {
                order.setFailReason(failReason);
            }
            if (proofImageUrl != null) {
                order.setProofImageUrl(proofImageUrl);
            }
            if (signature != null) {
                order.setReceiverSignature(signature);
            }
            orderRepository.save(order);
        });
    }

    private Order findOrderOrThrow(String trackingCode) {
        return orderRepository.findByTrackingCodeIgnoreCase(trackingCode.trim())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy vận đơn với mã: " + trackingCode,
                        "ERR_ORDER_NOT_FOUND",
                        "trackingCode"));
    }

    private String generateUniqueTrackingCode() {
        String datePart = LocalDate.now().format(DATE_PREFIX);
        String candidate;
        do {
            int random = ThreadLocalRandom.current().nextInt(10000, 99999);
            candidate = "SPX" + datePart + random;
        } while (orderRepository.existsByTrackingCodeIgnoreCase(candidate));
        return candidate;
    }

    private String decodeName(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return URLDecoder.decode(value, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return value;
        }
    }
}

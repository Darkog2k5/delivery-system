package vn.ptit.spx.orderservice.dto;

import java.time.Instant;

public record OrderStatusUpdateRequest(
        String targetStatus,
        String assignedShipperCode,
        Integer deliveryAttempts,
        String failReason,
        String proofImageUrl,
        String receiverSignature,
        String description,
        String location,
        Instant occurredAt
) {}

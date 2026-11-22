package vn.ptit.spx.orderservice.dto;

import vn.ptit.spx.orderservice.entity.Order;
import java.time.Instant;

public record OrderDto(
        Long id,
        String trackingCode,
        String customerCode,
        String customerName,
        String senderName,
        String senderPhone,
        String senderAddress,
        String senderDistrict,
        String receiverName,
        String receiverPhone,
        String receiverAddress,
        String receiverDistrict,
        String itemName,
        int actualWeightGram,
        double lengthCm,
        double widthCm,
        double heightCm,
        int volumetricWeightGram,
        int chargeableWeightGram,
        double distanceKm,
        long shippingFee,
        long codAmount,
        String note,
        String hubCode,
        String assignedShipperCode,
        String orderStatus,
        int deliveryAttempts,
        String failReason,
        String proofImageUrl,
        String receiverSignature,
        Instant createdAt,
        Instant updatedAt
) {
    public static OrderDto from(Order o) {
        return new OrderDto(
                o.getId(), o.getTrackingCode(), o.getCustomerCode(), o.getCustomerName(),
                o.getSenderName(), o.getSenderPhone(), o.getSenderAddress(), o.getSenderDistrict(),
                o.getReceiverName(), o.getReceiverPhone(), o.getReceiverAddress(), o.getReceiverDistrict(),
                o.getItemName(), o.getActualWeightGram(), o.getLengthCm(), o.getWidthCm(), o.getHeightCm(),
                o.getVolumetricWeightGram(), o.getChargeableWeightGram(), o.getDistanceKm(),
                o.getShippingFee(), o.getCodAmount(), o.getNote(), o.getHubCode(),
                o.getAssignedShipperCode(), o.getOrderStatus(), o.getDeliveryAttempts(),
                o.getFailReason(), o.getProofImageUrl(), o.getReceiverSignature(),
                o.getCreatedAt(), o.getUpdatedAt()
        );
    }
}

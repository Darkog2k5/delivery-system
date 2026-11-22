package vn.ptit.spx.orderservice.dto;

import java.time.Instant;

public record OrderLabelDto(
        String trackingCode,
        String barcodeFormat,
        String barcodeValue,
        String qrTrackingUrl,
        String paperSizeMm,
        String hubCode,
        String senderName,
        String senderPhone,
        String senderAddress,
        String receiverName,
        String receiverPhone,
        String receiverAddress,
        String itemName,
        int chargeableWeightGram,
        long codAmount,
        long shippingFee,
        String note,
        String orderStatus,
        Instant createdAt
) {}

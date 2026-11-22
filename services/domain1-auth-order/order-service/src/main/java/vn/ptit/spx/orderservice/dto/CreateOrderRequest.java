package vn.ptit.spx.orderservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CreateOrderRequest(
        String senderName,
        String senderPhone,
        @NotBlank(message = "Địa chỉ lấy hàng không được để trống")
        String senderAddress,
        @NotBlank(message = "Quận/Huyện gửi không được để trống")
        String senderDistrict,

        @NotBlank(message = "Tên người nhận không được để trống")
        String receiverName,
        @NotBlank(message = "Số điện thoại người nhận không được để trống")
        String receiverPhone,
        @NotBlank(message = "Địa chỉ nhận hàng không được để trống")
        String receiverAddress,
        @NotBlank(message = "Quận/Huyện nhận không được để trống")
        String receiverDistrict,

        @NotBlank(message = "Tên kiện hàng không được để trống")
        String itemName,

        Integer actualWeightGram,
        Integer packageWeight,
        Double weightKg,
        Double lengthCm,
        Double widthCm,
        Double heightCm,

        @Min(value = 0, message = "Tiền thu hộ COD không thể âm")
        Long codAmount,
        String note
) {
    public Integer resolvedWeightGram() {
        if (actualWeightGram != null) return actualWeightGram;
        return packageWeight;
    }
}

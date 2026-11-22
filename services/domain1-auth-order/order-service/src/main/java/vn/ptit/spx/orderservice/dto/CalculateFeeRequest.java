package vn.ptit.spx.orderservice.dto;

import jakarta.validation.constraints.NotBlank;

public record CalculateFeeRequest(
        @NotBlank(message = "Vui lòng chọn nơi gửi")
        String senderDistrict,
        @NotBlank(message = "Vui lòng chọn nơi nhận")
        String receiverDistrict,
        Integer actualWeightGram,
        Integer packageWeight,
        Double weightKg,
        Double lengthCm,
        Double widthCm,
        Double heightCm
) {
    public Integer resolvedWeightGram() {
        if (actualWeightGram != null) return actualWeightGram;
        return packageWeight;
    }
}

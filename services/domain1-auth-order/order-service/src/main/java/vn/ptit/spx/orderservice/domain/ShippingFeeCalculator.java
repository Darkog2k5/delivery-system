package vn.ptit.spx.orderservice.domain;

import org.springframework.http.HttpStatus;
import vn.ptit.spx.orderservice.exception.ApiException;

/**
 * Implements UC08 shipping fee calculation from Section 3.5.2:
 * - Haversine distance between pickup and delivery coordinates
 * - Volumetric weight (gram) = ceil((L * W * H) / 5)
 * - Chargeable weight = max(actualWeightGram, volumetricWeightGram)
 * - Fee = 15,000 VND (base <= 2km, <= 500g)
 *       + ceil(max(0, distanceKm - 2)) * 5,000 VND
 *       + ceil(max(0, chargeableWeightGram - 500) / 500.0) * 2,500 VND
 */
public final class ShippingFeeCalculator {

    public static final long BASE_FEE = 15_000L;
    public static final long DISTANCE_STEP_FEE = 5_000L;
    public static final long WEIGHT_STEP_FEE = 2_500L;

    public record FeeCalculationResult(
            double distanceKm,
            int actualWeightGram,
            int volumetricWeightGram,
            int chargeableWeightGram,
            long baseFee,
            long distanceSurcharge,
            long weightSurcharge,
            long shippingFee,
            String originHubCode,
            String destinationHubCode
    ) {}

    private ShippingFeeCalculator() {}

    public static FeeCalculationResult calculate(
            String senderDistrict,
            String receiverDistrict,
            Integer actualWeightGram,
            Double weightKg,
            Double lengthCm,
            Double widthCm,
            Double heightCm
    ) {
        int resolvedWeightGram;
        if (actualWeightGram != null) {
            resolvedWeightGram = actualWeightGram;
        } else if (weightKg != null) {
            resolvedWeightGram = (int) Math.round(weightKg * 1000.0);
        } else {
            resolvedWeightGram = 0;
        }

        if (resolvedWeightGram <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Khối lượng kiện hàng không hợp lệ (Phải lớn hơn 0g)",
                    "ERR_INVALID_WEIGHT",
                    "packageWeight");
        }

        double l = lengthCm != null && lengthCm > 0 ? lengthCm : 10.0;
        double w = widthCm != null && widthCm > 0 ? widthCm : 10.0;
        double h = heightCm != null && heightCm > 0 ? heightCm : 10.0;

        LocationCatalog.DistrictLocation origin = LocationCatalog.resolveOrThrow(senderDistrict, "senderDistrict");
        LocationCatalog.DistrictLocation dest = LocationCatalog.resolveOrThrow(receiverDistrict, "receiverDistrict");

        double distanceKm = LocationCatalog.haversineKm(origin.lat(), origin.lng(), dest.lat(), dest.lng());
        int volumetricWeightGram = (int) Math.ceil((l * w * h) / 5.0);
        int chargeableWeightGram = Math.max(resolvedWeightGram, volumetricWeightGram);

        long distanceSurcharge = distanceKm > 2.0
                ? (long) Math.ceil(distanceKm - 2.0) * DISTANCE_STEP_FEE
                : 0L;
        long weightSurcharge = chargeableWeightGram > 500
                ? (long) Math.ceil((chargeableWeightGram - 500) / 500.0) * WEIGHT_STEP_FEE
                : 0L;
        long totalFee = BASE_FEE + distanceSurcharge + weightSurcharge;

        return new FeeCalculationResult(
                distanceKm,
                resolvedWeightGram,
                volumetricWeightGram,
                chargeableWeightGram,
                BASE_FEE,
                distanceSurcharge,
                weightSurcharge,
                totalFee,
                origin.hubCode(),
                dest.hubCode()
        );
    }
}

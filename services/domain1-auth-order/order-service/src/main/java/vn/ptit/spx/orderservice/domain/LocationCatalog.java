package vn.ptit.spx.orderservice.domain;

import org.springframework.http.HttpStatus;
import vn.ptit.spx.orderservice.exception.ApiException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public final class LocationCatalog {

    public record DistrictLocation(String district, double lat, double lng, String hubCode, String hubName) {}

    private static final List<DistrictLocation> LOCATIONS = List.of(
            new DistrictLocation("Quận 1", 10.7769, 106.7009, "HUB-Q1", "Bưu cục Trung tâm Quận 1"),
            new DistrictLocation("TP. Thủ Đức", 10.8494, 106.7537, "HUB-TD", "Trạm Trung Chuyển TP. Thủ Đức"),
            new DistrictLocation("Quận Tân Bình", 10.8014, 106.6528, "HUB-TB", "Bưu cục Tân Bình"),
            new DistrictLocation("Quận Bình Thạnh", 10.8106, 106.7091, "HUB-BT", "Bưu cục Bình Thạnh"),
            new DistrictLocation("Quận 3", 10.7844, 106.6844, "HUB-Q1", "Bưu cục Trung tâm Quận 1"),
            new DistrictLocation("Quận 5", 10.7540, 106.6634, "HUB-Q1", "Bưu cục Trung tâm Quận 1"),
            new DistrictLocation("Quận 7", 10.7340, 106.7218, "HUB-Q1", "Bưu cục Trung tâm Quận 1"),
            new DistrictLocation("Quận 10", 10.7746, 106.6675, "HUB-TB", "Bưu cục Tân Bình"),
            new DistrictLocation("Quận Gò Vấp", 10.8387, 106.6653, "HUB-TB", "Bưu cục Tân Bình"),
            new DistrictLocation("Quận Phú Nhuận", 10.7992, 106.6803, "HUB-BT", "Bưu cục Bình Thạnh")
    );

    private LocationCatalog() {}

    public static List<DistrictLocation> getAll() {
        return LOCATIONS;
    }

    public static DistrictLocation resolveOrThrow(String districtName, String fieldName) {
        if (districtName == null || districtName.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Vui lòng chọn khu vực/quận huyện hợp lệ",
                    "ERR_INVALID_LOCATION",
                    fieldName);
        }
        String normalized = districtName.trim().toLowerCase();
        Optional<DistrictLocation> exact = LOCATIONS.stream()
                .filter(l -> l.district().toLowerCase().equals(normalized))
                .findFirst();
        if (exact.isPresent()) {
            return exact.get();
        }
        return LOCATIONS.stream()
                .filter(l -> normalized.contains(l.district().toLowerCase()) || l.district().toLowerCase().contains(normalized))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Không xác định được tọa độ cho khu vực: " + districtName,
                        "ERR_UNKNOWN_DISTRICT",
                        fieldName));
    }

    public static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double km = R * c;
        return Math.round(km * 100.0) / 100.0;
    }
}

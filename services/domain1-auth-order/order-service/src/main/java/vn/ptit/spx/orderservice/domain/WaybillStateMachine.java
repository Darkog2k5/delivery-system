package vn.ptit.spx.orderservice.domain;

import org.springframework.http.HttpStatus;
import vn.ptit.spx.orderservice.exception.ApiException;

import java.util.Map;
import java.util.Set;

/**
 * Enforces the immutable 7-state waybill lifecycle (Section 6.2.3 & TC-12).
 */
public final class WaybillStateMachine {

    public static final String CREATED = "CREATED";
    public static final String WAITING_FOR_PICKUP = "WAITING_FOR_PICKUP";
    public static final String PICKED_UP = "PICKED_UP";
    public static final String IN_TRANSIT = "IN_TRANSIT";
    public static final String OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY";
    public static final String DELIVERED = "DELIVERED";
    public static final String FAILED = "FAILED";

    private static final Set<String> ALL_STATES = Set.of(
            CREATED, WAITING_FOR_PICKUP, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED
    );

    private static final Map<String, Set<String>> TRANSITIONS = Map.of(
            CREATED, Set.of(WAITING_FOR_PICKUP),
            WAITING_FOR_PICKUP, Set.of(PICKED_UP),
            PICKED_UP, Set.of(IN_TRANSIT),
            IN_TRANSIT, Set.of(OUT_FOR_DELIVERY),
            OUT_FOR_DELIVERY, Set.of(DELIVERED, FAILED),
            FAILED, Set.of(WAITING_FOR_PICKUP, OUT_FOR_DELIVERY),
            DELIVERED, Set.of()
    );

    private WaybillStateMachine() {}

    public static void validateTransition(String currentStatus, String targetStatus, int deliveryAttempts) {
        if (targetStatus == null || !ALL_STATES.contains(targetStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Mã trạng thái vận đơn không hợp lệ: " + targetStatus,
                    "ERR_INVALID_ORDER_STATUS",
                    "targetStatus");
        }
        if (currentStatus.equals(targetStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Vận đơn đã ở trạng thái " + targetStatus,
                    "ERR_DUPLICATE_STATE",
                    "targetStatus");
        }
        Set<String> allowed = TRANSITIONS.getOrDefault(currentStatus, Set.of());
        if (!allowed.contains(targetStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    String.format("Vi phạm quy tắc chuyển đổi vòng đời vận đơn: không thể chuyển từ '%s' sang '%s'", currentStatus, targetStatus),
                    "ERR_INVALID_STATE_TRANSITION",
                    "targetStatus");
        }
        if (FAILED.equals(currentStatus) && deliveryAttempts >= 3) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Đơn hàng đã vượt quá tối đa 3 lần giao thất bại",
                    "ERR_MAX_DELIVERY_ATTEMPTS");
        }
    }
}

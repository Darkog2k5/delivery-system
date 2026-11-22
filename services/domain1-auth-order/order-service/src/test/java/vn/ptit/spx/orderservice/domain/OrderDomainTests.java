package vn.ptit.spx.orderservice.domain;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import vn.ptit.spx.orderservice.exception.ApiException;

import static org.junit.jupiter.api.Assertions.*;

class OrderDomainTests {

    @Test
    void calculatesShippingFeeWithHaversineAndVolumetricWeight() {
        // TC-04: Quận 1 -> TP. Thủ Đức, 2.5kg (2500g), 30x20x15 cm (volumetric = 9000/5 = 1800g)
        ShippingFeeCalculator.FeeCalculationResult result = ShippingFeeCalculator.calculate(
                "Quận 1", "TP. Thủ Đức", 2500, null, 30.0, 20.0, 15.0
        );
        assertEquals(1800, result.volumetricWeightGram());
        assertEquals(2500, result.chargeableWeightGram());
        assertTrue(result.distanceKm() > 8.0);
        assertTrue(result.shippingFee() > 15_000L);
    }

    @Test
    void rejectsZeroWeightWithErrInvalidWeight() {
        ApiException ex = assertThrows(ApiException.class, () ->
                ShippingFeeCalculator.calculate("Quận 1", "Quận 3", 0, null, 10.0, 10.0, 10.0));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("ERR_INVALID_WEIGHT", ex.getErrorCode());
    }

    @Test
    void stateMachineBlocksSkipTransitionCreatedToDelivered() {
        // TC-12: CREATED -> DELIVERED must fail with 400 Bad Request
        ApiException ex = assertThrows(ApiException.class, () ->
                WaybillStateMachine.validateTransition(WaybillStateMachine.CREATED, WaybillStateMachine.DELIVERED, 0));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("ERR_INVALID_STATE_TRANSITION", ex.getErrorCode());
    }

    @Test
    void stateMachineAllowsValidSequence() {
        assertDoesNotThrow(() -> WaybillStateMachine.validateTransition("CREATED", "WAITING_FOR_PICKUP", 0));
        assertDoesNotThrow(() -> WaybillStateMachine.validateTransition("WAITING_FOR_PICKUP", "PICKED_UP", 0));
        assertDoesNotThrow(() -> WaybillStateMachine.validateTransition("PICKED_UP", "IN_TRANSIT", 0));
        assertDoesNotThrow(() -> WaybillStateMachine.validateTransition("IN_TRANSIT", "OUT_FOR_DELIVERY", 0));
        assertDoesNotThrow(() -> WaybillStateMachine.validateTransition("OUT_FOR_DELIVERY", "DELIVERED", 0));
        assertDoesNotThrow(() -> WaybillStateMachine.validateTransition("OUT_FOR_DELIVERY", "FAILED", 0));
    }
}

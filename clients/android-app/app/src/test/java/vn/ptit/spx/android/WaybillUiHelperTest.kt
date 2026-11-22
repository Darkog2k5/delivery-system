package vn.ptit.spx.android

import org.junit.Assert.assertEquals
import org.junit.Test
import vn.ptit.spx.android.ui.WaybillUiHelper

class WaybillUiHelperTest {
    @Test
    fun normalizesGatewayUrlsCorrectly() {
        assertEquals("http://10.0.2.2:8080/", WaybillUiHelper.normalizeBaseUrl("http://10.0.2.2:8080"))
        assertEquals("http://192.168.1.10:8080/", WaybillUiHelper.normalizeBaseUrl("192.168.1.10:8080/"))
    }

    @Test
    fun mapsWaybillStatusToVietnamese() {
        assertEquals("Chờ lấy hàng", WaybillUiHelper.statusLabel("WAITING_FOR_PICKUP"))
        assertEquals("Giao thành công", WaybillUiHelper.statusLabel("DELIVERED"))
        assertEquals("Giao thất bại", WaybillUiHelper.statusLabel("FAILED"))
    }
}

package vn.ptit.spx.android.ui

import java.text.NumberFormat
import java.util.Locale

object WaybillUiHelper {
    fun normalizeBaseUrl(rawUrl: String): String {
        val trimmed = rawUrl.trim()
        if (trimmed.isEmpty()) return "http://10.0.2.2:8080/"
        val withScheme = if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            trimmed
        } else {
            "http://$trimmed"
        }
        return if (withScheme.endsWith("/")) withScheme else "$withScheme/"
    }

    fun statusLabel(status: String): String = when (status) {
        "CREATED" -> "Mới tạo"
        "WAITING_FOR_PICKUP" -> "Chờ lấy hàng"
        "PICKED_UP" -> "Đã lấy hàng"
        "IN_TRANSIT" -> "Đang luân chuyển"
        "OUT_FOR_DELIVERY" -> "Đang đi giao"
        "DELIVERED" -> "Giao thành công"
        "FAILED" -> "Giao thất bại"
        else -> status
    }

    fun formatVnd(amount: Long): String {
        val formatter = NumberFormat.getInstance(Locale("vi", "VN"))
        return "${formatter.format(amount)} đ"
    }
}

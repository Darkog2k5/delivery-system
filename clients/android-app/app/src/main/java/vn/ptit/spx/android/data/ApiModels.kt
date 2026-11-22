package vn.ptit.spx.android.data

data class StandardApiResponse<T>(
    val status: Int,
    val message: String,
    val data: T?
)

data class LoginRequest(
    val identifier: String,
    val password: String
)

data class RegisterRequest(
    val fullName: String,
    val phone: String,
    val password: String,
    val role: String = "SHIPPER",
    val hubCode: String = "HUB-Q1"
)

data class UserDto(
    val id: Long,
    val userCode: String,
    val fullName: String,
    val phone: String,
    val role: String,
    val hubCode: String?
)

data class AuthData(
    val accessToken: String,
    val tokenType: String,
    val expiresInMs: Long,
    val user: UserDto
)

data class ShipperProfile(
    val shipperCode: String,
    val fullName: String,
    val phone: String,
    val hubCode: String,
    val vehiclePlate: String,
    val isOnline: Boolean,
    val activeOrdersCount: Int,
    val codHolding: Long
)

data class DispatchOrder(
    val trackingCode: String,
    val customerCode: String,
    val senderName: String,
    val senderPhone: String,
    val senderAddress: String,
    val senderDistrict: String,
    val receiverName: String,
    val receiverPhone: String,
    val receiverAddress: String,
    val receiverDistrict: String,
    val itemName: String,
    val shippingFee: Long,
    val codAmount: Long,
    val hubCode: String,
    val assignedShipperCode: String?,
    val assignedShipperName: String?,
    val orderStatus: String,
    val deliveryAttempts: Int,
    val failReason: String?
)

data class TrackingTimelineItem(
    val eventId: String,
    val status: String,
    val title: String,
    val description: String,
    val location: String,
    val actorCode: String,
    val hubCode: String?,
    val occurredAt: String
)

data class TrackingReadModel(
    val trackingCode: String,
    val senderName: String,
    val senderDistrict: String,
    val receiverName: String,
    val receiverDistrict: String,
    val itemName: String,
    val codAmount: Long,
    val shippingFee: Long,
    val currentStatus: String,
    val hubCode: String,
    val assignedShipperCode: String?,
    val assignedShipperName: String?,
    val deliveryAttempts: Int,
    val failReason: String?,
    val timeline: List<TrackingTimelineItem>,
    val updatedAt: String
)

data class ShipperStatusBody(val isOnline: Boolean)
data class PickupConfirmBody(val scannedBarcode: String, val note: String? = null)
data class TransitUpdateBody(val targetStatus: String, val note: String? = null)
data class DeliverConfirmBody(
    val proofImageUrl: String,
    val receiverSignature: String,
    val codCollected: Boolean = true,
    val note: String? = null
)
data class FailDeliveryBody(val reason: String)

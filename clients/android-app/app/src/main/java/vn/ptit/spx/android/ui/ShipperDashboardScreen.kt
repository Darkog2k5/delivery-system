package vn.ptit.spx.android.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import kotlinx.coroutines.launch
import vn.ptit.spx.android.data.*

private val SpxOrange = Color(0xFFEE4D2D)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShipperDashboardScreen(
    api: SpxApiService,
    sessionManager: SessionManager,
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var profile by remember { mutableStateOf<ShipperProfile?>(null) }
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabKeys = listOf("pickup", "delivery", "history")
    val tabTitles = listOf("Cần lấy (UC17)", "Đang giao", "Lịch sử")

    var orders by remember { mutableStateOf<List<DispatchOrder>>(emptyList()) }
    var statusBanner by remember { mutableStateOf<String?>(null) }
    var errorBanner by remember { mutableStateOf<String?>(null) }

    var pickupDialogOrder by remember { mutableStateOf<DispatchOrder?>(null) }
    var scannedBarcode by remember { mutableStateOf("") }

    var deliverDialogOrder by remember { mutableStateOf<DispatchOrder?>(null) }
    var receiverSign by remember { mutableStateOf("") }

    var failDialogOrder by remember { mutableStateOf<DispatchOrder?>(null) }
    var failReason by remember { mutableStateOf("Không liên lạc được với người nhận") }

    fun refreshAll() {
        scope.launch {
            errorBanner = null
            try {
                val pRes = api.getShipperProfile()
                if (pRes.isSuccessful) profile = pRes.body()?.data
                val oRes = api.getShipperOrders(tabKeys[selectedTab])
                if (oRes.isSuccessful) orders = oRes.body()?.data ?: emptyList()
            } catch (e: Exception) {
                errorBanner = "Lỗi đồng bộ: ${e.localizedMessage}"
            }
        }
    }

    LaunchedEffect(selectedTab) {
        refreshAll()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            profile?.fullName ?: sessionManager.getFullName() ?: "Shipper",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            "${profile?.shipperCode ?: sessionManager.getUserCode()} · ${profile?.hubCode ?: "HUB"}",
                            fontSize = 11.sp,
                            color = Color(0xFF94A3B8)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0F172A),
                    titleContentColor = Color.White
                ),
                actions = {
                    // UC16 Online / Offline Switch
                    Switch(
                        checked = profile?.isOnline ?: true,
                        onCheckedChange = { checked ->
                            scope.launch {
                                val res = api.updateShipperStatus(ShipperStatusBody(checked))
                                if (res.isSuccessful) {
                                    profile = res.body()?.data
                                    statusBanner = if (checked) "Đã bật trạng thái ONLINE" else "Đã chuyển OFFLINE"
                                }
                            }
                        }
                    )
                    IconButton(onClick = { refreshAll() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Color.White)
                    }
                    IconButton(onClick = {
                        sessionManager.clearSession()
                        onLogout()
                    }) {
                        Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = "Logout", tint = Color.White)
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(Color(0xFFF8FAFC))
        ) {
            // COD Summary Strip
            Surface(color = Color(0xFF1E293B), modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Tiền COD đang giữ trong ca:", color = Color(0xFFCBD5E1), fontSize = 12.sp)
                    Text(
                        WaybillUiHelper.formatVnd(profile?.codHolding ?: 0L),
                        color = Color(0xFFFDBA74),
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 15.sp
                    )
                }
            }

            TabRow(selectedTabIndex = selectedTab) {
                tabTitles.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { Text(title, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                    )
                }
            }

            Column(modifier = Modifier.padding(12.dp)) {
                statusBanner?.let {
                    Text(it, color = Color(0xFF047857), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                }
                errorBanner?.let {
                    Text(it, color = Color(0xFFBE123C), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                }

                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(orders) { order ->
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(order.trackingCode, fontWeight = FontWeight.Black, fontSize = 15.sp)
                                    Text(
                                        WaybillUiHelper.statusLabel(order.orderStatus),
                                        color = SpxOrange,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp
                                    )
                                }
                                Spacer(Modifier.height(4.dp))
                                Text("Lấy: ${order.senderAddress}, ${order.senderDistrict}", fontSize = 12.sp)
                                Text(
                                    "Giao: ${order.receiverName} (${order.receiverPhone}) - ${order.receiverAddress}, ${order.receiverDistrict}",
                                    fontSize = 12.sp,
                                    color = Color(0xFF334155)
                                )
                                Text(
                                    "Kiện hàng: ${order.itemName} · COD: ${WaybillUiHelper.formatVnd(order.codAmount)}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SpxOrange
                                )
                                Spacer(Modifier.height(10.dp))

                                when (order.orderStatus) {
                                    "WAITING_FOR_PICKUP" -> {
                                        Button(
                                            onClick = {
                                                pickupDialogOrder = order
                                                scannedBarcode = order.trackingCode
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = SpxOrange),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Icon(Icons.Default.QrCodeScanner, contentDescription = null)
                                            Spacer(Modifier.width(6.dp))
                                            Text("Quét Barcode & Lấy Hàng (UC18)")
                                        }
                                    }

                                    "PICKED_UP" -> {
                                        Button(
                                            onClick = {
                                                scope.launch {
                                                    api.advanceTransit(order.trackingCode, TransitUpdateBody("IN_TRANSIT"))
                                                    refreshAll()
                                                }
                                            },
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Text("Nhập trạm trung chuyển (IN_TRANSIT)")
                                        }
                                    }

                                    "IN_TRANSIT" -> {
                                        Button(
                                            onClick = {
                                                scope.launch {
                                                    api.advanceTransit(order.trackingCode, TransitUpdateBody("OUT_FOR_DELIVERY"))
                                                    refreshAll()
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = SpxOrange),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Text("Bắt đầu đi giao (OUT_FOR_DELIVERY)")
                                        }
                                    }

                                    "OUT_FOR_DELIVERY" -> {
                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Button(
                                                onClick = {
                                                    deliverDialogOrder = order
                                                    receiverSign = order.receiverName
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669)),
                                                modifier = Modifier.weight(1f)
                                            ) {
                                                Text("Giao thành công (UC20)")
                                            }
                                            OutlinedButton(
                                                onClick = { failDialogOrder = order },
                                                modifier = Modifier.weight(1f)
                                            ) {
                                                Text("Thất bại (UC21)", color = Color(0xFFBE123C))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // UC18 Barcode Pickup Dialog with Google Play Services Scanner + Manual Fallback
    pickupDialogOrder?.let { target ->
        AlertDialog(
            onDismissRequest = { pickupDialogOrder = null },
            title = { Text("Xác nhận Lấy hàng (UC18)") },
            text = {
                Column {
                    Text("Vận đơn: ${target.trackingCode}", fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = scannedBarcode,
                        onValueChange = { scannedBarcode = it },
                        label = { Text("Mã vạch kiện hàng") },
                        singleLine = true
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedButton(onClick = {
                        try {
                            GmsBarcodeScanning.getClient(context).startScan()
                                .addOnSuccessListener { barcode ->
                                    barcode.rawValue?.let { scannedBarcode = it }
                                }
                        } catch (_: Exception) {
                            // Emulator fallback uses text field
                        }
                    }) {
                        Icon(Icons.Default.QrCodeScanner, contentDescription = null)
                        Spacer(Modifier.width(6.dp))
                        Text("Mở Camera Quét Barcode")
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    scope.launch {
                        val res = api.confirmPickup(target.trackingCode, PickupConfirmBody(scannedBarcode))
                        if (res.isSuccessful) {
                            statusBanner = "Đã lấy hàng ${target.trackingCode}!"
                            pickupDialogOrder = null
                            refreshAll()
                        } else {
                            errorBanner = "Mã vạch không khớp hoặc lỗi trạng thái"
                        }
                    }
                }) {
                    Text("Xác nhận đã lấy")
                }
            },
            dismissButton = {
                TextButton(onClick = { pickupDialogOrder = null }) { Text("Đóng") }
            }
        )
    }

    // UC20 Delivery Success Dialog
    deliverDialogOrder?.let { target ->
        AlertDialog(
            onDismissRequest = { deliverDialogOrder = null },
            title = { Text("Xác nhận Giao Thành Công (UC20)") },
            text = {
                Column {
                    Text("COD cần thu: ${WaybillUiHelper.formatVnd(target.codAmount)}", fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = receiverSign,
                        onValueChange = { receiverSign = it },
                        label = { Text("Chữ ký / Tên người nhận") },
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(onClick = {
                    scope.launch {
                        val res = api.confirmDelivery(
                            target.trackingCode,
                            DeliverConfirmBody(
                                proofImageUrl = "https://storage.spx.local/proof/${target.trackingCode}.jpg",
                                receiverSignature = receiverSign,
                                codCollected = true
                            )
                        )
                        if (res.isSuccessful) {
                            statusBanner = "Giao thành công ${target.trackingCode}!"
                            deliverDialogOrder = null
                            refreshAll()
                        }
                    }
                }) {
                    Text("Hoàn tất giao hàng")
                }
            },
            dismissButton = {
                TextButton(onClick = { deliverDialogOrder = null }) { Text("Hủy") }
            }
        )
    }

    // UC21 Fail Delivery Dialog
    failDialogOrder?.let { target ->
        AlertDialog(
            onDismissRequest = { failDialogOrder = null },
            title = { Text("Báo cáo Giao Thất Bại (UC21)") },
            text = {
                OutlinedTextField(
                    value = failReason,
                    onValueChange = { failReason = it },
                    label = { Text("Lý do thất bại (Bắt buộc)") },
                    minLines = 2
                )
            },
            confirmButton = {
                Button(
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFBE123C)),
                    onClick = {
                        scope.launch {
                            val res = api.reportFailure(target.trackingCode, FailDeliveryBody(failReason))
                            if (res.isSuccessful) {
                                statusBanner = "Đã ghi nhận thất bại cho ${target.trackingCode}"
                                failDialogOrder = null
                                refreshAll()
                            }
                        }
                    }
                ) {
                    Text("Xác nhận thất bại")
                }
            },
            dismissButton = {
                TextButton(onClick = { failDialogOrder = null }) { Text("Đóng") }
            }
        )
    }
}

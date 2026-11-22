package vn.ptit.spx.android.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import vn.ptit.spx.android.data.SpxApiService
import vn.ptit.spx.android.data.TrackingReadModel

private val SpxOrange = Color(0xFFEE4D2D)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PublicTrackingScreen(
    api: SpxApiService,
    onNavigateToShipperLogin: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var trackingCode by remember { mutableStateOf("SPX20260501089") }
    var trackingResult by remember { mutableStateOf<TrackingReadModel?>(null) }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }

    fun doLookup(code: String) {
        val cleaned = code.trim().uppercase()
        if (cleaned.isEmpty()) return
        scope.launch {
            loading = true
            errorMsg = null
            try {
                val res = api.trackOrderPublic(cleaned)
                if (res.isSuccessful && res.body()?.data != null) {
                    trackingResult = res.body()!!.data
                } else {
                    trackingResult = null
                    errorMsg = "Không tìm thấy vận đơn '$cleaned' (Mã ${res.code()})"
                }
            } catch (e: Exception) {
                trackingResult = null
                errorMsg = "Lỗi kết nối Gateway: ${e.localizedMessage}"
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        doLookup(trackingCode)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("SPX Tra Cứu Công Khai (UC11)", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0F172A),
                    titleContentColor = Color.White
                ),
                actions = {
                    TextButton(onClick = onNavigateToShipperLogin) {
                        Icon(Icons.Default.LocalShipping, contentDescription = null, tint = SpxOrange)
                        Spacer(Modifier.width(4.dp))
                        Text("Tài xế", color = Color.White, fontWeight = FontWeight.Bold)
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
                .padding(16.dp)
        ) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Không cần đăng nhập · Nhập mã vận đơn SPX",
                        fontSize = 12.sp,
                        color = Color(0xFF64748B)
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = trackingCode,
                        onValueChange = { trackingCode = it },
                        label = { Text("Mã vận đơn (VD: SPX20260501089)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = { doLookup(trackingCode) },
                            enabled = !loading,
                            colors = ButtonDefaults.buttonColors(containerColor = SpxOrange),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Search, contentDescription = null)
                            Spacer(Modifier.width(6.dp))
                            Text(if (loading) "Đang tải..." else "Tra cứu ngay")
                        }
                        OutlinedButton(onClick = {
                            trackingCode = "SPX999"
                            doLookup("SPX999")
                        }) {
                            Text("Thử SPX999")
                        }
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            errorMsg?.let { msg ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF1F2)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = msg,
                        color = Color(0xFFBE123C),
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(14.dp)
                    )
                }
            }

            trackingResult?.let { model ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                model.trackingCode,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 18.sp
                            )
                            AssistChip(
                                onClick = {},
                                label = {
                                    Text(
                                        WaybillUiHelper.statusLabel(model.currentStatus),
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            )
                        }
                        Text(
                            "${model.senderDistrict} → ${model.receiverDistrict} · ${model.itemName}",
                            fontSize = 13.sp,
                            color = Color(0xFF475569)
                        )
                        Text(
                            "COD: ${WaybillUiHelper.formatVnd(model.codAmount)} · Hub: ${model.hubCode}",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = SpxOrange
                        )
                        if (!model.failReason.isNullOrBlank()) {
                            Spacer(Modifier.height(6.dp))
                            Text(
                                "Lý do thất bại: ${model.failReason}",
                                fontSize = 12.sp,
                                color = Color(0xFFBE123C)
                            )
                        }
                    }
                }

                Spacer(Modifier.height(12.dp))
                Text("Lịch sử hành trình (${model.timeline.size})", fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(6.dp))

                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(model.timeline) { evt ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    "${evt.title} (${evt.status})",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                                Text(evt.description, fontSize = 12.sp, color = Color(0xFF334155))
                                Text(
                                    "${evt.location} · ${evt.occurredAt}",
                                    fontSize = 11.sp,
                                    color = Color(0xFF64748B)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

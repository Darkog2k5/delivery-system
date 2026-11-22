package vn.ptit.spx.android.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import vn.ptit.spx.android.data.*

private val SpxOrange = Color(0xFFEE4D2D)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShipperLoginScreen(
    api: SpxApiService,
    sessionManager: SessionManager,
    onGatewayUrlChanged: (String) -> Unit,
    onLoginSuccess: () -> Unit,
    onBackToTracking: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var isRegister by remember { mutableStateOf(false) }
    var identifier by remember { mutableStateOf("SHIPPER_01") }
    var password by remember { mutableStateOf("123456") }
    var fullName by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }

    var showServerDialog by remember { mutableStateOf(false) }
    var gatewayInput by remember { mutableStateOf(sessionManager.getGatewayUrl()) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tài Xế Shipper (UC01 & UC02)", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackToTracking) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                actions = {
                    IconButton(onClick = { showServerDialog = true }) {
                        Icon(Icons.Default.Settings, contentDescription = "Gateway URL", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0F172A),
                    titleContentColor = Color.White
                )
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
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = !isRegister,
                            onClick = { isRegister = false; errorMsg = null },
                            label = { Text("Đăng nhập") }
                        )
                        FilterChip(
                            selected = isRegister,
                            onClick = { isRegister = true; errorMsg = null },
                            label = { Text("Đăng ký Shipper") }
                        )
                    }

                    Spacer(Modifier.height(10.dp))
                    Text(
                        "Gateway: ${sessionManager.getGatewayUrl()}",
                        fontSize = 11.sp,
                        color = Color(0xFF64748B)
                    )
                    Spacer(Modifier.height(10.dp))

                    errorMsg?.let {
                        Text(
                            it,
                            color = Color(0xFFBE123C),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(Modifier.height(8.dp))
                    }

                    if (isRegister) {
                        OutlinedTextField(
                            value = fullName,
                            onValueChange = { fullName = it },
                            label = { Text("Họ và tên tài xế") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(Modifier.height(8.dp))
                        OutlinedTextField(
                            value = phone,
                            onValueChange = { phone = it },
                            label = { Text("Số điện thoại") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    } else {
                        OutlinedTextField(
                            value = identifier,
                            onValueChange = { identifier = it },
                            label = { Text("Mã tài xế / SĐT (VD: SHIPPER_01)") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Mật khẩu (Demo: 123456)") },
                        visualTransformation = PasswordVisualTransformation(),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(Modifier.height(14.dp))
                    Button(
                        onClick = {
                            scope.launch {
                                loading = true
                                errorMsg = null
                                try {
                                    val resp = if (isRegister) {
                                        api.register(RegisterRequest(fullName, phone, password, "SHIPPER"))
                                    } else {
                                        api.login(LoginRequest(identifier, password))
                                    }
                                    val auth = resp.body()?.data
                                    if (resp.isSuccessful && auth != null) {
                                        sessionManager.saveSession(auth.accessToken, auth.user)
                                        onLoginSuccess()
                                    } else {
                                        errorMsg = "Thao tác thất bại (HTTP ${resp.code()})"
                                    }
                                } catch (e: Exception) {
                                    errorMsg = "Lỗi kết nối Gateway: ${e.localizedMessage}"
                                } finally {
                                    loading = false
                                }
                            }
                        },
                        enabled = !loading,
                        colors = ButtonDefaults.buttonColors(containerColor = SpxOrange),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            if (loading) "Đang xử lý..."
                            else if (isRegister) "Đăng ký & Bắt đầu ca"
                            else "Đăng nhập Shipper"
                        )
                    }
                }
            }
        }
    }

    if (showServerDialog) {
        AlertDialog(
            onDismissRequest = { showServerDialog = false },
            title = { Text("Cấu hình API Gateway") },
            text = {
                OutlinedTextField(
                    value = gatewayInput,
                    onValueChange = { gatewayInput = it },
                    label = { Text("URL (Emulator: http://10.0.2.2:8080/)") },
                    singleLine = true
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    sessionManager.saveGatewayUrl(gatewayInput)
                    onGatewayUrlChanged(gatewayInput)
                    showServerDialog = false
                }) {
                    Text("Lưu")
                }
            },
            dismissButton = {
                TextButton(onClick = { showServerDialog = false }) {
                    Text("Hủy")
                }
            }
        )
    }
}

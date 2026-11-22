package vn.ptit.spx.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import vn.ptit.spx.android.data.RetrofitFactory
import vn.ptit.spx.android.data.SessionManager
import vn.ptit.spx.android.ui.PublicTrackingScreen
import vn.ptit.spx.android.ui.ShipperDashboardScreen
import vn.ptit.spx.android.ui.ShipperLoginScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val sessionManager = SessionManager(applicationContext)

        setContent {
            MaterialTheme {
                val navController = rememberNavController()
                var gatewayUrl by remember { mutableStateOf(sessionManager.getGatewayUrl()) }
                val api = remember(gatewayUrl) { RetrofitFactory.create(gatewayUrl, sessionManager) }

                val startDestination = if (!sessionManager.getToken().isNullOrBlank()) {
                    "shipper_dashboard"
                } else {
                    "public_tracking"
                }

                NavHost(navController = navController, startDestination = startDestination) {
                    composable("public_tracking") {
                        PublicTrackingScreen(
                            api = api,
                            onNavigateToShipperLogin = { navController.navigate("shipper_login") }
                        )
                    }
                    composable("shipper_login") {
                        ShipperLoginScreen(
                            api = api,
                            sessionManager = sessionManager,
                            onGatewayUrlChanged = { gatewayUrl = it },
                            onLoginSuccess = {
                                navController.navigate("shipper_dashboard") {
                                    popUpTo("public_tracking")
                                }
                            },
                            onBackToTracking = { navController.popBackStack() }
                        )
                    }
                    composable("shipper_dashboard") {
                        ShipperDashboardScreen(
                            api = api,
                            sessionManager = sessionManager,
                            onLogout = {
                                navController.navigate("public_tracking") {
                                    popUpTo(0)
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}

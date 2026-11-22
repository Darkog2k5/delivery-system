package vn.ptit.spx.android.data

import android.content.Context
import vn.ptit.spx.android.BuildConfig

class SessionManager(context: Context) {
    private val prefs = context.getSharedPreferences("spx_shipper_prefs", Context.MODE_PRIVATE)

    fun saveSession(token: String, user: UserDto) {
        prefs.edit()
            .putString("jwt_token", token)
            .putString("user_code", user.userCode)
            .putString("full_name", user.fullName)
            .putString("role", user.role)
            .putString("hub_code", user.hubCode ?: "HUB-Q1")
            .apply()
    }

    fun getToken(): String? = prefs.getString("jwt_token", null)
    fun getUserCode(): String? = prefs.getString("user_code", null)
    fun getFullName(): String? = prefs.getString("full_name", null)
    fun getRole(): String? = prefs.getString("role", null)

    fun saveGatewayUrl(url: String) {
        prefs.edit().putString("gateway_url", url).apply()
    }

    fun getGatewayUrl(): String =
        prefs.getString("gateway_url", BuildConfig.DEFAULT_GATEWAY_URL)
            ?: BuildConfig.DEFAULT_GATEWAY_URL

    fun clearSession() {
        prefs.edit()
            .remove("jwt_token")
            .remove("user_code")
            .remove("full_name")
            .remove("role")
            .remove("hub_code")
            .apply()
    }
}

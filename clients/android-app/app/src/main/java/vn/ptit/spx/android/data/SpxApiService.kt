package vn.ptit.spx.android.data

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import vn.ptit.spx.android.ui.WaybillUiHelper
import java.util.concurrent.TimeUnit

interface SpxApiService {

    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): Response<StandardApiResponse<AuthData>>

    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequest): Response<StandardApiResponse<AuthData>>

    @GET("api/tracking/{trackingCode}")
    suspend fun trackOrderPublic(
        @Path("trackingCode") trackingCode: String
    ): Response<StandardApiResponse<TrackingReadModel>>

    @GET("api/dispatch/shipper/profile")
    suspend fun getShipperProfile(): Response<StandardApiResponse<ShipperProfile>>

    @PATCH("api/dispatch/shipper/status")
    suspend fun updateShipperStatus(
        @Body body: ShipperStatusBody
    ): Response<StandardApiResponse<ShipperProfile>>

    @GET("api/dispatch/shipper/orders")
    suspend fun getShipperOrders(
        @Query("tab") tab: String? = null
    ): Response<StandardApiResponse<List<DispatchOrder>>>

    @POST("api/dispatch/orders/{trackingCode}/pickup")
    suspend fun confirmPickup(
        @Path("trackingCode") trackingCode: String,
        @Body body: PickupConfirmBody
    ): Response<StandardApiResponse<DispatchOrder>>

    @POST("api/dispatch/orders/{trackingCode}/transit")
    suspend fun advanceTransit(
        @Path("trackingCode") trackingCode: String,
        @Body body: TransitUpdateBody
    ): Response<StandardApiResponse<DispatchOrder>>

    @POST("api/dispatch/orders/{trackingCode}/deliver")
    suspend fun confirmDelivery(
        @Path("trackingCode") trackingCode: String,
        @Body body: DeliverConfirmBody
    ): Response<StandardApiResponse<DispatchOrder>>

    @POST("api/dispatch/orders/{trackingCode}/fail")
    suspend fun reportFailure(
        @Path("trackingCode") trackingCode: String,
        @Body body: FailDeliveryBody
    ): Response<StandardApiResponse<DispatchOrder>>
}

object RetrofitFactory {
    fun create(baseUrl: String, sessionManager: SessionManager): SpxApiService {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        val client = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .addInterceptor { chain ->
                val original = chain.request()
                val token = sessionManager.getToken()
                val reqBuilder = original.newBuilder()
                if (!token.isNullOrBlank()) {
                    reqBuilder.header("Authorization", "Bearer $token")
                }
                chain.proceed(reqBuilder.build())
            }
            .addInterceptor(logging)
            .build()

        return Retrofit.Builder()
            .baseUrl(WaybillUiHelper.normalizeBaseUrl(baseUrl))
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(SpxApiService::class.java)
    }
}

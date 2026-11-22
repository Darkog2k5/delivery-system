package vn.ptit.spx.orderservice.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tracking_code", nullable = false, unique = true, length = 32)
    private String trackingCode;

    @Column(name = "customer_code", nullable = false, length = 32)
    private String customerCode;

    @Column(name = "customer_name", nullable = false, length = 120)
    private String customerName;

    @Column(name = "sender_name", nullable = false, length = 120)
    private String senderName;

    @Column(name = "sender_phone", nullable = false, length = 20)
    private String senderPhone;

    @Column(name = "sender_address", nullable = false, length = 255)
    private String senderAddress;

    @Column(name = "sender_district", nullable = false, length = 80)
    private String senderDistrict;

    @Column(name = "receiver_name", nullable = false, length = 120)
    private String receiverName;

    @Column(name = "receiver_phone", nullable = false, length = 20)
    private String receiverPhone;

    @Column(name = "receiver_address", nullable = false, length = 255)
    private String receiverAddress;

    @Column(name = "receiver_district", nullable = false, length = 80)
    private String receiverDistrict;

    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;

    @Column(name = "actual_weight_gram", nullable = false)
    private int actualWeightGram;

    @Column(name = "length_cm", nullable = false)
    private double lengthCm;

    @Column(name = "width_cm", nullable = false)
    private double widthCm;

    @Column(name = "height_cm", nullable = false)
    private double heightCm;

    @Column(name = "volumetric_weight_gram", nullable = false)
    private int volumetricWeightGram;

    @Column(name = "chargeable_weight_gram", nullable = false)
    private int chargeableWeightGram;

    @Column(name = "distance_km", nullable = false)
    private double distanceKm;

    @Column(name = "shipping_fee", nullable = false)
    private long shippingFee;

    @Column(name = "cod_amount", nullable = false)
    private long codAmount;

    @Column(name = "note", length = 255)
    private String note;

    @Column(name = "hub_code", nullable = false, length = 32)
    private String hubCode;

    @Column(name = "assigned_shipper_code", length = 32)
    private String assignedShipperCode;

    @Column(name = "order_status", nullable = false, length = 32)
    private String orderStatus;

    @Column(name = "delivery_attempts", nullable = false)
    private int deliveryAttempts = 0;

    @Column(name = "fail_reason", length = 255)
    private String failReason;

    @Column(name = "proof_image_url", length = 255)
    private String proofImageUrl;

    @Column(name = "receiver_signature", length = 120)
    private String receiverSignature;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.createdAt == null) this.createdAt = now;
        if (this.updatedAt == null) this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTrackingCode() { return trackingCode; }
    public void setTrackingCode(String trackingCode) { this.trackingCode = trackingCode; }
    public String getCustomerCode() { return customerCode; }
    public void setCustomerCode(String customerCode) { this.customerCode = customerCode; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public String getSenderPhone() { return senderPhone; }
    public void setSenderPhone(String senderPhone) { this.senderPhone = senderPhone; }
    public String getSenderAddress() { return senderAddress; }
    public void setSenderAddress(String senderAddress) { this.senderAddress = senderAddress; }
    public String getSenderDistrict() { return senderDistrict; }
    public void setSenderDistrict(String senderDistrict) { this.senderDistrict = senderDistrict; }
    public String getReceiverName() { return receiverName; }
    public void setReceiverName(String receiverName) { this.receiverName = receiverName; }
    public String getReceiverPhone() { return receiverPhone; }
    public void setReceiverPhone(String receiverPhone) { this.receiverPhone = receiverPhone; }
    public String getReceiverAddress() { return receiverAddress; }
    public void setReceiverAddress(String receiverAddress) { this.receiverAddress = receiverAddress; }
    public String getReceiverDistrict() { return receiverDistrict; }
    public void setReceiverDistrict(String receiverDistrict) { this.receiverDistrict = receiverDistrict; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public int getActualWeightGram() { return actualWeightGram; }
    public void setActualWeightGram(int actualWeightGram) { this.actualWeightGram = actualWeightGram; }
    public double getLengthCm() { return lengthCm; }
    public void setLengthCm(double lengthCm) { this.lengthCm = lengthCm; }
    public double getWidthCm() { return widthCm; }
    public void setWidthCm(double widthCm) { this.widthCm = widthCm; }
    public double getHeightCm() { return heightCm; }
    public void setHeightCm(double heightCm) { this.heightCm = heightCm; }
    public int getVolumetricWeightGram() { return volumetricWeightGram; }
    public void setVolumetricWeightGram(int volumetricWeightGram) { this.volumetricWeightGram = volumetricWeightGram; }
    public int getChargeableWeightGram() { return chargeableWeightGram; }
    public void setChargeableWeightGram(int chargeableWeightGram) { this.chargeableWeightGram = chargeableWeightGram; }
    public double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }
    public long getShippingFee() { return shippingFee; }
    public void setShippingFee(long shippingFee) { this.shippingFee = shippingFee; }
    public long getCodAmount() { return codAmount; }
    public void setCodAmount(long codAmount) { this.codAmount = codAmount; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public String getHubCode() { return hubCode; }
    public void setHubCode(String hubCode) { this.hubCode = hubCode; }
    public String getAssignedShipperCode() { return assignedShipperCode; }
    public void setAssignedShipperCode(String assignedShipperCode) { this.assignedShipperCode = assignedShipperCode; }
    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }
    public int getDeliveryAttempts() { return deliveryAttempts; }
    public void setDeliveryAttempts(int deliveryAttempts) { this.deliveryAttempts = deliveryAttempts; }
    public String getFailReason() { return failReason; }
    public void setFailReason(String failReason) { this.failReason = failReason; }
    public String getProofImageUrl() { return proofImageUrl; }
    public void setProofImageUrl(String proofImageUrl) { this.proofImageUrl = proofImageUrl; }
    public String getReceiverSignature() { return receiverSignature; }
    public void setReceiverSignature(String receiverSignature) { this.receiverSignature = receiverSignature; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

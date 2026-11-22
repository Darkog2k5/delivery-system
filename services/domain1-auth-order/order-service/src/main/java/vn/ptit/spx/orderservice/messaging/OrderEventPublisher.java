package vn.ptit.spx.orderservice.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import vn.ptit.spx.orderservice.entity.Order;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
public class OrderEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);

    private final Optional<RabbitTemplate> rabbitTemplate;
    private final RestTemplate restTemplate = new RestTemplate();
    private final boolean rabbitEnabled;
    private final String dispatchEventUrl;
    private final String trackingEventUrl;

    public OrderEventPublisher(
            Optional<RabbitTemplate> rabbitTemplate,
            @Value("${rabbitmq.enabled:true}") boolean rabbitEnabled,
            @Value("${integration.dispatch-event-url}") String dispatchEventUrl,
            @Value("${integration.tracking-event-url}") String trackingEventUrl
    ) {
        this.rabbitTemplate = rabbitTemplate;
        this.rabbitEnabled = rabbitEnabled;
        this.dispatchEventUrl = dispatchEventUrl;
        this.trackingEventUrl = trackingEventUrl;
    }

    public void publishOrderCreated(Order order) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("eventId", UUID.randomUUID().toString());
        payload.put("eventType", "order.created");
        payload.put("trackingCode", order.getTrackingCode());
        payload.put("customerCode", order.getCustomerCode());
        payload.put("customerName", order.getCustomerName());
        payload.put("senderName", order.getSenderName());
        payload.put("senderPhone", order.getSenderPhone());
        payload.put("senderAddress", order.getSenderAddress());
        payload.put("senderDistrict", order.getSenderDistrict());
        payload.put("receiverName", order.getReceiverName());
        payload.put("receiverPhone", order.getReceiverPhone());
        payload.put("receiverAddress", order.getReceiverAddress());
        payload.put("receiverDistrict", order.getReceiverDistrict());
        payload.put("itemName", order.getItemName());
        payload.put("shippingFee", order.getShippingFee());
        payload.put("codAmount", order.getCodAmount());
        payload.put("hubCode", order.getHubCode());
        payload.put("orderStatus", order.getOrderStatus());
        payload.put("location", order.getSenderDistrict());
        payload.put("description", "Đơn hàng đã được khởi tạo thành công tại " + order.getSenderDistrict());
        payload.put("occurredAt", Instant.now().toString());

        if (rabbitEnabled && rabbitTemplate.isPresent()) {
            try {
                rabbitTemplate.get().convertAndSend(RabbitMqConfig.EXCHANGE_NAME, "order.created", payload);
                return;
            } catch (Exception ex) {
                log.warn("RabbitMQ publish failed, falling back to HTTP integration: {}", ex.getMessage());
            }
        }

        postHttp(dispatchEventUrl, payload);
        postHttp(trackingEventUrl, payload);
    }

    private void postHttp(String url, Map<String, Object> payload) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForEntity(url, new HttpEntity<>(payload, headers), String.class);
        } catch (Exception ex) {
            log.warn("HTTP event fallback to {} failed: {}", url, ex.getMessage());
        }
    }
}

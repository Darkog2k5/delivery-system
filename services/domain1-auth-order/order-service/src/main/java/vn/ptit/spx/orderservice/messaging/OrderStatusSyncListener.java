package vn.ptit.spx.orderservice.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import vn.ptit.spx.orderservice.service.OrderService;

import java.util.Map;

@Component
@ConditionalOnProperty(name = "rabbitmq.enabled", havingValue = "true")
public class OrderStatusSyncListener {

    private static final Logger log = LoggerFactory.getLogger(OrderStatusSyncListener.class);
    private final OrderService orderService;

    public OrderStatusSyncListener(OrderService orderService) {
        this.orderService = orderService;
    }

    @RabbitListener(queues = RabbitMqConfig.ORDER_STATUS_SYNC_QUEUE)
    public void onDispatchStatusUpdated(Map<String, Object> event) {
        try {
            String trackingCode = stringVal(event.get("trackingCode"));
            String status = stringVal(event.get("orderStatus"));
            String shipperCode = stringVal(event.get("assignedShipperCode"));
            Integer attempts = event.get("deliveryAttempts") instanceof Number n ? n.intValue() : null;
            String failReason = stringVal(event.get("failReason"));
            String proofImageUrl = stringVal(event.get("proofImageUrl"));
            String signature = stringVal(event.get("receiverSignature"));

            if (trackingCode != null) {
                orderService.syncFromDispatchEvent(trackingCode, status, shipperCode, attempts, failReason, proofImageUrl, signature);
            }
        } catch (Exception ex) {
            log.error("Failed to process dispatch status sync event: {}", ex.getMessage());
        }
    }

    private String stringVal(Object v) {
        return v == null ? null : String.valueOf(v);
    }
}

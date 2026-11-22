package vn.ptit.spx.orderservice.messaging;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "rabbitmq.enabled", havingValue = "true")
public class RabbitMqConfig {

    public static final String EXCHANGE_NAME = "spx.events.exchange";
    public static final String ORDER_STATUS_SYNC_QUEUE = "spx.order.status.sync.queue";

    @Bean
    public TopicExchange spxEventsExchange() {
        return ExchangeBuilder.topicExchange(EXCHANGE_NAME).durable(true).build();
    }

    @Bean
    public Queue orderStatusSyncQueue() {
        return QueueBuilder.durable(ORDER_STATUS_SYNC_QUEUE).build();
    }

    @Bean
    public Binding bindOrderStatusSync(Queue orderStatusSyncQueue, TopicExchange spxEventsExchange) {
        return BindingBuilder.bind(orderStatusSyncQueue)
                .to(spxEventsExchange)
                .with("dispatch.status.updated");
    }

    @Bean
    public MessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}

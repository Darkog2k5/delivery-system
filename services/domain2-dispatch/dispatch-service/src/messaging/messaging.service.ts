import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { v4Fallback } from './uuid-util';

export interface DomainEventPayload {
  eventId: string;
  eventType: string;
  trackingCode: string;
  orderStatus: string;
  hubCode?: string | null;
  assignedShipperCode?: string | null;
  assignedShipperName?: string | null;
  deliveryAttempts?: number;
  failReason?: string | null;
  proofImageUrl?: string | null;
  receiverSignature?: string | null;
  location: string;
  description: string;
  actorCode?: string;
  occurredAt: string;
}

@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingService.name);
  private readonly exchange = 'spx.events.exchange';
  private readonly orderCreatedQueue = 'spx.order.created.dispatch.queue';

  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private orderCreatedHandler: ((event: Record<string, any>) => Promise<void>) | null = null;

  private readonly rabbitEnabled =
    (process.env.RABBITMQ_ENABLED || 'true').toLowerCase() === 'true';
  private readonly rabbitUrl =
    process.env.RABBITMQ_URL || 'amqp://spx_user:spx_pass_2026@localhost:5672';
  private readonly orderEventUrl =
    process.env.ORDER_EVENT_URL || 'http://localhost:8082/api/orders/internal/events';
  private readonly trackingEventUrl =
    process.env.TRACKING_EVENT_URL || 'http://localhost:8084/api/tracking/internal/events';

  registerOrderCreatedHandler(
    handler: (event: Record<string, any>) => Promise<void>,
  ) {
    this.orderCreatedHandler = handler;
  }

  async onModuleInit() {
    if (!this.rabbitEnabled) {
      this.logger.log('RABBITMQ_ENABLED=false -> Running with async HTTP event fallback');
      return;
    }
    void this.connectWithRetry();
  }

  private async connectWithRetry() {
    const maxAttempts = 12;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.connection = await amqp.connect(this.rabbitUrl);
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
        await this.channel.assertQueue(this.orderCreatedQueue, { durable: true });
        await this.channel.bindQueue(this.orderCreatedQueue, this.exchange, 'order.created');

        await this.channel.consume(this.orderCreatedQueue, async (msg) => {
          if (!msg) return;
          try {
            const payload = JSON.parse(msg.content.toString());
            if (this.orderCreatedHandler) {
              await this.orderCreatedHandler(payload);
            }
            this.channel?.ack(msg);
          } catch (err: any) {
            this.logger.error(`Error handling order.created event: ${err?.message}`);
            this.channel?.nack(msg, false, false);
          }
        });

        this.logger.log('Connected to RabbitMQ spx.events.exchange');
        return;
      } catch (err: any) {
        this.channel = null;
        this.connection = null;
        if (attempt < maxAttempts) {
          this.logger.warn(
            `RabbitMQ connection attempt ${attempt}/${maxAttempts} failed (${err?.message}). Retrying in 3s...`,
          );
          await new Promise((r) => setTimeout(r, 3000));
        } else {
          this.logger.warn(
            `RabbitMQ connection unavailable after ${maxAttempts} attempts. Falling back to HTTP event delivery.`,
          );
        }
      }
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // ignore close errors during shutdown
    }
  }

  async publishDispatchStatusUpdated(
    partial: Omit<DomainEventPayload, 'eventId' | 'eventType' | 'occurredAt'>,
  ): Promise<void> {
    const event: DomainEventPayload = {
      ...partial,
      eventId: v4Fallback(),
      eventType: 'dispatch.status.updated',
      occurredAt: new Date().toISOString(),
    };

    if (this.rabbitEnabled && this.channel) {
      try {
        this.channel.publish(
          this.exchange,
          'dispatch.status.updated',
          Buffer.from(JSON.stringify(event)),
          { persistent: true, contentType: 'application/json' },
        );
        return;
      } catch (err: any) {
        this.logger.warn(`RabbitMQ publish failed: ${err?.message}`);
      }
    }

    await Promise.allSettled([
      this.postJson(this.orderEventUrl, event),
      this.postJson(this.trackingEventUrl, event),
    ]);
  }

  private async postJson(url: string, body: Record<string, any>) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err: any) {
      this.logger.warn(`HTTP event fallback to ${url} failed: ${err?.message}`);
    }
  }
}

using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using TrackingService.Models;

namespace TrackingService.Services;

public class RabbitMqConsumerService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RabbitMqConsumerService> _logger;
    private readonly IConfiguration _config;
    private IConnection? _connection;
    private IModel? _channel;

    public RabbitMqConsumerService(
        IServiceProvider serviceProvider,
        ILogger<RabbitMqConsumerService> logger,
        IConfiguration config)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _config = config;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var enabled = (_config["RABBITMQ_ENABLED"] ?? Environment.GetEnvironmentVariable("RABBITMQ_ENABLED") ?? "true")
            .Equals("true", StringComparison.OrdinalIgnoreCase);

        if (!enabled)
        {
            _logger.LogInformation("RABBITMQ_ENABLED=false -> Tracking Service running with HTTP event receiver");
            return;
        }

        var host = _config["RABBITMQ_HOST"] ?? Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "localhost";
        var portStr = _config["RABBITMQ_PORT"] ?? Environment.GetEnvironmentVariable("RABBITMQ_PORT") ?? "5672";
        var user = _config["RABBITMQ_USER"] ?? Environment.GetEnvironmentVariable("RABBITMQ_USER") ?? "spx_user";
        var pass = _config["RABBITMQ_PASS"] ?? Environment.GetEnvironmentVariable("RABBITMQ_PASS") ?? "spx_pass_2026";
        var port = int.TryParse(portStr, out var parsed) ? parsed : 5672;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = host,
                    Port = port,
                    UserName = user,
                    Password = pass,
                    DispatchConsumersAsync = true
                };

                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();

                const string exchange = "spx.events.exchange";
                const string queue = "spx.tracking.events.queue";

                _channel.ExchangeDeclare(exchange, ExchangeType.Topic, durable: true);
                _channel.QueueDeclare(queue, durable: true, exclusive: false, autoDelete: false);
                _channel.QueueBind(queue, exchange, "order.#");
                _channel.QueueBind(queue, exchange, "dispatch.#");

                var consumer = new AsyncEventingBasicConsumer(_channel);
                consumer.Received += async (_, ea) =>
                {
                    try
                    {
                        var bodyJson = Encoding.UTF8.GetString(ea.Body.ToArray());
                        var input = JsonSerializer.Deserialize<TrackingEventInput>(bodyJson,
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        if (input != null)
                        {
                            using var scope = _serviceProvider.CreateScope();
                            var projector = scope.ServiceProvider.GetRequiredService<TrackingProjectorService>();
                            await projector.ApplyEventAsync(input);
                        }
                        _channel.BasicAck(ea.DeliveryTag, false);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error processing RabbitMQ tracking event");
                        _channel.BasicNack(ea.DeliveryTag, false, false);
                    }
                };

                _channel.BasicConsume(queue, autoAck: false, consumer: consumer);
                _logger.LogInformation("Connected to RabbitMQ spx.events.exchange for CQRS Tracking projection");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning("RabbitMQ unavailable ({Message}). Retrying in 5s...", ex.Message);
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }

    public override void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
        base.Dispose();
    }
}

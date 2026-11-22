using System.Text.Json;
using TrackingService.Repositories;
using TrackingService.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var storageMode = (Environment.GetEnvironmentVariable("STORAGE_MODE") ?? "mongo").ToLowerInvariant();
if (storageMode == "file")
{
    var localDir = Environment.GetEnvironmentVariable("LOCAL_DB_DIR") ?? Path.Combine(Directory.GetCurrentDirectory(), ".local-data");
    builder.Services.AddSingleton<ITrackingRepository>(_ => new FileTrackingRepository(localDir));
}
else
{
    var conn = Environment.GetEnvironmentVariable("MONGO_CONNECTION_STRING")
               ?? "mongodb://spx_mongo:spx_mongo_pass_2026@localhost:27017/?authSource=admin";
    var dbName = Environment.GetEnvironmentVariable("MONGO_DATABASE") ?? "tracking_db";
    builder.Services.AddSingleton<ITrackingRepository>(_ => new MongoTrackingRepository(conn, dbName));
}

builder.Services.AddScoped<TrackingProjectorService>();
builder.Services.AddScoped<TrackingSeedService>();
builder.Services.AddHostedService<RabbitMqConsumerService>();

var app = builder.Build();

app.UseCors();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<TrackingSeedService>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    for (var attempt = 1; attempt <= 6; attempt++)
    {
        try
        {
            await seeder.SeedAsync();
            break;
        }
        catch (Exception ex) when (attempt < 6)
        {
            logger.LogWarning("Seed attempt {Attempt}/6 failed ({Message}). Retrying in 2s...", attempt, ex.Message);
            await Task.Delay(TimeSpan.FromSeconds(2));
        }
    }
}

app.Run();

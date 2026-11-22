FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY TrackingService.csproj ./
RUN dotnet restore TrackingService.csproj
COPY . ./
RUN dotnet publish TrackingService.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8084
ENV ASPNETCORE_URLS=http://+:8084
ENTRYPOINT ["dotnet", "TrackingService.dll"]

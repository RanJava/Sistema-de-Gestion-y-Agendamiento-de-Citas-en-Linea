using BarberLosPeluchitos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuración de PostgreSQL con Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Configuración de CORS permisiva para desarrollo
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 3. Registro de Controladores y Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 4. Configuración del Pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "BarberLosPeluchitos API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAll");

// Redirección de la raíz "/" a Swagger
app.MapGet("/", () => Results.Redirect("/swagger"));

// Endpoint de Health Check
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "Healthy",
    system = "BarberLosPeluchitos API",
    timestamp = DateTime.UtcNow
}));

// Mapeo de Controladores
app.MapControllers();

app.Run();

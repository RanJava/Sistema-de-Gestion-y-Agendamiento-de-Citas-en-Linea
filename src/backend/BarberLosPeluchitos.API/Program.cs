using BarberLosPeluchitos.Core.Interfaces;
using BarberLosPeluchitos.Infrastructure.Data;
using BarberLosPeluchitos.Infrastructure.Repositories;
using BarberLosPeluchitos.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuración de PostgreSQL con Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Inyección de Dependencias de Servicios y Repositorios
builder.Services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<IBarberoRepository, BarberoRepository>();
builder.Services.AddScoped<ITurnoRepository, TurnoRepository>();
builder.Services.AddScoped<IServicioRepository, ServicioRepository>();
builder.Services.AddScoped<ICitaRepository, CitaRepository>();

// 3. Configuración de CORS permisiva para desarrollo
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 4. Registro de Controladores y Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Seeding inicial de catálogo de servicios si está vacío
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    if (!context.Servicios.Any())
    {
        context.Servicios.AddRange(
            new BarberLosPeluchitos.Core.Entities.Servicio { Nombre = "Corte Clásico", DuracionBase = 30, PrecioBase = 35.00m },
            new BarberLosPeluchitos.Core.Entities.Servicio { Nombre = "Perfilado de Barba", DuracionBase = 20, PrecioBase = 25.00m },
            new BarberLosPeluchitos.Core.Entities.Servicio { Nombre = "Combo Completo Peluchitos", DuracionBase = 45, PrecioBase = 50.00m },
            new BarberLosPeluchitos.Core.Entities.Servicio { Nombre = "Corte Fade / Degradado", DuracionBase = 35, PrecioBase = 40.00m },
            new BarberLosPeluchitos.Core.Entities.Servicio { Nombre = "Tratamiento Capilar & Lavado", DuracionBase = 25, PrecioBase = 30.00m }
        );
        context.SaveChanges();
    }
}

// 5. Configuración del Pipeline HTTP
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

// Mapeo de Controladores
app.MapControllers();

app.Run();

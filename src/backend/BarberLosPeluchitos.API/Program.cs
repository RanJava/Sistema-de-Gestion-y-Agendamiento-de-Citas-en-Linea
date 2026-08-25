using System.Text;
using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using BarberLosPeluchitos.Infrastructure.Data;
using BarberLosPeluchitos.Infrastructure.Repositories;
using BarberLosPeluchitos.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuración de PostgreSQL con Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Inyección de Dependencias de Servicios y Repositorios
builder.Services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<IBarberoRepository, BarberoRepository>();
builder.Services.AddScoped<ITurnoRepository, TurnoRepository>();
builder.Services.AddScoped<IServicioRepository, ServicioRepository>();
builder.Services.AddScoped<ICitaRepository, CitaRepository>();

// 3. Configuración de Autenticación con JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? "BarberLosPeluchitosKeySeguraSuperSecreta2026!#$JWT";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "BarberLosPeluchitos";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "BarberLosPeluchitosApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 4. Configuración de CORS permisiva para desarrollo
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 5. Registro de Controladores y Swagger con soporte para Bearer Token
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BarberLosPeluchitos API",
        Version = "v1",
        Description = "Sistema de Gestión y Agendamiento de Citas en Línea con Autenticación JWT y Roles."
    });

    var scheme = new OpenApiSecurityScheme
    {
        Description = "Encabezado de autorización JWT utilizando el esquema Bearer. Ejemplo: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    };

    c.AddSecurityDefinition("Bearer", scheme);

    c.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", doc),
            new List<string>()
        }
    });
});

var app = builder.Build();

// 6. Inicialización de base de datos y Seeding (Servicios y Administrador Seed)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

    // Crear tabla administrador si no existiera en PostgreSQL
    context.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS administrador (
            id_administrador serial PRIMARY KEY,
            nombre varchar(50) NOT NULL,
            correo varchar(100) UNIQUE NOT NULL,
            contrasena_hash varchar(255) NOT NULL,
            fecha_creacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    ");

    // Seed de Servicios
    if (!context.Servicios.Any())
    {
        context.Servicios.AddRange(
            new Servicio { Nombre = "Corte Clásico", DuracionBase = 30, PrecioBase = 35.00m },
            new Servicio { Nombre = "Perfilado de Barba", DuracionBase = 20, PrecioBase = 25.00m },
            new Servicio { Nombre = "Combo Completo Peluchitos", DuracionBase = 45, PrecioBase = 50.00m },
            new Servicio { Nombre = "Corte Fade / Degradado", DuracionBase = 35, PrecioBase = 40.00m },
            new Servicio { Nombre = "Tratamiento Capilar & Lavado", DuracionBase = 25, PrecioBase = 30.00m }
        );
        context.SaveChanges();
    }

    // Seed del Administrador Principal
    if (!context.Administradores.Any())
    {
        context.Administradores.Add(new Administrador
        {
            Nombre = "Administrador Principal",
            Correo = "admin@peluchitos.com",
            ContrasenaHash = hasher.HashPassword("AdminPeluchitos2026!"),
            FechaCreacion = DateTime.UtcNow
        });
        context.SaveChanges();
    }
}

// 7. Configuración del Pipeline HTTP
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

app.UseAuthentication();
app.UseAuthorization();

// Redirección de la raíz "/" a Swagger
app.MapGet("/", () => Results.Redirect("/swagger"));

// Mapeo de Controladores
app.MapControllers();

app.Run();

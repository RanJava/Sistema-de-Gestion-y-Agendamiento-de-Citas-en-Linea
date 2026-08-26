using System.Text;
using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using BarberLosPeluchitos.Infrastructure.Data;
using BarberLosPeluchitos.Infrastructure.Repositories;
using BarberLosPeluchitos.Infrastructure.Security;
using BarberLosPeluchitos.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuración de PostgreSQL con Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString)
           .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

// 2. Inyección de Dependencias de Servicios y Repositorios
builder.Services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<IBarberoRepository, BarberoRepository>();
builder.Services.AddScoped<ITurnoRepository, TurnoRepository>();
builder.Services.AddScoped<IServicioRepository, ServicioRepository>();
builder.Services.AddScoped<ICitaRepository, CitaRepository>();
builder.Services.AddScoped<IEmailSender, MockEmailSender>();
builder.Services.AddScoped<INotificacionService, NotificacionService>();

// HU-10: Configuración de Opciones y Registro del HostedService de Recordatorio de Citas Próximas
builder.Services.Configure<BarberLosPeluchitos.Core.Options.RecordatorioOptions>(
    builder.Configuration.GetSection("Recordatorios"));
builder.Services.AddHostedService<RecordatorioCitasBackgroundService>();

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

    // Aplicar migraciones pendientes de PostgreSQL
    context.Database.Migrate();

    // Crear tabla administrador y notificacion_log si no existieran en PostgreSQL
    context.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS administrador (
            id_administrador serial PRIMARY KEY,
            nombre varchar(50) NOT NULL,
            correo varchar(100) UNIQUE NOT NULL,
            contrasena_hash varchar(255) NOT NULL,
            fecha_creacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notificacion_log (
            id_log serial PRIMARY KEY,
            id_cita int NOT NULL,
            destinatario varchar(100) NOT NULL,
            tipo varchar(30) NOT NULL DEFAULT 'EmailConfirmacion',
            exitoso boolean NOT NULL,
            mensaje varchar(255) NOT NULL,
            error_detalle text NULL,
            fecha_registro timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE cita ADD COLUMN IF NOT EXISTS recordatorio_enviado boolean NOT NULL DEFAULT false;
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

    // Seed de Barberos de Ejemplo
    if (!context.Barberos.Any())
    {
        var barbero1 = new Barbero
        {
            Nombre = "Carlos 'El Tijeras' Gómez",
            Telefono = "70011223",
            HorariosDisponibilidad = new List<HorarioDisponibilidad>
            {
                new HorarioDisponibilidad { DiaSemana = "Lunes", HoraInicio = new TimeOnly(9, 0), HoraFin = new TimeOnly(18, 0) },
                new HorarioDisponibilidad { DiaSemana = "Martes", HoraInicio = new TimeOnly(9, 0), HoraFin = new TimeOnly(18, 0) },
                new HorarioDisponibilidad { DiaSemana = "Miércoles", HoraInicio = new TimeOnly(9, 0), HoraFin = new TimeOnly(18, 0) },
                new HorarioDisponibilidad { DiaSemana = "Jueves", HoraInicio = new TimeOnly(9, 0), HoraFin = new TimeOnly(18, 0) },
                new HorarioDisponibilidad { DiaSemana = "Viernes", HoraInicio = new TimeOnly(9, 0), HoraFin = new TimeOnly(18, 0) },
                new HorarioDisponibilidad { DiaSemana = "Sábado", HoraInicio = new TimeOnly(9, 0), HoraFin = new TimeOnly(14, 0) }
            }
        };

        var barbero2 = new Barbero
        {
            Nombre = "Mateo 'BarbaPro' Rodríguez",
            Telefono = "70044556",
            HorariosDisponibilidad = new List<HorarioDisponibilidad>
            {
                new HorarioDisponibilidad { DiaSemana = "Martes", HoraInicio = new TimeOnly(10, 0), HoraFin = new TimeOnly(19, 0) },
                new HorarioDisponibilidad { DiaSemana = "Miércoles", HoraInicio = new TimeOnly(10, 0), HoraFin = new TimeOnly(19, 0) },
                new HorarioDisponibilidad { DiaSemana = "Jueves", HoraInicio = new TimeOnly(10, 0), HoraFin = new TimeOnly(19, 0) },
                new HorarioDisponibilidad { DiaSemana = "Viernes", HoraInicio = new TimeOnly(10, 0), HoraFin = new TimeOnly(19, 0) },
                new HorarioDisponibilidad { DiaSemana = "Sábado", HoraInicio = new TimeOnly(9, 0), HoraFin = new TimeOnly(16, 0) }
            }
        };

        context.Barberos.AddRange(barbero1, barbero2);
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
// HU-10: Recordatorio de cita próxima - Configuración de pipeline

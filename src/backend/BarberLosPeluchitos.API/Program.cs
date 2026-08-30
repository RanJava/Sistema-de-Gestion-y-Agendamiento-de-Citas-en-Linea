using System.Text;
using BarberLosPeluchitos.API.Filters;
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

// 1. Configuración de Servicios Criptográficos y de Seguridad (Ley 164 / D.S. 1793)
builder.Services.AddSingleton<IEncryptionService, AesEncryptionService>();
builder.Services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuditoriaService, AuditoriaService>();
builder.Services.AddScoped<AuditAdminAccessFilter>();

// 2. Configuración de PostgreSQL con Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>((sp, options) =>
{
    var encryptionService = sp.GetRequiredService<IEncryptionService>();
    options.UseNpgsql(connectionString)
           .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

// 3. Inyección de Dependencias de Repositorios y Servicios de Dominio
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

// 4. Configuración de Autenticación con JWT
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

// 5. Configuración de CORS permisiva para desarrollo
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 6. Registro de Controladores y Swagger con soporte para Bearer Token
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BarberLosPeluchitos API",
        Version = "v1",
        Description = "Sistema de Gestión y Agendamiento de Citas en Línea con Cifrado AES-256, Auditoría Inalterable y Habeas Data."
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

// 7. Inicialización de base de datos, Auditoría Inalterable y Seeding
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    var encryption = scope.ServiceProvider.GetRequiredService<IEncryptionService>();

    try
    {
        // Aplicar migraciones o schema updates en PostgreSQL
        context.Database.ExecuteSqlRaw(@"
            -- Tabla administrador y columnas de seguridad
            CREATE TABLE IF NOT EXISTS administrador (
                id_administrador serial PRIMARY KEY,
                nombre varchar(50) NOT NULL,
                correo varchar(255) NOT NULL,
                correo_hash varchar(128) NULL,
                telefono varchar(255) NULL,
                contrasena_hash varchar(255) NOT NULL,
                fecha_creacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            ALTER TABLE administrador ADD COLUMN IF NOT EXISTS correo_hash varchar(128) NULL;
            ALTER TABLE administrador ADD COLUMN IF NOT EXISTS telefono varchar(255) NULL;
            CREATE UNIQUE INDEX IF NOT EXISTS ix_administrador_correo_hash ON administrador (correo_hash);

            -- Columnas de seguridad y Habeas Data en cliente
            ALTER TABLE cliente ADD COLUMN IF NOT EXISTS correo_hash varchar(128) NULL;
            ALTER TABLE cliente ADD COLUMN IF NOT EXISTS codigo_verificacion varchar(255) NULL;
            ALTER TABLE cliente ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;
            ALTER TABLE cliente ADD COLUMN IF NOT EXISTS fecha_eliminacion timestamp NULL;
            ALTER TABLE cliente ALTER COLUMN correo TYPE varchar(255);
            ALTER TABLE cliente ALTER COLUMN telefono TYPE varchar(255);
            CREATE UNIQUE INDEX IF NOT EXISTS ix_cliente_correo_hash ON cliente (correo_hash);

            -- Cifrado de teléfono en barbero y remoción de correo
            ALTER TABLE barbero DROP COLUMN IF EXISTS correo;
            ALTER TABLE barbero DROP COLUMN IF EXISTS correo_hash;
            ALTER TABLE barbero ALTER COLUMN telefono TYPE varchar(255);

            -- Tabla notificacion_log
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

            -- TABLA DE LOGS DE AUDITORIA INALTERABLE (Ley 164 / Código Penal Art. 363 ter)
            CREATE TABLE IF NOT EXISTS logs_auditoria (
                id_log bigserial PRIMARY KEY,
                id_administrador int NULL,
                recurso_afectado varchar(50) NOT NULL,
                id_recurso varchar(50) NULL,
                accion varchar(20) NOT NULL,
                fecha_hora timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                ip_origen varchar(45) NOT NULL,
                detalles varchar(500) NULL,
                CONSTRAINT fk_logs_auditoria_admin FOREIGN KEY (id_administrador) REFERENCES administrador (id_administrador) ON DELETE SET NULL
            );

            CREATE INDEX IF NOT EXISTS ix_logs_auditoria_recurso_fecha ON logs_auditoria (recurso_afectado, fecha_hora);
            CREATE INDEX IF NOT EXISTS ix_logs_auditoria_admin ON logs_auditoria (id_administrador);

            -- Función y Trigger de Inmutabilidad Forense (Bloquea UPDATE y DELETE)
            CREATE OR REPLACE FUNCTION fn_prevent_logs_auditoria_tamper()
            RETURNS TRIGGER AS $$
            BEGIN
                RAISE EXCEPTION 'Operación denegada: Los registros en logs_auditoria son estrictamente inmutables conforme a la Ley 164 y Código Penal Art. 363 ter.';
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS tg_logs_auditoria_prevent_tamper ON logs_auditoria;
            CREATE TRIGGER tg_logs_auditoria_prevent_tamper
            BEFORE UPDATE OR DELETE ON logs_auditoria
            FOR EACH ROW EXECUTE FUNCTION fn_prevent_logs_auditoria_tamper();
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
        var adminCorreo = "admin@peluchitos.com";
        var adminCorreoHash = encryption.ComputeHmacSha256(adminCorreo);
        var adminExistente = context.Administradores.FirstOrDefault(a => a.CorreoHash == adminCorreoHash);

        if (adminExistente == null)
        {
            context.Administradores.Add(new Administrador
            {
                Nombre = "Administrador Principal",
                Correo = adminCorreo,
                CorreoHash = adminCorreoHash,
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

        // 7.4 Migración y Re-cifrado automático de datos preexistentes (Cliente, Barbero, Administrador)
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        await DataEncryptionMigrator.MigrateAllAsync(context, encryption, logger);
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Nota: No se pudo conectar a PostgreSQL durante el arranque. Verifique la conexión si ejecuta localmente.");
    }
}

// 8. Configuración del Pipeline HTTP
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

using BarberLosPeluchitos.Core.Interfaces;
using BarberLosPeluchitos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BarberLosPeluchitos.Infrastructure.Security;

/// <summary>
/// Servicio de migración de datos para cifrar en reposo registros preexistentes de
/// Cliente, Barbero y Administrador y generar sus correspondientes blind indexes (HMAC-SHA256).
/// Cumple con la Ley 164 y D.S. 1793.
/// </summary>
public static class DataEncryptionMigrator
{
    public static async Task<DataMigrationResult> MigrateAllAsync(
        ApplicationDbContext context,
        IEncryptionService encryptionService,
        ILogger? logger = null,
        CancellationToken cancellationToken = default)
    {
        var result = new DataMigrationResult();

        try
        {
            // 1. MIGRAR CLIENTES (Solo aquellos sin CorreoHash para no repetir el proceso)
            var clientes = await context.Clientes.ToListAsync(cancellationToken);
            var clientesPendientes = clientes.Where(c => string.IsNullOrEmpty(c.CorreoHash)).ToList();

            foreach (var cliente in clientesPendientes)
            {
                var hashCalculado = encryptionService.ComputeHmacSha256(cliente.Correo);
                cliente.CorreoHash = hashCalculado;

                // Marcar como modificado para que EF Core aplique el ValueConverter AES-256
                context.Entry(cliente).Property(c => c.Telefono).IsModified = true;
                context.Entry(cliente).Property(c => c.Correo).IsModified = true;
                context.Entry(cliente).Property(c => c.CorreoHash).IsModified = true;

                if (!string.IsNullOrEmpty(cliente.CodigoVerificacion))
                {
                    context.Entry(cliente).Property(c => c.CodigoVerificacion).IsModified = true;
                }

                result.ClientesMigrados++;
            }

            // 2. MIGRAR ADMINISTRADORES (Solo aquellos sin CorreoHash)
            var administradores = await context.Administradores.ToListAsync(cancellationToken);
            var administradoresPendientes = administradores.Where(a => string.IsNullOrEmpty(a.CorreoHash)).ToList();

            foreach (var admin in administradoresPendientes)
            {
                var hashCalculado = encryptionService.ComputeHmacSha256(admin.Correo);
                admin.CorreoHash = hashCalculado;

                context.Entry(admin).Property(a => a.Correo).IsModified = true;
                context.Entry(admin).Property(a => a.CorreoHash).IsModified = true;

                if (!string.IsNullOrEmpty(admin.Telefono))
                {
                    context.Entry(admin).Property(a => a.Telefono).IsModified = true;
                }

                result.AdministradoresMigrados++;
            }

            // 3. MIGRAR BARBEROS (Cifrado de Telefono si hay clientes/admins pendientes)
            var barberos = await context.Barberos.ToListAsync(cancellationToken);
            var requiereMigracionBarberos = clientesPendientes.Count > 0 || administradoresPendientes.Count > 0;

            if (requiereMigracionBarberos)
            {
                foreach (var barbero in barberos)
                {
                    context.Entry(barbero).Property(b => b.Telefono).IsModified = true;
                    result.BarberosMigrados++;
                }
            }

            var totalMigrados = result.ClientesMigrados + result.AdministradoresMigrados + result.BarberosMigrados;

            if (totalMigrados > 0)
            {
                await context.SaveChangesAsync(cancellationToken);
                result.Exitoso = true;
                result.Mensaje = $"Migración inicial completada exitosamente. Registros cifrados -> Clientes: {result.ClientesMigrados}, Administradores: {result.AdministradoresMigrados}, Barberos: {result.BarberosMigrados}.";
                logger?.LogInformation(result.Mensaje);
            }
            else
            {
                result.Exitoso = true;
                result.Mensaje = "Todos los registros ya se encuentran cifrados y con blind index (HMAC-SHA256). Proceso omitido.";
                logger?.LogInformation("Cifrado verificado: No hay registros pendientes de migración.");
            }
        }
        catch (Exception ex)
        {
            result.Exitoso = false;
            result.Mensaje = $"Error durante la migración de datos: {ex.Message}";
            logger?.LogError(ex, "Error al re-guardar datos con cifrado.");
        }

        return result;
    }
}

public class DataMigrationResult
{
    public bool Exitoso { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public int ClientesMigrados { get; set; }
    public int AdministradoresMigrados { get; set; }
    public int BarberosMigrados { get; set; }
}

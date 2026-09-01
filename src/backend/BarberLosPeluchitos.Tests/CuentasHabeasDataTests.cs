using BarberLosPeluchitos.Core.DTOs;
using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Infrastructure.Data;
using BarberLosPeluchitos.Infrastructure.Repositories;
using BarberLosPeluchitos.Infrastructure.Security;
using BarberLosPeluchitos.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace BarberLosPeluchitos.Tests;

public class CuentasHabeasDataTests
{
    private DbContextOptions<ApplicationDbContext> CrearOpcionesBaseDatos()
    {
        return new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
    }

    [Fact]
    public async Task BajaLogicaAsync_SobrescribeDatosPII_InvalidaPasswordYRompeBlindIndex()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        var encryptionService = new AesEncryptionService(new ConfigurationBuilder().Build());
        using var context = new ApplicationDbContext(options, encryptionService);
        var repo = new ClienteRepository(context, encryptionService);

        var cliente = new Cliente
        {
            IdCliente = 100,
            Nombre = "Carlos Mendoza",
            Telefono = "77123456",
            Correo = "carlos.mendoza@ejemplo.bo",
            CorreoHash = encryptionService.ComputeHmacSha256("carlos.mendoza@ejemplo.bo"),
            ContrasenaHash = "hashedPassword123",
            FechaRegistro = DateOnly.FromDateTime(DateTime.UtcNow),
            Activo = true
        };

        context.Clientes.Add(cliente);
        await context.SaveChangesAsync();

        // Act - Baja lógica con anonimización (Habeas Data Art. 130 CPE)
        var resultado = await repo.BajaLogicaAsync(100);

        // Assert
        Assert.True(resultado);

        var clienteAnonimizado = await context.Clientes.FindAsync(100);
        Assert.NotNull(clienteAnonimizado);
        Assert.False(clienteAnonimizado.Activo);
        Assert.Equal("Usuario eliminado", clienteAnonimizado.Nombre);
        Assert.Null(clienteAnonimizado.CorreoHash); // Blind index removido
        Assert.Equal("INVALIDATED", clienteAnonimizado.ContrasenaHash);
        Assert.NotNull(clienteAnonimizado.FechaEliminacion);
        Assert.StartsWith("anon-", clienteAnonimizado.Correo);
        Assert.NotEqual("77123456", clienteAnonimizado.Telefono);
        Assert.NotEqual("carlos.mendoza@ejemplo.bo", clienteAnonimizado.Correo);

        // Validar que la búsqueda por correo original ya no retorne el registro
        var busqueda = await repo.BuscarPorCorreoAsync("carlos.mendoza@ejemplo.bo");
        Assert.Null(busqueda);
    }

    [Fact]
    public async Task ActualizarAsync_Rectificacion_ActualizaBlindIndexYDatosCifrados()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        var encryptionService = new AesEncryptionService(new ConfigurationBuilder().Build());
        using var context = new ApplicationDbContext(options, encryptionService);
        var repo = new ClienteRepository(context, encryptionService);

        var cliente = new Cliente
        {
            IdCliente = 200,
            Nombre = "Maria Lopez",
            Telefono = "70011223",
            Correo = "maria.antigua@ejemplo.bo",
            ContrasenaHash = "hashedPassword",
            Activo = true
        };

        await repo.GuardarAsync(cliente);
        var hashOriginal = cliente.CorreoHash;

        // Act - Rectificación de datos personales (Habeas Data)
        cliente.Nombre = "Maria Lopez Rectificada";
        cliente.Telefono = "79988776";
        cliente.Correo = "maria.nueva@ejemplo.bo";

        await repo.ActualizarAsync(cliente);

        // Assert
        var clienteActualizado = await repo.BuscarPorIdAsync(200);
        Assert.NotNull(clienteActualizado);
        Assert.Equal("Maria Lopez Rectificada", clienteActualizado.Nombre);
        Assert.Equal("79988776", clienteActualizado.Telefono);
        Assert.Equal("maria.nueva@ejemplo.bo", clienteActualizado.Correo);
        Assert.NotEqual(hashOriginal, clienteActualizado.CorreoHash);
        Assert.Equal(encryptionService.ComputeHmacSha256("maria.nueva@ejemplo.bo"), clienteActualizado.CorreoHash);

        // La búsqueda por el nuevo correo debe encontrarlo
        var encontrado = await repo.BuscarPorCorreoAsync("maria.nueva@ejemplo.bo");
        Assert.NotNull(encontrado);
        Assert.Equal(200, encontrado.IdCliente);
    }

    [Fact]
    public async Task BajaLogica_PreservaIntegridadReferencialDeCitas()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        var encryptionService = new AesEncryptionService(new ConfigurationBuilder().Build());
        using var context = new ApplicationDbContext(options, encryptionService);
        var repo = new ClienteRepository(context, encryptionService);

        var cliente = new Cliente
        {
            IdCliente = 300,
            Nombre = "Roberto Gomez",
            Telefono = "71234567",
            Correo = "roberto@ejemplo.bo",
            ContrasenaHash = "hashed",
            Activo = true
        };

        var barbero = new Barbero { IdBarbero = 1, Nombre = "Barbero 1", Telefono = "70000001" };
        var servicio = new Servicio { IdServicio = 1, Nombre = "Corte Clasico", DuracionBase = 30, PrecioBase = 50 };
        var turno = new Turno { IdTurno = 1, IdBarbero = 1, Fecha = DateOnly.FromDateTime(DateTime.UtcNow), HoraInicio = new TimeOnly(10, 0), HoraFin = new TimeOnly(10, 30), Estado = "Reservado" };
        
        var cita = new Cita
        {
            IdCita = 1,
            IdCliente = 300,
            IdServicio = 1,
            IdTurno = 1,
            FechaHora = DateTime.UtcNow,
            Duracion = 30,
            Precio = 50,
            Estado = "Atendida"
        };

        context.Barberos.Add(barbero);
        context.Servicios.Add(servicio);
        context.Turnos.Add(turno);
        context.Clientes.Add(cliente);
        context.Citas.Add(cita);
        await context.SaveChangesAsync();

        // Act - Baja lógica
        var bajaExitosa = await repo.BajaLogicaAsync(300);

        // Assert
        Assert.True(bajaExitosa);

        // La cita histórica sigue existiendo y conserva servicio, barbero y precio snapshot
        var citaEnDb = await context.Citas.Include(c => c.Cliente).FirstOrDefaultAsync(c => c.IdCita == 1);
        Assert.NotNull(citaEnDb);
        Assert.Equal(300, citaEnDb.IdCliente);
        Assert.Equal(50, citaEnDb.Precio);
        Assert.NotNull(citaEnDb.Cliente);
        Assert.False(citaEnDb.Cliente.Activo);
        Assert.Equal("Usuario eliminado", citaEnDb.Cliente.Nombre); // PII anonimizada
    }
}

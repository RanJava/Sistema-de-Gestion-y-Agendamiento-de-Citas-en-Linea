using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Infrastructure.Data;
using BarberLosPeluchitos.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BarberLosPeluchitos.Tests;

public class ClienteHistorialConsultaTests
{
    private DbContextOptions<ApplicationDbContext> CrearOpcionesBaseDatos()
    {
        return new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
    }

    [Fact]
    public async Task ObtenerHistorialClienteAsync_ClienteConCitas_RetornaHistorialSnapshotYOrdenDescendente()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        using var context = new ApplicationDbContext(options);

        var barbero = new Barbero { IdBarbero = 1, Nombre = "Carlos Gómez", Telefono = "70000001" };
        var cliente = new Cliente { IdCliente = 1, Nombre = "Juan Pérez", Telefono = "70000002", Correo = "juan@test.com", ContrasenaHash = "hash" };
        var servicio = new Servicio { IdServicio = 1, Nombre = "Corte Clásico", DuracionBase = 30, PrecioBase = 40.00m };

        var turnoAntiguo = new Turno { IdTurno = 1, IdBarbero = 1, Fecha = new DateOnly(2026, 8, 10), HoraInicio = new TimeOnly(10, 0), HoraFin = new TimeOnly(10, 30), Estado = "Atendida", Barbero = barbero };
        var turnoReciente = new Turno { IdTurno = 2, IdBarbero = 1, Fecha = new DateOnly(2026, 8, 20), HoraInicio = new TimeOnly(14, 0), HoraFin = new TimeOnly(14, 30), Estado = "Atendida", Barbero = barbero };

        // Cita antigua con snapshot de precio promocional de 30.00 Bs
        var citaAntigua = new Cita { IdCita = 1, IdCliente = 1, IdServicio = 1, IdTurno = 1, Estado = "Atendida", Duracion = 30, Precio = 30.00m, Cliente = cliente, Servicio = servicio, Turno = turnoAntiguo };
        // Cita reciente con snapshot de precio regular 40.00 Bs
        var citaReciente = new Cita { IdCita = 2, IdCliente = 1, IdServicio = 1, IdTurno = 2, Estado = "Atendida", Duracion = 30, Precio = 40.00m, Cliente = cliente, Servicio = servicio, Turno = turnoReciente };

        context.Barberos.Add(barbero);
        context.Clientes.Add(cliente);
        context.Servicios.Add(servicio);
        context.Turnos.AddRange(turnoAntiguo, turnoReciente);
        context.Citas.AddRange(citaAntigua, citaReciente);
        await context.SaveChangesAsync();

        var repository = new CitaRepository(context);

        // Act (HU-09 Criterio 1: Citas ordenadas descendentemente por fecha con snapshots intactos)
        var historial = (await repository.ObtenerHistorialClienteAsync(1)).ToList();

        // Assert
        Assert.Equal(2, historial.Count);
        Assert.Equal(2, historial[0].IdCita); // Fecha más reciente 2026-08-20 primero
        Assert.Equal(40.00m, historial[0].Precio); // Snapshot intacto
        Assert.Equal(1, historial[1].IdCita); // Fecha antigua 2026-08-10 segundo
        Assert.Equal(30.00m, historial[1].Precio); // Snapshot promocional intacto
    }

    [Fact]
    public async Task ObtenerHistorialClienteAsync_ClienteSinCitas_RetornaListaVacia()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        using var context = new ApplicationDbContext(options);

        var clienteNuevo = new Cliente { IdCliente = 99, Nombre = "María López", Telefono = "70000099", Correo = "maria@test.com", ContrasenaHash = "hash" };
        context.Clientes.Add(clienteNuevo);
        await context.SaveChangesAsync();

        var repository = new CitaRepository(context);

        // Act (HU-09 Criterio 2: Cliente sin citas retorna lista vacía)
        var historial = await repository.ObtenerHistorialClienteAsync(99);

        // Assert
        Assert.NotNull(historial);
        Assert.Empty(historial);
    }

    [Fact]
    public async Task BuscarClientesAsync_FiltroNombreOTelefono_RetornaClientesFiltrados()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        using var context = new ApplicationDbContext(options);

        var cliente1 = new Cliente { IdCliente = 1, Nombre = "Juan Pérez", Telefono = "77711122", Correo = "juan@test.com", ContrasenaHash = "hash" };
        var cliente2 = new Cliente { IdCliente = 2, Nombre = "Carlos Rodríguez", Telefono = "66633344", Correo = "carlos@test.com", ContrasenaHash = "hash" };

        context.Clientes.AddRange(cliente1, cliente2);
        await context.SaveChangesAsync();

        var repository = new ClienteRepository(context);

        // Act
        var resNombre = (await repository.BuscarClientesAsync("Juan")).ToList();
        var resTelefono = (await repository.BuscarClientesAsync("66633344")).ToList();

        // Assert
        Assert.Single(resNombre);
        Assert.Equal("Juan Pérez", resNombre[0].Nombre);

        Assert.Single(resTelefono);
        Assert.Equal("Carlos Rodríguez", resTelefono[0].Nombre);
    }
}

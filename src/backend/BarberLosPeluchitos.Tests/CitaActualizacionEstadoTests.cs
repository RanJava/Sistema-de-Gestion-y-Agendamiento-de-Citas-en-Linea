using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Infrastructure.Data;
using BarberLosPeluchitos.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BarberLosPeluchitos.Tests;

public class CitaActualizacionEstadoTests
{
    private DbContextOptions<ApplicationDbContext> CrearOpcionesBaseDatos()
    {
        return new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
    }

    [Fact]
    public async Task ActualizarEstadoCitaAsync_TransicionValidaAAtendida_ActualizaEstadoYRegistraAuditoria()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        using var context = new ApplicationDbContext(options);

        var barbero = new Barbero { IdBarbero = 1, Nombre = "Carlos Gómez", Telefono = "70000001" };
        var cliente = new Cliente { IdCliente = 1, Nombre = "Juan Pérez", Telefono = "70000002", Correo = "juan@test.com", ContrasenaHash = "hash" };
        var servicio = new Servicio { IdServicio = 1, Nombre = "Corte Clásico", DuracionBase = 30, PrecioBase = 35.00m };
        var turno = new Turno { IdTurno = 1, IdBarbero = 1, Fecha = DateOnly.FromDateTime(DateTime.Today), HoraInicio = new TimeOnly(10, 0), HoraFin = new TimeOnly(10, 30), Estado = "Reservado", Barbero = barbero };
        var cita = new Cita { IdCita = 1, IdCliente = 1, IdServicio = 1, IdTurno = 1, Estado = "Pendiente", Duracion = 30, Precio = 35.00m, Cliente = cliente, Servicio = servicio, Turno = turno };

        context.Barberos.Add(barbero);
        context.Clientes.Add(cliente);
        context.Servicios.Add(servicio);
        context.Turnos.Add(turno);
        context.Citas.Add(cita);
        await context.SaveChangesAsync();

        var repository = new CitaRepository(context);

        // Act (HU-08 Criterio 1: Transición a Atendida)
        var result = await repository.ActualizarEstadoCitaAsync(1, "Atendida", forzar: false, usuarioAuditoria: "admin@peluchitos.com");

        // Assert
        Assert.True(result.exito);
        Assert.False(result.requiereConfirmacion);
        var citaDb = await context.Citas.FindAsync(1);
        Assert.NotNull(citaDb);
        Assert.Equal("Atendida", citaDb.Estado);
    }

    [Fact]
    public async Task ActualizarEstadoCitaAsync_TransicionANoAsistio_LiberaTurnoAtomicamente()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        using var context = new ApplicationDbContext(options);

        var barbero = new Barbero { IdBarbero = 1, Nombre = "Carlos Gómez", Telefono = "70000001" };
        var cliente = new Cliente { IdCliente = 1, Nombre = "Juan Pérez", Telefono = "70000002", Correo = "juan@test.com", ContrasenaHash = "hash" };
        var servicio = new Servicio { IdServicio = 1, Nombre = "Corte Clásico", DuracionBase = 30, PrecioBase = 35.00m };
        var turno = new Turno { IdTurno = 2, IdBarbero = 1, Fecha = DateOnly.FromDateTime(DateTime.Today), HoraInicio = new TimeOnly(11, 0), HoraFin = new TimeOnly(11, 30), Estado = "Reservado", Barbero = barbero };
        var cita = new Cita { IdCita = 2, IdCliente = 1, IdServicio = 1, IdTurno = 2, Estado = "Pendiente", Duracion = 30, Precio = 35.00m, Cliente = cliente, Servicio = servicio, Turno = turno };

        context.Barberos.Add(barbero);
        context.Clientes.Add(cliente);
        context.Servicios.Add(servicio);
        context.Turnos.Add(turno);
        context.Citas.Add(cita);
        await context.SaveChangesAsync();

        var repository = new CitaRepository(context);

        // Act (HU-08 Criterio 2: Cambio a No asistió libera el turno)
        var result = await repository.ActualizarEstadoCitaAsync(2, "No asistió", forzar: false);

        // Assert
        Assert.True(result.exito);
        var citaDb = await context.Citas.FindAsync(2);
        Assert.NotNull(citaDb);
        Assert.Equal("No asistió", citaDb.Estado);
        Assert.Equal("Disponible", turno.Estado);
    }

    [Fact]
    public async Task ActualizarEstadoCitaAsync_SobrescribirCanceladaSinForzar_RechazaYExigeConfirmacion()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        using var context = new ApplicationDbContext(options);

        var barbero = new Barbero { IdBarbero = 1, Nombre = "Carlos Gómez", Telefono = "70000001" };
        var cliente = new Cliente { IdCliente = 1, Nombre = "Juan Pérez", Telefono = "70000002", Correo = "juan@test.com", ContrasenaHash = "hash" };
        var servicio = new Servicio { IdServicio = 1, Nombre = "Corte Clásico", DuracionBase = 30, PrecioBase = 35.00m };
        var turno = new Turno { IdTurno = 3, IdBarbero = 1, Fecha = DateOnly.FromDateTime(DateTime.Today), HoraInicio = new TimeOnly(12, 0), HoraFin = new TimeOnly(12, 30), Estado = "Disponible", Barbero = barbero };
        var cita = new Cita { IdCita = 3, IdCliente = 1, IdServicio = 1, IdTurno = 3, Estado = "Cancelada", Duracion = 30, Precio = 35.00m, Cliente = cliente, Servicio = servicio, Turno = turno };

        context.Barberos.Add(barbero);
        context.Clientes.Add(cliente);
        context.Servicios.Add(servicio);
        context.Turnos.Add(turno);
        context.Citas.Add(cita);
        await context.SaveChangesAsync();

        var repository = new CitaRepository(context);

        // Act (HU-08 Criterio 3: Exige confirmación explícita cuando la cita está Cancelada)
        var result = await repository.ActualizarEstadoCitaAsync(3, "Atendida", forzar: false);

        // Assert
        Assert.False(result.exito);
        Assert.True(result.requiereConfirmacion);
        var citaDb = await context.Citas.FindAsync(3);
        Assert.NotNull(citaDb);
        Assert.Equal("Cancelada", citaDb.Estado); // No cambia sin forzar
    }

    [Fact]
    public async Task ActualizarEstadoCitaAsync_SobrescribirCanceladaConForzar_PermiteActualizacion()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        using var context = new ApplicationDbContext(options);

        var barbero = new Barbero { IdBarbero = 1, Nombre = "Carlos Gómez", Telefono = "70000001" };
        var cliente = new Cliente { IdCliente = 1, Nombre = "Juan Pérez", Telefono = "70000002", Correo = "juan@test.com", ContrasenaHash = "hash" };
        var servicio = new Servicio { IdServicio = 1, Nombre = "Corte Clásico", DuracionBase = 30, PrecioBase = 35.00m };
        var turno = new Turno { IdTurno = 4, IdBarbero = 1, Fecha = DateOnly.FromDateTime(DateTime.Today), HoraInicio = new TimeOnly(13, 0), HoraFin = new TimeOnly(13, 30), Estado = "Disponible", Barbero = barbero };
        var cita = new Cita { IdCita = 4, IdCliente = 1, IdServicio = 1, IdTurno = 4, Estado = "Cancelada", Duracion = 30, Precio = 35.00m, Cliente = cliente, Servicio = servicio, Turno = turno };

        context.Barberos.Add(barbero);
        context.Clientes.Add(cliente);
        context.Servicios.Add(servicio);
        context.Turnos.Add(turno);
        context.Citas.Add(cita);
        await context.SaveChangesAsync();

        var repository = new CitaRepository(context);

        // Act (HU-08 Criterio 3: Con forzar = true permite sobrescribir cita Cancelada)
        var result = await repository.ActualizarEstadoCitaAsync(4, "Atendida", forzar: true);

        // Assert
        Assert.True(result.exito);
        Assert.False(result.requiereConfirmacion);
        var citaDb = await context.Citas.FindAsync(4);
        Assert.NotNull(citaDb);
        Assert.Equal("Atendida", citaDb.Estado);
    }
}

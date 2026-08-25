using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Infrastructure.Data;
using BarberLosPeluchitos.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BarberLosPeluchitos.Tests;

public class CitasDelDiaConsultaTests
{
    private DbContextOptions<ApplicationDbContext> CrearOpcionesBaseDatos()
    {
        return new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
    }

    [Fact]
    public async Task ObtenerCitasDelDiaAsync_ConCitasEnFecha_RetornaCitasOrdenadasCronologicamente()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        using var context = new ApplicationDbContext(options);

        var fechaTarget = new DateOnly(2026, 8, 26);
        var barbero = new Barbero { IdBarbero = 1, Nombre = "Carlos Gómez", Telefono = "70000001" };
        var cliente = new Cliente { IdCliente = 1, Nombre = "Juan Pérez", Telefono = "70000002", Correo = "juan@test.com", ContrasenaHash = "hash" };
        var servicio = new Servicio { IdServicio = 1, Nombre = "Corte Clásico", DuracionBase = 30, PrecioBase = 35.00m };

        var turnoTarde = new Turno { IdTurno = 1, IdBarbero = 1, Fecha = fechaTarget, HoraInicio = new TimeOnly(14, 0), HoraFin = new TimeOnly(14, 30), Estado = "Reservado", Barbero = barbero };
        var turnoManana = new Turno { IdTurno = 2, IdBarbero = 1, Fecha = fechaTarget, HoraInicio = new TimeOnly(10, 0), HoraFin = new TimeOnly(10, 30), Estado = "Reservado", Barbero = barbero };

        var citaTarde = new Cita { IdCita = 1, IdCliente = 1, IdServicio = 1, IdTurno = 1, Estado = "Pendiente", Duracion = 30, Precio = 35.00m, Cliente = cliente, Servicio = servicio, Turno = turnoTarde };
        var citaManana = new Cita { IdCita = 2, IdCliente = 1, IdServicio = 1, IdTurno = 2, Estado = "Pendiente", Duracion = 30, Precio = 35.00m, Cliente = cliente, Servicio = servicio, Turno = turnoManana };

        context.Barberos.Add(barbero);
        context.Clientes.Add(cliente);
        context.Servicios.Add(servicio);
        context.Turnos.AddRange(turnoTarde, turnoManana);
        context.Citas.AddRange(citaTarde, citaManana);
        await context.SaveChangesAsync();

        var repository = new CitaRepository(context);

        // Act (HU-07 Criterio 1: Citas devueltas ordenadas por hora)
        var citas = (await repository.ObtenerCitasDelDiaAsync(fechaTarget)).ToList();

        // Assert
        Assert.Equal(2, citas.Count);
        Assert.Equal(2, citas[0].IdCita); // 10:00 AM primero
        Assert.Equal(1, citas[1].IdCita); // 14:00 PM segundo
    }

    [Fact]
    public async Task ObtenerCitasDelDiaAsync_SinCitasEnFecha_RetornaListaVacia()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        using var context = new ApplicationDbContext(options);
        var repository = new CitaRepository(context);

        var fechaSinCitas = new DateOnly(2026, 9, 1);

        // Act (HU-07 Criterio 2: Retorna lista vacía si no hay registros)
        var citas = await repository.ObtenerCitasDelDiaAsync(fechaSinCitas);

        // Assert
        Assert.NotNull(citas);
        Assert.Empty(citas);
    }

    [Fact]
    public async Task ObtenerCitasDelDiaAsync_ConFiltroBarbero_RetornaSoloCitasDelBarbero()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        using var context = new ApplicationDbContext(options);

        var fechaTarget = new DateOnly(2026, 8, 26);
        var barbero1 = new Barbero { IdBarbero = 1, Nombre = "Carlos Gómez", Telefono = "70000001" };
        var barbero2 = new Barbero { IdBarbero = 2, Nombre = "Mateo Rodríguez", Telefono = "70000002" };
        var cliente = new Cliente { IdCliente = 1, Nombre = "Juan Pérez", Telefono = "70000003", Correo = "juan@test.com", ContrasenaHash = "hash" };
        var servicio = new Servicio { IdServicio = 1, Nombre = "Corte Clásico", DuracionBase = 30, PrecioBase = 35.00m };

        var turnoBarbero1 = new Turno { IdTurno = 1, IdBarbero = 1, Fecha = fechaTarget, HoraInicio = new TimeOnly(10, 0), HoraFin = new TimeOnly(10, 30), Estado = "Reservado", Barbero = barbero1 };
        var turnoBarbero2 = new Turno { IdTurno = 2, IdBarbero = 2, Fecha = fechaTarget, HoraInicio = new TimeOnly(11, 0), HoraFin = new TimeOnly(11, 30), Estado = "Reservado", Barbero = barbero2 };

        var citaBarbero1 = new Cita { IdCita = 1, IdCliente = 1, IdServicio = 1, IdTurno = 1, Estado = "Pendiente", Duracion = 30, Precio = 35.00m, Cliente = cliente, Servicio = servicio, Turno = turnoBarbero1 };
        var citaBarbero2 = new Cita { IdCita = 2, IdCliente = 1, IdServicio = 1, IdTurno = 2, Estado = "Pendiente", Duracion = 30, Precio = 35.00m, Cliente = cliente, Servicio = servicio, Turno = turnoBarbero2 };

        context.Barberos.AddRange(barbero1, barbero2);
        context.Clientes.Add(cliente);
        context.Servicios.Add(servicio);
        context.Turnos.AddRange(turnoBarbero1, turnoBarbero2);
        context.Citas.AddRange(citaBarbero1, citaBarbero2);
        await context.SaveChangesAsync();

        var repository = new CitaRepository(context);

        // Act (HU-07 Criterio 3: Filtrado por BarberoId)
        var citasBarbero1 = (await repository.ObtenerCitasDelDiaAsync(fechaTarget, barberoId: 1)).ToList();

        // Assert
        Assert.Single(citasBarbero1);
        Assert.Equal(1, citasBarbero1[0].IdCita);
        Assert.Equal(1, citasBarbero1[0].Turno.IdBarbero);
    }
}

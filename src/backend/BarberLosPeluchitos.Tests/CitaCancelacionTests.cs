using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Infrastructure.Data;
using BarberLosPeluchitos.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BarberLosPeluchitos.Tests;

public class CitaCancelacionTests
{
    private DbContextOptions<ApplicationDbContext> CrearOpcionesBaseDatos()
    {
        return new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
    }

    [Fact]
    public async Task CancelarCitaTransaccionalAsync_DesdeEstadoPendiente_CancelaCitaYLiberaTurnoAtomicamente()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        using var context = new ApplicationDbContext(options);

        var barbero = new Barbero { IdBarbero = 1, Nombre = "Carlos Gómez", Telefono = "70000001" };
        var cliente = new Cliente { IdCliente = 1, Nombre = "Juan Pérez", Telefono = "70000002", Correo = "juan@test.com", ContrasenaHash = "hash" };
        var servicio = new Servicio { IdServicio = 1, Nombre = "Corte Clásico", DuracionBase = 30, PrecioBase = 35.00m };
        
        var turno = new Turno
        {
            IdTurno = 1,
            IdBarbero = 1,
            Fecha = DateOnly.FromDateTime(DateTime.Today),
            HoraInicio = new TimeOnly(10, 0),
            HoraFin = new TimeOnly(10, 30),
            Estado = "Reservado",
            Barbero = barbero
        };

        var cita = new Cita
        {
            IdCita = 1,
            IdCliente = 1,
            IdServicio = 1,
            IdTurno = 1,
            Estado = "Pendiente",
            Duracion = 30,
            Precio = 35.00m,
            Cliente = cliente,
            Servicio = servicio,
            Turno = turno
        };

        context.Barberos.Add(barbero);
        context.Clientes.Add(cliente);
        context.Servicios.Add(servicio);
        context.Turnos.Add(turno);
        context.Citas.Add(cita);
        await context.SaveChangesAsync();

        var repository = new CitaRepository(context);

        // Act
        var citaCancelada = await repository.CancelarCitaTransaccionalAsync(1);

        // Assert (HU-06 Criterio 1: Cita pasa a 'Cancelada' y Turno pasa a 'Disponible')
        Assert.NotNull(citaCancelada);
        Assert.Equal("Cancelada", citaCancelada.Estado);
        Assert.Equal("Disponible", citaCancelada.Turno.Estado);
    }

    [Fact]
    public async Task CancelarCitaTransaccionalAsync_DesdeEstadoAtendida_RechazaCancelacionYLanzaExcepcion()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        using var context = new ApplicationDbContext(options);

        var barbero = new Barbero { IdBarbero = 2, Nombre = "Mateo Rodríguez", Telefono = "70000003" };
        var cliente = new Cliente { IdCliente = 2, Nombre = "María Lopez", Telefono = "70000004", Correo = "maria@test.com", ContrasenaHash = "hash" };
        var servicio = new Servicio { IdServicio = 2, Nombre = "Perfilado de Barba", DuracionBase = 20, PrecioBase = 25.00m };

        var turno = new Turno
        {
            IdTurno = 2,
            IdBarbero = 2,
            Fecha = DateOnly.FromDateTime(DateTime.Today),
            HoraInicio = new TimeOnly(11, 0),
            HoraFin = new TimeOnly(11, 20),
            Estado = "Reservado",
            Barbero = barbero
        };

        var cita = new Cita
        {
            IdCita = 2,
            IdCliente = 2,
            IdServicio = 2,
            IdTurno = 2,
            Estado = "Atendida", // Cita previamente atendida por administración
            Duracion = 20,
            Precio = 25.00m,
            Cliente = cliente,
            Servicio = servicio,
            Turno = turno
        };

        context.Barberos.Add(barbero);
        context.Clientes.Add(cliente);
        context.Servicios.Add(servicio);
        context.Turnos.Add(turno);
        context.Citas.Add(cita);
        await context.SaveChangesAsync();

        var repository = new CitaRepository(context);

        // Act & Assert (HU-06 Criterio 3: Rechazo con excepción de negocio cuando la cita ya fue Atendida)
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => repository.CancelarCitaTransaccionalAsync(2));
        Assert.Equal("CitaAtendidaNoCancelable", ex.Message);

        // Verificar inmutabilidad del estado en la base de datos
        var citaDb = await context.Citas.FindAsync(2);
        Assert.NotNull(citaDb);
        Assert.Equal("Atendida", citaDb.Estado);
        Assert.Equal("Reservado", turno.Estado);
    }
}

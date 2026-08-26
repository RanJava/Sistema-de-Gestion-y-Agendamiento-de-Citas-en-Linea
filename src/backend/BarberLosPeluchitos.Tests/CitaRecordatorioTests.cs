using BarberLosPeluchitos.Core.DTOs;
using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using BarberLosPeluchitos.Core.Options;
using BarberLosPeluchitos.Infrastructure.Data;
using BarberLosPeluchitos.Infrastructure.Repositories;
using BarberLosPeluchitos.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace BarberLosPeluchitos.Tests;

public class CitaRecordatorioTests
{
    private DbContextOptions<ApplicationDbContext> CrearOpcionesBaseDatos()
    {
        return new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
    }

    [Fact]
    public async Task ObtenerCitasPendientesParaRecordatorioAsync_CitaProximaPendiente_RetornaCitaParaRecordatorio()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        using var context = new ApplicationDbContext(options);

        var fechaHoy = DateOnly.FromDateTime(DateTime.Today);
        var horaFutura = TimeOnly.FromDateTime(DateTime.Now.AddHours(2));

        var barbero = new Barbero { IdBarbero = 1, Nombre = "Pedro Barbero", Telefono = "70000001" };
        var cliente = new Cliente { IdCliente = 1, Nombre = "Carlos Cliente", Telefono = "70000002", Correo = "carlos@test.com", ContrasenaHash = "hash" };
        var servicio = new Servicio { IdServicio = 1, Nombre = "Corte y Barba", DuracionBase = 45, PrecioBase = 50.00m };
        var turno = new Turno { IdTurno = 1, IdBarbero = 1, Fecha = fechaHoy, HoraInicio = horaFutura, HoraFin = horaFutura.AddMinutes(45), Estado = "Reservado", Barbero = barbero };

        var cita = new Cita
        {
            IdCita = 10,
            IdCliente = 1,
            IdServicio = 1,
            IdTurno = 1,
            Estado = "Pendiente",
            RecordatorioEnviado = false,
            Duracion = 45,
            Precio = 50.00m,
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

        // Act (HU-10 Criterio 1: Cita pendiente dentro del umbral de 24h)
        var resultado = (await repository.ObtenerCitasPendientesParaRecordatorioAsync(24)).ToList();

        // Assert
        Assert.Single(resultado);
        Assert.Equal(10, resultado[0].IdCita);
        Assert.False(resultado[0].RecordatorioEnviado);
    }

    [Fact]
    public async Task ObtenerCitasPendientesParaRecordatorioAsync_CitaConRecordatorioEnviado_IgnoraCitaYNoReenvia()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        using var context = new ApplicationDbContext(options);

        var fechaHoy = DateOnly.FromDateTime(DateTime.Today);
        var horaFutura = TimeOnly.FromDateTime(DateTime.Now.AddHours(2));

        var barbero = new Barbero { IdBarbero = 1, Nombre = "Pedro Barbero", Telefono = "70000001" };
        var cliente = new Cliente { IdCliente = 1, Nombre = "Carlos Cliente", Telefono = "70000002", Correo = "carlos@test.com", ContrasenaHash = "hash" };
        var servicio = new Servicio { IdServicio = 1, Nombre = "Corte", DuracionBase = 30, PrecioBase = 35.00m };
        var turno = new Turno { IdTurno = 2, IdBarbero = 1, Fecha = fechaHoy, HoraInicio = horaFutura, HoraFin = horaFutura.AddMinutes(30), Estado = "Reservado", Barbero = barbero };

        // Cita con RecordatorioEnviado = true
        var citaConRecordatorio = new Cita
        {
            IdCita = 20,
            IdCliente = 1,
            IdServicio = 1,
            IdTurno = 2,
            Estado = "Pendiente",
            RecordatorioEnviado = true,
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
        context.Citas.Add(citaConRecordatorio);
        await context.SaveChangesAsync();

        var repository = new CitaRepository(context);

        // Act (HU-10 Criterio 1: Evitar envío duplicado)
        var resultado = await repository.ObtenerCitasPendientesParaRecordatorioAsync(24);

        // Assert
        Assert.Empty(resultado);
    }

    [Fact]
    public async Task ProcesarRecordatoriosAsync_CitaCanceladaPreviamente_OmiteEnvioRecordatorio()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        using var context = new ApplicationDbContext(options);

        var fechaHoy = DateOnly.FromDateTime(DateTime.Today);
        var horaFutura = TimeOnly.FromDateTime(DateTime.Now.AddHours(2));

        var barbero = new Barbero { IdBarbero = 1, Nombre = "Pedro Barbero", Telefono = "70000001" };
        var cliente = new Cliente { IdCliente = 1, Nombre = "Carlos Cliente", Telefono = "70000002", Correo = "carlos@test.com", ContrasenaHash = "hash" };
        var servicio = new Servicio { IdServicio = 1, Nombre = "Corte", DuracionBase = 30, PrecioBase = 35.00m };
        var turno = new Turno { IdTurno = 3, IdBarbero = 1, Fecha = fechaHoy, HoraInicio = horaFutura, HoraFin = horaFutura.AddMinutes(30), Estado = "Disponible", Barbero = barbero };

        // Cita en estado Cancelada
        var citaCancelada = new Cita
        {
            IdCita = 30,
            IdCliente = 1,
            IdServicio = 1,
            IdTurno = 3,
            Estado = "Cancelada",
            RecordatorioEnviado = false,
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
        context.Citas.Add(citaCancelada);
        await context.SaveChangesAsync();

        var mockNotifService = new Mock<INotificacionService>();

        var services = new ServiceCollection();
        services.AddSingleton(context);
        services.AddScoped<ICitaRepository, CitaRepository>();
        services.AddSingleton(mockNotifService.Object);
        var serviceProvider = services.BuildServiceProvider();

        var optionsRecordatorio = Options.Create(new RecordatorioOptions { HorasAnticipacion = 24, IntervaloChequeoMinutos = 15 });
        var backgroundService = new RecordatorioCitasBackgroundService(serviceProvider, optionsRecordatorio, NullLogger<RecordatorioCitasBackgroundService>.Instance);

        // Act (HU-10 Criterio 2: Cita cancelada omite el envío del recordatorio)
        await backgroundService.ProcesarRecordatoriosAsync();

        // Assert
        mockNotifService.Verify(n => n.EnviarRecordatorioCitaAsync(It.IsAny<CitaResponseDto>(), It.IsAny<CancellationToken>()), Times.Never);
        
        var citaDb = await context.Citas.FindAsync(30);
        Assert.NotNull(citaDb);
        Assert.False(citaDb.RecordatorioEnviado);
    }
}

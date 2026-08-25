using BarberLosPeluchitos.Core.DTOs;
using BarberLosPeluchitos.Core.Interfaces;
using BarberLosPeluchitos.Infrastructure.Data;
using BarberLosPeluchitos.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BarberLosPeluchitos.Tests;

public class NotificacionServiceTests
{
    private readonly DbContextOptions<ApplicationDbContext> _dbOptions;

    public NotificacionServiceTests()
    {
        _dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    private (NotificacionService service, Mock<IEmailSender> emailMock, Mock<ILogger<NotificacionService>> loggerMock) CrearServicio()
    {
        var emailMock = new Mock<IEmailSender>();
        var loggerMock = new Mock<ILogger<NotificacionService>>();

        var serviceCollection = new ServiceCollection();
        serviceCollection.AddDbContext<ApplicationDbContext>(options => options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()));
        var serviceProvider = serviceCollection.BuildServiceProvider();

        var service = new NotificacionService(emailMock.Object, serviceProvider, loggerMock.Object);

        return (service, emailMock, loggerMock);
    }

    [Fact]
    public async Task EnviarConfirmacionCitaAsync_CuandoEnvioEsExitoso_RetornaExitosoTrue()
    {
        // Arrange
        var (service, emailMock, _) = CrearServicio();
        var cita = new CitaResponseDto
        {
            IdCita = 101,
            ClienteNombre = "Juan Pérez",
            ClienteCorreo = "juan.perez@test.com",
            ServicioNombre = "Corte Clásico",
            BarberoNombre = "Carlos Gómez",
            Fecha = "2026-08-26",
            HoraInicio = "10:00",
            HoraFin = "10:30",
            Duracion = 30,
            Precio = 35.00m,
            Estado = "Pendiente"
        };

        emailMock.Setup(e => e.SendEmailAsync(
            It.IsAny<string>(), 
            It.IsAny<string>(), 
            It.IsAny<string>(), 
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var resultado = await service.EnviarConfirmacionCitaAsync(cita);

        // Assert
        Assert.NotNull(resultado);
        Assert.True(resultado.Exitoso);
        Assert.Equal("juan.perez@test.com", resultado.Destinatario);
        emailMock.Verify(e => e.SendEmailAsync("juan.perez@test.com", It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task EnviarConfirmacionCitaAsync_CuandoServidorCorreoFalla_NoLanzaExcepcionYRetornaExitosoFalse()
    {
        // Arrange
        var (service, emailMock, _) = CrearServicio();
        var cita = new CitaResponseDto
        {
            IdCita = 102,
            ClienteNombre = "María Lopez",
            ClienteCorreo = "maria.fail@test.com",
            ServicioNombre = "Perfilado de Barba",
            BarberoNombre = "Mateo Rodríguez",
            Fecha = "2026-08-26",
            HoraInicio = "11:00",
            HoraFin = "11:20",
            Duracion = 20,
            Precio = 25.00m,
            Estado = "Pendiente"
        };

        // HU-05 Criterio 2: Simulación de fallo en el servicio de envío de correo
        emailMock.Setup(e => e.SendEmailAsync(
            It.IsAny<string>(), 
            It.IsAny<string>(), 
            It.IsAny<string>(), 
            It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Error de conexión SMTP con el servidor de correos."));

        // Act & Assert (Garantiza que la excepción sea capturada sin propagarse)
        var resultado = await service.EnviarConfirmacionCitaAsync(cita);

        Assert.NotNull(resultado);
        Assert.False(resultado.Exitoso);
        Assert.NotNull(resultado.ErrorDetalle);
        Assert.Contains("SMTP", resultado.ErrorDetalle);
    }
}

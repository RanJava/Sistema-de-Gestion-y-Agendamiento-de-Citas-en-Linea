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

public class SeguridadAuditoriaHabeasDataTests
{
    private DbContextOptions<ApplicationDbContext> CrearOpcionesBaseDatos()
    {
        return new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
    }

    [Fact]
    public void AesEncryptionService_CifradoYDescifrado_MantieneIntegridadDeTextoPlano()
    {
        // Arrange
        var configuration = new ConfigurationBuilder().Build();
        var encryptionService = new AesEncryptionService(configuration);
        var telefonoOriginal = "77123456";
        var correoOriginal = "cliente.prueba@ejemplo.com";

        // Act
        var telefonoCifrado = encryptionService.Encrypt(telefonoOriginal);
        var correoCifrado = encryptionService.Encrypt(correoOriginal);

        var telefonoDescifrado = encryptionService.Decrypt(telefonoCifrado);
        var correoDescifrado = encryptionService.Decrypt(correoCifrado);

        // Assert
        Assert.NotEqual(telefonoOriginal, telefonoCifrado);
        Assert.NotEqual(correoOriginal, correoCifrado);
        Assert.Equal(telefonoOriginal, telefonoDescifrado);
        Assert.Equal(correoOriginal, correoDescifrado);
    }

    [Fact]
    public void AesEncryptionService_CifradoDoble_GeneraDiferentesCiphertextsPorIVAleatorio()
    {
        // Arrange
        var configuration = new ConfigurationBuilder().Build();
        var encryptionService = new AesEncryptionService(configuration);
        var texto = "70011223";

        // Act
        var cifrado1 = encryptionService.Encrypt(texto);
        var cifrado2 = encryptionService.Encrypt(texto);

        // Assert (Mitigación de ataques de frecuencia)
        Assert.NotEqual(cifrado1, cifrado2);
        Assert.Equal(texto, encryptionService.Decrypt(cifrado1));
        Assert.Equal(texto, encryptionService.Decrypt(cifrado2));
    }

    [Fact]
    public void AesEncryptionService_ComputeHmacSha256_EsDeterministicoParaBlindIndexing()
    {
        // Arrange
        var configuration = new ConfigurationBuilder().Build();
        var encryptionService = new AesEncryptionService(configuration);
        var email1 = "test.user@peluchitos.com";
        var email2 = "  TEST.USER@PELUCHITOS.COM  ";

        // Act
        var hash1 = encryptionService.ComputeHmacSha256(email1);
        var hash2 = encryptionService.ComputeHmacSha256(email2);

        // Assert
        Assert.NotEmpty(hash1);
        Assert.Equal(hash1, hash2); // Determinístico e insensible a espacios/mayúsculas
    }

    [Fact]
    public async Task ClienteRepository_GuardarYBuscarPorCorreo_UtilizaBlindIndex()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        var encryptionService = new AesEncryptionService(new ConfigurationBuilder().Build());
        using var context = new ApplicationDbContext(options, encryptionService);

        var repository = new ClienteRepository(context, encryptionService);
        var cliente = new Cliente
        {
            Nombre = "Andrés Guardado",
            Telefono = "78945612",
            Correo = "andres@peluchitos.bo",
            ContrasenaHash = "hashedPassword"
        };

        // Act
        await repository.GuardarAsync(cliente);
        var clienteEncontrado = await repository.BuscarPorCorreoAsync("ANDRES@PELUCHITOS.BO");
        var existe = await repository.ExisteCorreoAsync("andres@peluchitos.bo");

        // Assert
        Assert.NotNull(clienteEncontrado);
        Assert.Equal(cliente.IdCliente, clienteEncontrado.IdCliente);
        Assert.NotEmpty(clienteEncontrado.CorreoHash);
        Assert.True(existe);
    }

    [Fact]
    public async Task ClienteRepository_BajaLogica_PreservaRegistroYMarcaActivoFalso()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        var encryptionService = new AesEncryptionService(new ConfigurationBuilder().Build());
        using var context = new ApplicationDbContext(options, encryptionService);

        var repository = new ClienteRepository(context, encryptionService);
        var cliente = new Cliente
        {
            IdCliente = 10,
            Nombre = "Juan Carlos",
            Telefono = "77112233",
            Correo = "juancarlos@test.bo",
            ContrasenaHash = "hash",
            Activo = true
        };

        context.Clientes.Add(cliente);
        await context.SaveChangesAsync();

        // Act (Habeas Data - Baja Lógica)
        var bajaExitosa = await repository.BajaLogicaAsync(10);
        var clienteActualizado = await repository.BuscarPorIdAsync(10);

        // Assert
        Assert.True(bajaExitosa);
        Assert.NotNull(clienteActualizado);
        Assert.False(clienteActualizado.Activo);
        Assert.NotNull(clienteActualizado.FechaEliminacion);
    }

    [Fact]
    public async Task AuditoriaService_RegistrarAcceso_InsertaRegistroInalterableEnDb()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        var encryptionService = new AesEncryptionService(new ConfigurationBuilder().Build());
        using var context = new ApplicationDbContext(options, encryptionService);

        var auditoriaService = new AuditoriaService(context, NullLogger<AuditoriaService>.Instance);

        // Act
        await auditoriaService.RegistrarAccesoAsync(
            idAdministrador: 1,
            recursoAfectado: "cliente",
            idRecurso: "5",
            accion: "SELECT",
            ipOrigen: "192.168.1.50",
            detalles: "Consulta de historial de cliente (HU-09)");

        // Assert
        var logs = await context.LogsAuditoria.ToListAsync();
        Assert.Single(logs);
        Assert.Equal(1, logs[0].IdAdministrador);
        Assert.Equal("cliente", logs[0].RecursoAfectado);
        Assert.Equal("5", logs[0].IdRecurso);
        Assert.Equal("SELECT", logs[0].Accion);
        Assert.Equal("192.168.1.50", logs[0].IpOrigen);
    }

    [Fact]
    public async Task DataEncryptionMigrator_MigrateAllAsync_AplicaCifradoYBlindIndexATodosLosRegistros()
    {
        // Arrange
        var options = CrearOpcionesBaseDatos();
        var encryptionService = new AesEncryptionService(new ConfigurationBuilder().Build());
        using var context = new ApplicationDbContext(options, encryptionService);

        var cliente = new Cliente { IdCliente = 1, Nombre = "Pedro", Telefono = "71112233", Correo = "pedro@test.com", ContrasenaHash = "hash" };
        var barbero = new Barbero { IdBarbero = 1, Nombre = "Mario", Telefono = "72223344" };
        var admin = new Administrador { IdAdministrador = 1, Nombre = "Admin", Correo = "admin@test.com", ContrasenaHash = "hash" };

        context.Clientes.Add(cliente);
        context.Barberos.Add(barbero);
        context.Administradores.Add(admin);
        await context.SaveChangesAsync();

        // Act
        var result = await DataEncryptionMigrator.MigrateAllAsync(context, encryptionService, NullLogger.Instance);

        // Assert
        Assert.True(result.Exitoso);
        Assert.Equal(1, result.ClientesMigrados);
        Assert.Equal(1, result.BarberosMigrados);
        Assert.Equal(1, result.AdministradoresMigrados);

        var cMigrado = await context.Clientes.FindAsync(1);
        var aMigrado = await context.Administradores.FindAsync(1);

        Assert.NotNull(cMigrado);
        Assert.NotEmpty(cMigrado.CorreoHash);
        Assert.Equal(encryptionService.ComputeHmacSha256("pedro@test.com"), cMigrado.CorreoHash);

        Assert.NotNull(aMigrado);
        Assert.NotEmpty(aMigrado.CorreoHash);
        Assert.Equal(encryptionService.ComputeHmacSha256("admin@test.com"), aMigrado.CorreoHash);

        // Act 2 (Idempotencia / No reprocesar registros ya migrados)
        var segundoResultado = await DataEncryptionMigrator.MigrateAllAsync(context, encryptionService, NullLogger.Instance);
        Assert.True(segundoResultado.Exitoso);
        Assert.Equal(0, segundoResultado.ClientesMigrados);
        Assert.Equal(0, segundoResultado.AdministradoresMigrados);
    }
}

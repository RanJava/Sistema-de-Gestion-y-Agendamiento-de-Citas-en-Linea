using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using BarberLosPeluchitos.Infrastructure.Data;
using BarberLosPeluchitos.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace BarberLosPeluchitos.Infrastructure.Repositories;

public class ClienteRepository : IClienteRepository
{
    private readonly ApplicationDbContext _context;
    private readonly IEncryptionService _encryptionService;

    public ClienteRepository(ApplicationDbContext context)
        : this(context, new AesEncryptionService(new ConfigurationBuilder().Build()))
    {
    }

    public ClienteRepository(ApplicationDbContext context, IEncryptionService encryptionService)
    {
        _context = context;
        _encryptionService = encryptionService;
    }

    public async Task<Cliente?> BuscarPorCorreoAsync(string correo, CancellationToken cancellationToken = default)
    {
        var correoHmac = _encryptionService.ComputeHmacSha256(correo);
        return await _context.Clientes
            .FirstOrDefaultAsync(c => c.CorreoHash == correoHmac, cancellationToken);
    }

    public async Task<Cliente?> BuscarPorIdAsync(int idCliente, CancellationToken cancellationToken = default)
    {
        return await _context.Clientes
            .FindAsync([idCliente], cancellationToken);
    }

    public async Task<bool> ExisteCorreoAsync(string correo, CancellationToken cancellationToken = default)
    {
        var correoHmac = _encryptionService.ComputeHmacSha256(correo);
        return await _context.Clientes
            .AnyAsync(c => c.CorreoHash == correoHmac, cancellationToken);
    }

    public async Task<Cliente> GuardarAsync(Cliente cliente, CancellationToken cancellationToken = default)
    {
        // Asegurar que el blind index esté calculado antes de persistir
        cliente.CorreoHash = _encryptionService.ComputeHmacSha256(cliente.Correo);
        
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync(cancellationToken);
        return cliente;
    }

    public async Task<Cliente> ActualizarAsync(Cliente cliente, CancellationToken cancellationToken = default)
    {
        cliente.CorreoHash = _encryptionService.ComputeHmacSha256(cliente.Correo);
        _context.Clientes.Update(cliente);
        await _context.SaveChangesAsync(cancellationToken);
        return cliente;
    }

    public async Task<bool> BajaLogicaAsync(int idCliente, CancellationToken cancellationToken = default)
    {
        var cliente = await _context.Clientes.FindAsync([idCliente], cancellationToken);
        if (cliente == null)
        {
            return false;
        }

        // ── Habeas Data: Derecho de Supresión / Anonimización (CPE Art. 130 / Ley 164) ──
        // No borramos la fila para preservar integridad referencial con 'cita' (ON DELETE RESTRICT).
        // Sobrescribimos todos los campos PII con valores no recuperables.

        // Nombre a un literal no identificable
        cliente.Nombre = "Usuario eliminado";

        // Correo y teléfono: ciframos un UUID aleatorio no recuperable.
        // El converter AES del DbContext re-cifrará el valor al persistir,
        // pero queremos que el valor plano tampoco sea útil → UUID como placeholder.
        var corroAnonimo = $"anon-{Guid.NewGuid():N}@deleted.invalid";
        var telefonoAnonimo = Guid.NewGuid().ToString("N")[..15];
        cliente.Correo = corroAnonimo;
        cliente.Telefono = telefonoAnonimo;

        // Romper el blind-index: sin HMAC el motor de login no puede encontrar este registro
        cliente.CorreoHash = null;

        // Invalidar la contraseña para que VerifyPassword siempre falle
        cliente.ContrasenaHash = "INVALIDATED";

        // Marcadores de baja lógica
        cliente.Activo = false;
        cliente.FechaEliminacion = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IEnumerable<Cliente>> BuscarClientesAsync(string? buscar, int pagina = 1, int tamanoPagina = 10, CancellationToken cancellationToken = default)
    {
        pagina = Math.Max(1, pagina);
        tamanoPagina = Math.Clamp(tamanoPagina, 1, 50);

        if (string.IsNullOrWhiteSpace(buscar))
        {
            return await _context.Clientes
                .OrderBy(c => c.Nombre)
                .Skip((pagina - 1) * tamanoPagina)
                .Take(tamanoPagina)
                .ToListAsync(cancellationToken);
        }

        var term = buscar.Trim().ToLower();
        var termHmac = _encryptionService.ComputeHmacSha256(term);

        // Búsqueda por Nombre en DB o coincidencia exacta de blind index por correo
        var clientes = await _context.Clientes
            .Where(c => c.Nombre.ToLower().Contains(term) || c.CorreoHash == termHmac)
            .ToListAsync(cancellationToken);

        // Si la búsqueda no arrojó suficientes resultados y podría ser un fragmento de teléfono/correo descifrado en memoria
        if (clientes.Count < tamanoPagina)
        {
            var todos = await _context.Clientes.ToListAsync(cancellationToken);
            clientes = todos
                .Where(c => c.Nombre.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                            c.Telefono.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                            c.Correo.Contains(term, StringComparison.OrdinalIgnoreCase))
                .DistinctBy(c => c.IdCliente)
                .ToList();
        }

        return clientes
            .OrderBy(c => c.Nombre)
            .Skip((pagina - 1) * tamanoPagina)
            .Take(tamanoPagina)
            .ToList();
    }
}

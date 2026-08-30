using System.Security.Claims;
using BarberLosPeluchitos.Core.Interfaces;
using Microsoft.AspNetCore.Mvc.Filters;

namespace BarberLosPeluchitos.API.Filters;

/// <summary>
/// Filtro de auditoría automática para controladores administrativos.
/// Registra en logs_auditoria todo acceso o mutación a datos personales de clientes (Ley 164 / CPE Art. 130).
/// </summary>
public class AuditAdminAccessFilter : IAsyncActionFilter
{
    private readonly IAuditoriaService _auditoriaService;

    public AuditAdminAccessFilter(IAuditoriaService auditoriaService)
    {
        _auditoriaService = auditoriaService;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var httpContext = context.HttpContext;
        var executedContext = await next();

        // Solo auditar si la petición fue exitosa (código 2xx) o si fue ejecutada por un Administrador
        if (executedContext.Exception == null || executedContext.ExceptionHandled)
        {
            var user = httpContext.User;
            int? idAdmin = null;

            var claimId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? user.FindFirst("id_usuario")?.Value
                          ?? user.FindFirst("sub")?.Value;

            if (int.TryParse(claimId, out var parsedId))
            {
                idAdmin = parsedId;
            }

            var method = httpContext.Request.Method.ToUpperInvariant();
            var accion = method switch
            {
                "GET" => "SELECT",
                "POST" => "INSERT",
                "PUT" => "UPDATE",
                "PATCH" => "UPDATE",
                "DELETE" => "DELETE",
                _ => method
            };

            // Identificar recurso afectado
            var controllerName = context.Controller.GetType().Name.Replace("Controller", "");
            var recursoAfectado = controllerName.ToLowerInvariant();

            // Identificar id de recurso específico si existe en los parámetros de ruta
            string? idRecurso = null;
            if (context.RouteData.Values.TryGetValue("idCliente", out var idCli))
            {
                idRecurso = idCli?.ToString();
            }
            else if (context.RouteData.Values.TryGetValue("id", out var idGeneral))
            {
                idRecurso = idGeneral?.ToString();
            }

            var ipOrigen = httpContext.Connection.RemoteIpAddress?.ToString()
                           ?? httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()
                           ?? "127.0.0.1";

            var ruta = httpContext.Request.Path.Value;
            var detalles = $"Ruta: {ruta} | Query: {httpContext.Request.QueryString.Value}";

            await _auditoriaService.RegistrarAccesoAsync(
                idAdmin,
                recursoAfectado,
                idRecurso,
                accion,
                ipOrigen,
                detalles,
                CancellationToken.None);
        }
    }
}

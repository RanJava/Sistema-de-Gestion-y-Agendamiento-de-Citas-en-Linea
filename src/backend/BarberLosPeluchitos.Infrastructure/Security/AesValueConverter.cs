using BarberLosPeluchitos.Core.Interfaces;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace BarberLosPeluchitos.Infrastructure.Security;

/// <summary>
/// Convertidor de valores para EF Core que cifra en reposo de forma transparente
/// los campos sensibles no nulos en la base de datos (AES-256).
/// </summary>
public class AesValueConverter : ValueConverter<string, string>
{
    public AesValueConverter(IEncryptionService encryptionService, ConverterMappingHints? mappingHints = null)
        : base(
            v => encryptionService.Encrypt(v),
            v => encryptionService.Decrypt(v),
            mappingHints)
    {
    }
}

/// <summary>
/// Convertidor de valores para EF Core que cifra en reposo de forma transparente
/// los campos sensibles anulables en la base de datos (AES-256).
/// </summary>
public class AesNullableValueConverter : ValueConverter<string?, string?>
{
    public AesNullableValueConverter(IEncryptionService encryptionService, ConverterMappingHints? mappingHints = null)
        : base(
            v => v == null ? null : encryptionService.Encrypt(v),
            v => v == null ? null : encryptionService.Decrypt(v),
            mappingHints)
    {
    }
}

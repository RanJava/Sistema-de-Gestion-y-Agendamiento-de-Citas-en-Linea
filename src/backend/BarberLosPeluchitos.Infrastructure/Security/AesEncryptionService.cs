using System.Security.Cryptography;
using System.Text;
using BarberLosPeluchitos.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BarberLosPeluchitos.Infrastructure.Security;

/// <summary>
/// Implementación de cifrado AES-256 en reposo y hashing determinístico HMAC-SHA256.
/// Cumple con los requerimientos de la Ley 164, D.S. 1793 y estándares de seguridad de datos.
/// </summary>
public class AesEncryptionService : IEncryptionService
{
    private readonly byte[] _aesKey;
    private readonly byte[] _hmacKey;
    private readonly ILogger<AesEncryptionService>? _logger;

    public AesEncryptionService(IConfiguration configuration, ILogger<AesEncryptionService>? logger = null)
    {
        _logger = logger;

        // Lectura de clave de cifrado desde variables de entorno con fallback a appsettings.json
        var rawAesKey = Environment.GetEnvironmentVariable("APP_ENCRYPTION_KEY")
                        ?? configuration["Encryption:Key"]
                        ?? "PeluchitosAesKey2026SecureComplianceKey!"; // 32 chars fallback dev

        var rawHmacKey = Environment.GetEnvironmentVariable("APP_HMAC_KEY")
                         ?? configuration["Encryption:HmacKey"]
                         ?? "PeluchitosHmacKey2026BlindIndexHashKey!";

        // Asegurar longitud de 256 bits (32 bytes) para AES-256
        using var sha256 = SHA256.Create();
        _aesKey = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawAesKey));
        _hmacKey = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawHmacKey));
    }

    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
        {
            return plainText;
        }

        try
        {
            using var aes = Aes.Create();
            aes.Key = _aesKey;
            aes.GenerateIV();
            var iv = aes.IV;

            using var encryptor = aes.CreateEncryptor(aes.Key, iv);
            using var ms = new MemoryStream();
            
            // Escribir IV al inicio del stream
            ms.Write(iv, 0, iv.Length);

            using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
            using (var sw = new StreamWriter(cs, Encoding.UTF8))
            {
                sw.Write(plainText);
            }

            return Convert.ToBase64String(ms.ToArray());
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error al cifrar dato sensible con AES-256.");
            throw new CryptographicException("No se pudo cifrar el dato sensible de forma segura.", ex);
        }
    }

    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText))
        {
            return cipherText;
        }

        try
        {
            var buffer = Convert.FromBase64String(cipherText);

            // Si el buffer es menor a 16 bytes (tamaño de bloque IV), no es un ciphertext válido
            if (buffer.Length < 16)
            {
                return cipherText;
            }

            var iv = new byte[16];
            Array.Copy(buffer, 0, iv, 0, iv.Length);

            using var aes = Aes.Create();
            aes.Key = _aesKey;
            aes.IV = iv;

            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            using var ms = new MemoryStream(buffer, 16, buffer.Length - 16);
            using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var sr = new StreamReader(cs, Encoding.UTF8);

            return sr.ReadToEnd();
        }
        catch (FormatException)
        {
            // En caso de que el valor existente esté en texto plano (durante migración o tests)
            return cipherText;
        }
        catch (CryptographicException)
        {
            // Si la clave no coincide o no estaba cifrado con este esquema, retornar fallback
            return cipherText;
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Advertencia al descifrar dato sensible.");
            return cipherText;
        }
    }

    public string ComputeHmacSha256(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
        {
            return string.Empty;
        }

        var normalized = plainText.Trim().ToLowerInvariant();
        using var hmac = new HMACSHA256(_hmacKey);
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(normalized));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}

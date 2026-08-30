namespace BarberLosPeluchitos.Core.Interfaces;

/// <summary>
/// Servicio de cifrado simétrico AES-256 y hashing determinístico para blind indexing (Ley 164 / D.S. 1793).
/// </summary>
public interface IEncryptionService
{
    /// <summary>
    /// Cifra una cadena de texto en claro utilizando AES-256 con vector de inicialización (IV) criptográficamente aleatorio.
    /// </summary>
    string Encrypt(string plainText);

    /// <summary>
    /// Descifra una cadena en Base64 cifrada previamente con AES-256.
    /// </summary>
    string Decrypt(string cipherText);

    /// <summary>
    /// Genera un hash determinístico e irreversible mediante HMAC-SHA256 para búsquedas y consultas exactas (Blind Index).
    /// </summary>
    string ComputeHmacSha256(string plainText);
}

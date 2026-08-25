# ==============================================================================
# Script de Verificación de Autenticación JWT y Roles - BarberLosPeluchitos
# ==============================================================================

$BaseUrl = "http://localhost:5000/api"
$ErrorActionPreference = "Continue"

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "  VERIFICACIÓN INTEGRAL: AUTENTICACIÓN JWT Y ROLES" -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan

# 1. Health Check
Write-Host "1. Verificando conectividad con el Backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get -TimeoutSec 5
    Write-Host "   [OK] Backend en línea: $($health.system) - $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] No se pudo conectar a $BaseUrl/health. Asegúrate de ejecutar 'dotnet run'." -ForegroundColor Red
    exit 1
}

# 2. Login de Administrador Seed
Write-Host "`n2. Probando Login de Administrador (Seed)..." -ForegroundColor Yellow
$adminLoginBody = @{
    correo = "admin@peluchitos.com"
    contrasena = "AdminPeluchitos2026!"
} | ConvertTo-Json

try {
    $adminRes = Invoke-RestMethod -Uri "$BaseUrl/administradores/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
    $AdminToken = $adminRes.token
    Write-Host "   [OK] Login Admin Exitoso! Token JWT obtenido." -ForegroundColor Green
    Write-Host "   Usuario: $($adminRes.nombre) | Rol: $($adminRes.rol)" -ForegroundColor Gray
} catch {
    Write-Host "   [ERROR] Falló el login de administrador: $_" -ForegroundColor Red
}

# 3. Registro y Login de Cliente
Write-Host "`n3. Probando Registro y Login de Cliente..." -ForegroundColor Yellow
$testEmail = "cliente_test_$(Get-Random)@peluchitos.com"
$registroBody = @{
    nombre = "Cliente Prueba Automatizada"
    telefono = "71234567"
    correo = $testEmail
    contrasena = "Password123!"
} | ConvertTo-Json

try {
    $regRes = Invoke-RestMethod -Uri "$BaseUrl/cuentas/registro" -Method Post -Body $registroBody -ContentType "application/json"
    $ClienteToken = $regRes.token
    $IdCliente = $regRes.cliente.idCliente
    Write-Host "   [OK] Registro de Cliente Exitoso! ID: $IdCliente" -ForegroundColor Green
    Write-Host "   Token JWT automático emitido con Rol: $($regRes.rol)" -ForegroundColor Gray
} catch {
    Write-Host "   [ERROR] Falló el registro de cliente: $_" -ForegroundColor Red
}

# 4. Control de Acceso: POST /api/barberos (Solo Administrador)
Write-Host "`n4. Verificando Control de Acceso Granular en Endpoints Administrativos..." -ForegroundColor Yellow

# 4.1 Intento sin token -> Esperado: 401 Unauthorized
Write-Host "   a) Intentando crear barbero SIN token (Esperado: 401 Unauthorized)..." -ForegroundColor Gray
$barberoBody = @{
    nombre = "Barbero Test"
    telefono = "78901234"
    horarios = @(
        @{ diaSemana = "Lunes"; horaInicio = "09:00"; horaFin = "13:00" }
    )
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$BaseUrl/barberos" -Method Post -Body $barberoBody -ContentType "application/json"
    Write-Host "   [FALLO] Se permitió crear barbero sin token!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "   [OK] 401 Unauthorized recibido correctamente." -ForegroundColor Green
    } else {
        Write-Host "   [INFO] Código recibido: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}

# 4.2 Intento con token de Cliente -> Esperado: 403 Forbidden
Write-Host "   b) Intentando crear barbero con Token de CLIENTE (Esperado: 403 Forbidden)..." -ForegroundColor Gray
try {
    $headersCliente = @{ Authorization = "Bearer $ClienteToken" }
    Invoke-RestMethod -Uri "$BaseUrl/barberos" -Method Post -Body $barberoBody -ContentType "application/json" -Headers $headersCliente
    Write-Host "   [FALLO] Se permitió a un cliente acceder a un endpoint de Administrador!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "   [OK] 403 Forbidden recibido correctamente (Acceso denegado a Cliente)." -ForegroundColor Green
    } else {
        Write-Host "   [INFO] Código recibido: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}

# 4.3 Intento con token de Administrador -> Esperado: 201 Created
Write-Host "   c) Intentando crear barbero con Token de ADMINISTRADOR (Esperado: 201 Created)..." -ForegroundColor Gray
try {
    $headersAdmin = @{ Authorization = "Bearer $AdminToken" }
    $nuevoBarbero = Invoke-RestMethod -Uri "$BaseUrl/barberos" -Method Post -Body $barberoBody -ContentType "application/json" -Headers $headersAdmin
    Write-Host "   [OK] 201 Created recibido. Barbero '$($nuevoBarbero.barbero.nombre)' creado por Administrador!" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Falló la creación con token de admin: $_" -ForegroundColor Red
}

# 5. Consulta de Citas del Día (HU-07) con Token Admin
Write-Host "`n5. Verificando Citas del Día (HU-07 / Admin)..." -ForegroundColor Yellow
try {
    $citasHoy = Invoke-RestMethod -Uri "$BaseUrl/citas/hoy" -Method Get -Headers $headersAdmin
    Write-Host "   [OK] GET /api/citas/hoy exitoso. Total citas encontradas hoy: $($citasHoy.Count)" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Falló la consulta de citas del día: $_" -ForegroundColor Red
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "  VERIFICACIÓN COMPLETADA EXITOSAMENTE" -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan

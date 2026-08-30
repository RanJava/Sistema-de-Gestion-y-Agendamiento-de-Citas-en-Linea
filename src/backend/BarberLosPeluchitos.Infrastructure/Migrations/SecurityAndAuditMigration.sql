-- ============================================================================
-- MIGRACIÓN DE SEGURIDAD, CIFRADO, AUDITORÍA INALTERABLE Y HABEAS DATA
-- Marco Normativo: Ley 164 (Bolivia), D.S. 1793, Código Penal Art. 363 ter, CPE Art. 130
-- Base de Datos: barber_peluchitos_db (PostgreSQL)
-- ============================================================================

BEGIN;

-- 1. TABLA ADMINISTRADOR: Ampliación para Cifrado AES-256 y Blind Index
ALTER TABLE administrador ALTER COLUMN correo TYPE varchar(255);
ALTER TABLE administrador ADD COLUMN IF NOT EXISTS correo_hash varchar(128);
ALTER TABLE administrador ADD COLUMN IF NOT EXISTS telefono varchar(255);
CREATE UNIQUE INDEX IF NOT EXISTS ix_administrador_correo_hash ON administrador (correo_hash);

-- 2. TABLA CLIENTE: Ampliación para Cifrado AES-256, Blind Index y Habeas Data
ALTER TABLE cliente ALTER COLUMN correo TYPE varchar(255);
ALTER TABLE cliente ALTER COLUMN telefono TYPE varchar(255);
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS correo_hash varchar(128);
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS codigo_verificacion varchar(255);
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS fecha_eliminacion timestamp NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ix_cliente_correo_hash ON cliente (correo_hash);

-- 3. TABLA BARBERO: Cifrado de datos de contacto y remoción de correo
ALTER TABLE barbero ALTER COLUMN telefono TYPE varchar(255);
ALTER TABLE barbero DROP COLUMN IF EXISTS correo;
ALTER TABLE barbero DROP COLUMN IF EXISTS correo_hash;

-- 4. TABLA DE AUDITORÍA INALTERABLE (logs_auditoria)
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id_log bigserial PRIMARY KEY,
    id_administrador int NULL,
    recurso_afectado varchar(50) NOT NULL,
    id_recurso varchar(50) NULL,
    accion varchar(20) NOT NULL,
    fecha_hora timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_origen varchar(45) NOT NULL,
    detalles varchar(500) NULL,
    CONSTRAINT fk_logs_auditoria_admin FOREIGN KEY (id_administrador) 
        REFERENCES administrador (id_administrador) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_logs_auditoria_recurso_fecha ON logs_auditoria (recurso_afectado, fecha_hora);
CREATE INDEX IF NOT EXISTS ix_logs_auditoria_admin ON logs_auditoria (id_administrador);

-- 5. INMUTABILIDAD FORENSE: TRIGGER DE BLOQUEO DE UPDATE Y DELETE
CREATE OR REPLACE FUNCTION fn_prevent_logs_auditoria_tamper()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Operación no autorizada: Los registros de logs_auditoria son inmutables por mandato de la Ley 164 y Código Penal Art. 363 ter (Integridad de Evidencia Digital).';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_logs_auditoria_prevent_tamper ON logs_auditoria;
CREATE TRIGGER tg_logs_auditoria_prevent_tamper
BEFORE UPDATE OR DELETE ON logs_auditoria
FOR EACH ROW EXECUTE FUNCTION fn_prevent_logs_auditoria_tamper();

-- 6. RESTRICCIÓN DE PRIVILEGIOS DE ROL (Aislamiento de permisos)
-- Revoca permisos UPDATE y DELETE para el usuario estándar de la aplicación
-- Nota: Reemplace 'app_user' por el nombre del usuario de la aplicación en PostgreSQL si aplica.
-- REVOKE UPDATE, DELETE, TRUNCATE ON TABLE logs_auditoria FROM PUBLIC;
-- GRANT INSERT, SELECT ON TABLE logs_auditoria TO CURRENT_USER;

COMMIT;

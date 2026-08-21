CREATE TABLE "cliente" (
  "id_cliente" serial PRIMARY KEY,
  "nombre" varchar(50) NOT NULL,
  "telefono" varchar(20) NOT NULL,
  "correo" varchar(100) UNIQUE NOT NULL,
  "contrasena_hash" varchar(255) NOT NULL,
  "fecha_registro" date NOT NULL DEFAULT (current_date)
);

CREATE TABLE "barbero" (
  "id_barbero" serial PRIMARY KEY,
  "nombre" varchar(50) NOT NULL,
  "telefono" varchar(20) NOT NULL
);

CREATE TABLE "horario_disponibilidad" (
  "id_horario" serial PRIMARY KEY,
  "id_barbero" int NOT NULL,
  "dia_semana" varchar(10) NOT NULL,
  "hora_inicio" time NOT NULL,
  "hora_fin" time NOT NULL
);

CREATE TABLE "turno" (
  "id_turno" serial PRIMARY KEY,
  "id_barbero" int NOT NULL,
  "fecha" date NOT NULL,
  "hora_inicio" time NOT NULL,
  "hora_fin" time NOT NULL,
  "estado" varchar(15) NOT NULL DEFAULT 'Disponible'
);

CREATE TABLE "servicio" (
  "id_servicio" serial PRIMARY KEY,
  "nombre" varchar(50) NOT NULL,
  "duracion_base" int NOT NULL,
  "precio_base" decimal(8,2) NOT NULL
);

CREATE TABLE "cita" (
  "id_cita" serial PRIMARY KEY,
  "id_cliente" int NOT NULL,
  "id_turno" int UNIQUE NOT NULL,
  "id_servicio" int NOT NULL,
  "fecha_hora" timestamp NOT NULL,
  "estado" varchar(15) NOT NULL DEFAULT 'Pendiente',
  "duracion" int NOT NULL,
  "precio" decimal(8,2) NOT NULL
);

CREATE UNIQUE INDEX ON "turno" ("id_barbero", "fecha", "hora_inicio");

COMMENT ON COLUMN "horario_disponibilidad"."dia_semana" IS 'Check: Lunes...Domingo';

COMMENT ON COLUMN "horario_disponibilidad"."hora_fin" IS 'Check: hora_fin > hora_inicio';

COMMENT ON COLUMN "turno"."hora_fin" IS 'Check: hora_fin > hora_inicio';

COMMENT ON COLUMN "turno"."estado" IS 'Check: Disponible, Reservado';

COMMENT ON COLUMN "servicio"."duracion_base" IS 'Check: > 0';

COMMENT ON COLUMN "servicio"."precio_base" IS 'Check: > 0';

COMMENT ON COLUMN "cita"."estado" IS 'Check: Pendiente, Atendida, Cancelada';

COMMENT ON COLUMN "cita"."duracion" IS 'Snapshot de servicio.duracion_base. Check: > 0';

COMMENT ON COLUMN "cita"."precio" IS 'Snapshot de servicio.precio_base. Check: > 0';

ALTER TABLE "horario_disponibilidad" ADD FOREIGN KEY ("id_barbero") REFERENCES "barbero" ("id_barbero") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "turno" ADD FOREIGN KEY ("id_barbero") REFERENCES "barbero" ("id_barbero") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "cita" ADD FOREIGN KEY ("id_cliente") REFERENCES "cliente" ("id_cliente") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "cita" ADD FOREIGN KEY ("id_turno") REFERENCES "turno" ("id_turno") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "cita" ADD FOREIGN KEY ("id_servicio") REFERENCES "servicio" ("id_servicio") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

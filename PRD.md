# Product Requirements Document (PRD)
## Sistema de Gestión y Agendamiento de Citas en Línea: "BarberLosPeluchitos"

### Control del Documento

- **Proyecto:** BarberLosPeluchitos (Sistema de Gestión y Agendamiento de Citas en Línea para Servicios de Barbería y Peluquería)
- **Institución:** Universidad Privada Domingo Savio (UPDS) – Facultad de Ingeniería
- **Materia:** Sistemas de Información I – Turno Medio Día
- **Autores / Equipo de Desarrollo:**
  - Jose Andrés Villavicencio Aguayo
  - Denis Morales
  - Carlos Alvaro Flores
- **Docente Revisor:** Ing. Nelson Huanca
- **Ubicación y Fecha:** Tarija, Bolivia – Agosto 2026
- **Versión del PRD:** 1.2 (MVP) — actualizado: stack de backend (ASP.NET Core) y citas legales verificadas contra fuentes oficiales
- **Repositorio Oficial:** https://github.com/RanJava/Sistema-de-Gestion-y-Agendamiento-de-Citas-en-Linea

---

## 1. Visión del Producto y Contexto de Negocio

### 1.1 Contexto del Problema

En el sector tradicional de barberías y peluquerías en Bolivia, la gestión de turnos se realiza de manera manual mediante cuadernos de apuntes o mensajes no estructurados de WhatsApp. Esta metodología provoca:

- Solapamiento y dobles reservas debido a la falta de un control transaccional centralizado.
- Pérdida de productividad e interrupciones constantes: los barberos y estilistas deben pausar sus servicios para responder llamadas o mensajes.
- Ausencia de visibilidad en tiempo real: los clientes desconocen la disponibilidad real del profesional de su preferencia, aumentando los tiempos de espera presenciales o provocando inasistencias sin previo aviso (no-shows).
- Falta de métricas y control operativo: los administradores carecen de trazabilidad sobre el estado de las citas (pendientes, atendidas, canceladas) y el volumen diario de atención.

### 1.2 Declaración de Visión del Producto

Proveer una plataforma web responsiva (WebApp) intuitiva, confiable y accesible 24/7 que automatice integralmente el ciclo de vida del agendamiento de servicios de barbería y estilismo. La solución permite al cliente final autogestionar sus reservas en tiempo real según la disponibilidad de su barbero y servicio preferido, al tiempo que dota a la administración y al personal de una agenda digital optimizada, reduciendo tiempos muertos y errores humanos.

### 1.3 Actores Clave y Beneficiarios

| Actor | Rol y Responsabilidad | Beneficio Directo |
|---|---|---|
| Cliente Final | Usuario registrado que consulta horarios disponibles, reserva citas para servicios específicos y gestiona cancelaciones. | Autoservicio 24/7 sin llamadas, confirmación instantánea, reducción de tiempos de espera en el local. |
| Administrador / Dueño | Responsable de la gestión del negocio: registro del personal (barberos), configuración de horarios laborales semanales y monitoreo del estado de las citas diarias. | Centralización operativa, eliminación de solapamientos, control en tiempo real de citas cumplidas vs. canceladas. |
| Barbero / Estilista | Profesional asignado que atiende los turnos reservados. | Agenda diaria despejada, cero interrupciones durante el corte, optimización de su jornada laboral. |

### 1.4 Objetivos SMART del Proyecto

**Objetivo Central (SMART):** Desarrollar y desplegar una aplicación web (WebApp) de agendamiento de citas en línea para servicios de barbería y peluquería, accesible desde cualquier dispositivo con navegador, que permita a los clientes reservar horarios disponibles en tiempo real y a la administración gestionar su agenda diaria, durante las 2 semanas de práctica académica establecidas para el curso (Demo Final: Fin de Semana 2).

**Objetivos Específicos:**
1. Implementar el módulo de registro y agendamiento de citas con visualización en tiempo real de disponibilidad por barbero y franja horaria.
2. Automatizar la confirmación inmediata de citas y el mecanismo de cancelación para liberar turnos oportunamente.
3. Habilitar un panel administrativo centralizado para controlar el estado de las citas (Pendiente, Atendida, Cancelada) y la agenda del día.

### 1.5 Límites del Sistema (Alcance)

**Alcance Incluido en el MVP (Sprints 1 y 2):**
- Registro y autenticación básica de clientes (con contraseña hasheada).
- Módulo administrativo de gestión de barberos y sus horarios semanales de disponibilidad.
- Consulta de disponibilidad de turnos en tiempo real con bloqueo automático de franjas pasadas y control de concurrencia.
- Agendamiento de citas con snapshot de duración y precio del servicio seleccionado.
- Confirmación inmediata de cita y opción de cancelación por parte del cliente.
- Panel administrativo para visualización de agenda diaria y cambio de estados de cita.

**Alcance Excluido (Post-MVP / Release 2 / Fuera de Alcance):**
- Pasarela de pagos electrónicos en línea (se cobra en caja física / local).
- Aplicación móvil nativa (Android/iOS) — el producto es exclusivamente WebApp responsiva.
- Sistema de fidelización, cupones o acumulación de puntos.
- Facturación electrónica computarizada en línea (SIAT/SIN) o reportes financieros contables avanzados.
- Autenticación OAuth con redes sociales (Google, Facebook) en fase inicial.
- Recordatorios automatizados por SMS o WhatsApp Business API (HU-10 programada para Release 2).
- Historial analítico consolidado por cliente (HU-09 programada para Release 2).

---

## 2. Stack Tecnológico y Arquitectura del Sistema

### 2.1 Arquitectura del Software

Arquitectura desacoplada basada en capas bajo el patrón MVC / Clean Architecture:

- **Capa de Presentación (Frontend):** Single Page Application (SPA) responsiva construida en React 19 + TypeScript y Tailwind CSS para diseño mobile-first.
- **Capa de Aplicación / Negocio (Backend):** API RESTful desarrollada en **ASP.NET Core (C#)**, encargada de la validación de reglas de negocio, sincronización de concurrencia y orquestación transaccional.
- **Capa de Persistencia (Base de Datos):** Motor Relacional PostgreSQL asegurando integridad referencial ACID estricta para evitar dobles reservas, accedido mediante **Entity Framework Core** con el proveedor Npgsql.
- **Modelado Formal:** Diagramación UML completa (Casos de Uso, Secuencia, Clases, Estados) generada en PlantUML.

### 2.2 Stack Técnico Detallado

| Componente | Tecnología Seleccionada | Justificación Técnica |
|---|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS, Lucide React, Motion | Renderizado dinámico de agendas, tipado estricto, interfaces limpias y adaptadas a pantallas móviles y de escritorio. |
| Backend / API | ASP.NET Core Web API (C#), Entity Framework Core, Npgsql | Framework robusto orientado a capas (Controllers/Services/Repositories) alineado con la arquitectura Clean Architecture definida; manejo nativo de concurrencia y transacciones para evitar dobles reservas. |
| Base de Datos | PostgreSQL 15+ | Soporte nativo de transacciones ACID, tipos TIME, DATE, TIMESTAMP, índices únicos y claves foráneas con políticas de borrado (CASCADE/RESTRICT). |
| Seguridad y Criptografía | ASP.NET Core Identity (hashing de contraseñas), JWT Bearer Authentication | Cumplimiento del principio de no almacenar credenciales en texto plano (Ley 164 / D.S. 1793), con mecanismos de autenticación integrados al framework. |
| Control de Versiones & CI/CD | Git, GitHub | Integración continua, trazabilidad del código y despliegue automatizado. |

### 2.3 Justificación del Backend (ASP.NET Core)

Para el desarrollo del backend de BarberLosPeluchitos se seleccionó **ASP.NET Core** como framework principal, en base a los siguientes criterios:

**Curva de aprendizaje del equipo:** al igual que con React en el frontend, el criterio determinante fue la experiencia previa del equipo con el ecosistema .NET, lo que permite enfocar el tiempo del sprint en la implementación de funcionalidades en lugar de en el aprendizaje de una tecnología nueva.

**Alineación con la arquitectura definida:** el PRD establece una arquitectura por capas (MVC / Clean Architecture); ASP.NET Core provee convenciones y tooling nativo para este patrón (Controllers, Dependency Injection, separación de capas), reduciendo la necesidad de configuración manual.

**Integración con el modelo de datos:** mediante Entity Framework Core y el proveedor Npgsql, las entidades definidas en la Sección 3 (CLIENTE, BARBERO, TURNO, SERVICIO, CITA) se mapean directamente contra PostgreSQL, incluyendo las restricciones CHECK ya definidas en el DDL.

**Seguridad integrada:** ASP.NET Core Identity y JWT Bearer Authentication cubren de forma nativa los requisitos de hashing de contraseñas y sesiones seguras exigidos por la Ley 164 y el D.S. 1793, sin necesidad de integrar librerías externas adicionales.

> **Nota:** este backend se está construyendo con apoyo de una herramienta de desarrollo asistido por IA (Antigravity), utilizando como base el modelo de datos y las reglas de negocio definidas en este documento.

---

## 3. Modelo de Datos Exacto (Diccionario y DDL SQL)

### 3.1 Diagrama Entidad-Relación Lógico

```
+------------------+       1:N       +--------------------------+
|     BARBERO      |----------------<|   HORARIO_DISPONIBILIDAD |
+------------------+                 +--------------------------+
        | 1:N
        |
        v
+------------------+       1:1 (Max) +--------------------------+       N:1       +------------------+
|      TURNO       |----------------<|           CITA           |>----------------|     SERVICIO     |
+------------------+                 +--------------------------+                 +------------------+
                                                  | N:1
                                                  v
                                     +--------------------------+
                                     |         CLIENTE          |
                                     +--------------------------+
```

### 3.2 Diccionario de Datos Exhaustivo

**1. Tabla: CLIENTE** — Almacena la información de los usuarios finales que reservan citas en el sistema.

| Atributo | Tipo de Dato | Nulo | Clave | Restricciones / Reglas | Descripción |
|---|---|---|---|---|---|
| id_cliente | SERIAL | NO | PK | Autoincremental | Identificador único del cliente. |
| nombre | VARCHAR(50) | NO | - | Formato texto no vacío | Nombre completo del cliente. |
| telefono | VARCHAR(20) | NO | - | Formato numérico / internacional | Teléfono móvil o WhatsApp de contacto. |
| correo | VARCHAR(100) | NO | UNIQUE | Formato de email válido | Correo electrónico utilizado para login (no admite duplicados). |
| contrasena_hash | VARCHAR(255) | NO | - | Criptografía irreversible | Hash de contraseña con salt (nunca texto plano). |
| fecha_registro | DATE | NO | - | Default CURRENT_DATE | Fecha de creación de la cuenta en el sistema. |

**2. Tabla: BARBERO** — Almacena a los profesionales estilistas/barberos que prestan servicios en el local.

| Atributo | Tipo de Dato | Nulo | Clave | Restricciones / Reglas | Descripción |
|---|---|---|---|---|---|
| id_barbero | SERIAL | NO | PK | Autoincremental | Identificador único del barbero. |
| nombre | VARCHAR(50) | NO | - | Formato texto no vacío | Nombre y apellido del barbero. |
| telefono | VARCHAR(20) | NO | - | Formato de contacto | Teléfono de contacto personal o laboral. |

**3. Tabla: HORARIO_DISPONIBILIDAD** — Define la plantilla de horarios semanales recurrentes asignados a cada barbero.

| Atributo | Tipo de Dato | Nulo | Clave | Restricciones / Reglas | Descripción |
|---|---|---|---|---|---|
| id_horario | SERIAL | NO | PK | Autoincremental | Identificador de la franja horaria. |
| id_barbero | INT | NO | FK | REFERENCES BARBERO(id_barbero) ON DELETE CASCADE | Barbero al que pertenece la disponibilidad. |
| dia_semana | VARCHAR(10) | NO | - | CHECK (dia_semana IN ('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo')) | Día de la semana en que aplica el horario. |
| hora_inicio | TIME | NO | - | - | Hora de inicio de la jornada en ese día. |
| hora_fin | TIME | NO | - | CHECK (hora_fin > hora_inicio) | Hora de finalización de la jornada. |

**4. Tabla: TURNO** — Representa los slots o intervalos específicos generados por fecha para cada barbero.

| Atributo | Tipo de Dato | Nulo | Clave | Restricciones / Reglas | Descripción |
|---|---|---|---|---|---|
| id_turno | SERIAL | NO | PK | Autoincremental | Identificador único del turno. |
| id_barbero | INT | NO | FK | REFERENCES BARBERO(id_barbero) ON DELETE CASCADE | Barbero asignado al slot. |
| fecha | DATE | NO | - | - | Fecha calendario del turno. |
| hora_inicio | TIME | NO | - | - | Hora de inicio del slot. |
| hora_fin | TIME | NO | - | CHECK (hora_fin > hora_inicio) | Hora de finalización del slot. |
| estado | VARCHAR(15) | NO | - | CHECK (estado IN ('Disponible', 'Reservado')) DEFAULT 'Disponible' | Estado de reserva del turno. |

**5. Tabla: SERVICIO** — Catálogo de cortes y tratamientos ofrecidos en la barbería.

| Atributo | Tipo de Dato | Nulo | Clave | Restricciones / Reglas | Descripción |
|---|---|---|---|---|---|
| id_servicio | SERIAL | NO | PK | Autoincremental | Identificador único del servicio. |
| nombre | VARCHAR(50) | NO | - | Nombre único del servicio | Descripción comercial (ej. Corte Clásico, Barba, Combo). |
| duracion_base | INT | NO | - | CHECK (duracion_base > 0) | Duración estimada del servicio en minutos. |
| precio_base | DECIMAL(8,2) | NO | - | CHECK (precio_base > 0) | Tarifa base de referencia en moneda nacional (BOB). |

**6. Tabla: CITA** — Registro de la reserva concretada entre cliente, servicio y turno.

| Atributo | Tipo de Dato | Nulo | Clave | Restricciones / Reglas | Descripción |
|---|---|---|---|---|---|
| id_cita | SERIAL | NO | PK | Autoincremental | Identificador único de la cita. |
| id_cliente | INT | NO | FK | REFERENCES CLIENTE(id_cliente) ON DELETE RESTRICT | Cliente que realizó la reserva. |
| id_turno | INT | NO | FK / UNIQUE | REFERENCES TURNO(id_turno) ON DELETE RESTRICT (1 turno = máx 1 cita) | Turno reservado. |
| id_servicio | INT | NO | FK | REFERENCES SERVICIO(id_servicio) ON DELETE RESTRICT | Servicio contratado. |
| fecha_hora | TIMESTAMP | NO | - | Default CURRENT_TIMESTAMP | Momento exacto de confirmación de la reserva. |
| estado | VARCHAR(15) | NO | - | CHECK (estado IN ('Pendiente', 'Atendida', 'Cancelada')) DEFAULT 'Pendiente' | Ciclo de vida de la cita. |
| duracion | INT | NO | - | CHECK (duracion > 0) | Snapshot de duracion_base al reservar. |
| precio | DECIMAL(8,2) | NO | - | CHECK (precio > 0) | Snapshot de precio_base al reservar (protege contra variaciones futuras de tarifas). |

### 3.3 Script DDL SQL (PostgreSQL Compatible)

```sql
-- Creación de Base de Datos para BarberLosPeluchitos
CREATE TABLE CLIENTE (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE BARBERO (
    id_barbero SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    telefono VARCHAR(20) NOT NULL
);

CREATE TABLE HORARIO_DISPONIBILIDAD (
    id_horario SERIAL PRIMARY KEY,
    id_barbero INT NOT NULL,
    dia_semana VARCHAR(10) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    CONSTRAINT fk_horario_barbero FOREIGN KEY (id_barbero)
        REFERENCES BARBERO(id_barbero) ON DELETE CASCADE,
    CONSTRAINT chk_dia_semana CHECK (dia_semana IN ('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo')),
    CONSTRAINT chk_rango_horario CHECK (hora_fin > hora_inicio)
);

CREATE TABLE TURNO (
    id_turno SERIAL PRIMARY KEY,
    id_barbero INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado VARCHAR(15) NOT NULL DEFAULT 'Disponible',
    CONSTRAINT fk_turno_barbero FOREIGN KEY (id_barbero)
        REFERENCES BARBERO(id_barbero) ON DELETE CASCADE,
    CONSTRAINT chk_turno_rango CHECK (hora_fin > hora_inicio),
    CONSTRAINT chk_turno_estado CHECK (estado IN ('Disponible', 'Reservado'))
);

CREATE TABLE SERVICIO (
    id_servicio SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    duracion_base INT NOT NULL,
    precio_base DECIMAL(8,2) NOT NULL,
    CONSTRAINT chk_duracion_base CHECK (duracion_base > 0),
    CONSTRAINT chk_precio_base CHECK (precio_base > 0)
);

CREATE TABLE CITA (
    id_cita SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_turno INT NOT NULL UNIQUE,
    id_servicio INT NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(15) NOT NULL DEFAULT 'Pendiente',
    duracion INT NOT NULL,
    precio DECIMAL(8,2) NOT NULL,
    CONSTRAINT fk_cita_cliente FOREIGN KEY (id_cliente)
        REFERENCES CLIENTE(id_cliente) ON DELETE RESTRICT,
    CONSTRAINT fk_cita_turno FOREIGN KEY (id_turno)
        REFERENCES TURNO(id_turno) ON DELETE RESTRICT,
    CONSTRAINT fk_cita_servicio FOREIGN KEY (id_servicio)
        REFERENCES SERVICIO(id_servicio) ON DELETE RESTRICT,
    CONSTRAINT chk_cita_estado CHECK (estado IN ('Pendiente', 'Atendida', 'Cancelada')),
    CONSTRAINT chk_cita_duracion CHECK (duracion > 0),
    CONSTRAINT chk_cita_precio CHECK (precio > 0)
);

-- Índices de optimización para búsqueda en tiempo real
CREATE INDEX idx_turno_busqueda ON TURNO(id_barbero, fecha, estado);
CREATE INDEX idx_cita_fecha ON CITA(fecha_hora, estado);
```

---

## 4. Marco Legal y Cumplimiento Normativo (Leyes Bolivianas Citadas)

El sistema BarberLosPeluchitos se rige bajo el marco jurídico vigente del Estado Plurinacional de Bolivia. **Nota de revisión:** las citas de esta sección fueron verificadas contra fuentes oficiales/secundarias disponibles en línea (Gaceta Oficial, Lexivox, vLex, WIPO Lex) el 24/08/2026. Se corrigieron varios errores de número de artículo y un error de tema (ver historial de cambios al final de la sección).

### 4.1 Ley N° 164 (Ley General de Telecomunicaciones, Tecnologías de Información y Comunicación)
- **Artículo 5 (Principios):** Principios de confidencialidad, integridad y seguridad en el uso de medios y servicios digitales.
- **Artículo 56 (Protección de Datos Personales — vía su Reglamento, D.S. N° 1793):** El sistema garantiza que los datos personales recabados (nombre, teléfono, correo) serán utilizados exclusivamente para la gestión operativa de citas y no serán cedidos ni comercializados a terceros sin consentimiento expreso.
- **Artículo 78 (Comercio Electrónico y Mensajes de Datos):** Otorga validez jurídica y probatoria a los actos o negocios amparados por documentos digitales, mensajes electrónicos de datos y firma digital — respalda la validez de confirmaciones automáticas digitales y cancelaciones cursadas a través de la WebApp.

### 4.2 Decreto Supremo N° 1793 (Reglamento para el Desarrollo de Tecnologías de Información y Comunicación)
- **Artículo 56 (Protección de datos personales):** Obligatoriedad de implementar mecanismos técnicos de protección sobre credenciales y accesos. Se prohíbe el almacenamiento de contraseñas en texto plano, obligando el uso de algoritmos criptográficos robustos de hash con salting (contrasena_hash).

### 4.3 Ley N° 453 (Ley General de los Derechos de las Usuarias y los Usuarios y de las Consumidoras y los Consumidores)
- **Artículo 13 (Derecho a la Información):** Los usuarios tienen derecho a recibir información fidedigna, veraz, completa, adecuada, gratuita y oportuna sobre las características de los servicios que utilizan — aplica a la descripción del servicio, su duración estimada en minutos y el precio final en moneda de curso legal (Bolivianos - BOB) previo a confirmar la reserva.
- **Derecho al Trato Equitativo (reconocido en la Ley, en el capítulo de derechos que sigue al Art. 13):** Asignación transparente de turnos basada en orden cronológico estricto de llegada de solicitudes (First-Come, First-Served), sin discriminación entre clientes.
- **Artículo 6 (Principio de Favorabilidad):** En caso de duda sobre el alcance de una condición de servicio (por ejemplo, una cancelación), se aplicará la interpretación más favorable al usuario — principio que respalda RN-05 y la posibilidad de cancelar una cita sin penalizaciones no pactadas.

> **Nota:** la versión anterior de este PRD citaba el Art. 4 y el Art. 35 de la Ley 453 para estos puntos. Se verificó que el Art. 4 en realidad regula "Alcance de Políticas" (competencias del Estado, no derechos del consumidor) y que el Art. 35 regula "Alcance del Consumo Responsable y Sustentable" (consumo en armonía con el medio ambiente), sin relación con derechos de información o cancelación. Ambas citas fueron corregidas o retiradas.

### 4.4 Ley General del Trabajo de Bolivia (LGT) y D.S. Reglamentario
Jornada Laboral y Descansos: La carga de horarios de disponibilidad para barberos y estilistas (HORARIO_DISPONIBILIDAD) debe respetar los límites legales de la jornada laboral diaria y los días de descanso obligatorio, validando que las franjas horarias no excedan los parámetros estipulados y asegurando el registro de horarios coherentes (hora_fin > hora_inicio).

### 4.5 Código de Comercio de Bolivia
Artículo 36 y ss. (Obligaciones de los Comerciantes): Mantenimiento ordenado y cronológico del registro de operaciones y prestación de servicios mercantiles, sustentado por el histórico auditable de citas registradas y atendidas.

---

## 5. Reglas de Negocio (RN)

| Código | Nombre de la Regla | Descripción y Comportamiento del Sistema |
|---|---|---|
| RN-01 | Unicidad de Identidad y Autenticación | Cada cuenta de cliente debe contar con un correo electrónico único (UNIQUE). La contraseña debe registrarse forzosamente como un hash irreversible de alta seguridad. Un usuario invitado no puede confirmar una reserva sin autenticarse previamente. |
| RN-02 | Concurrencia Transaccional e Inmutabilidad de Turno | Un turno (TURNO) puede asociarse a una única cita (CITA.id_turno UNIQUE). Si dos clientes solicitan el mismo turno en el mismo milisegundo, la base de datos resolverá mediante bloqueo optimista/pesimista: la primera transacción adquiere el turno pasando a Reservado y la segunda es rechazada informando al usuario que el turno fue tomado. |
| RN-03 | Coherencia y Validez Temporal | Toda franja horaria (hora_fin) debe ser estrictamente posterior a hora_inicio. Al consultar turnos para el día en curso, el sistema debe filtrar y ocultar automáticamente aquellos turnos cuya hora de inicio sea anterior a la hora actual (CURRENT_TIME). |
| RN-04 | Snapshot Histórico de Tarifas y Tiempos | Al crearse la cita (CITA), los valores actuales de duracion_base y precio_base de la tabla SERVICIO se copian irrevocablemente a las columnas duracion y precio de la cita, protegiendo el acuerdo comercial contra modificaciones futuras del catálogo (Ley 453). |
| RN-05 | Ciclo de Vida y Transición de Estados | Las citas inician forzosamente en estado Pendiente. La administración puede cambiar el estado a Atendida o Cancelada. Si un cliente o administrador cancela la cita, el estado del turno vinculado (TURNO.estado) se actualiza a Disponible, liberando el cupo inmediatamente. |
| RN-06 | Filtro de Visibilidad por Disponibilidad Activa | Aquellos barberos que no cuenten con horarios de disponibilidad configurados o cuyos turnos futuros estén agotados no aparecerán como seleccionables para nuevas citas. |

---

## 6. Backlog de Historias de Usuario para el MVP

### Matriz del MVP vs. Release 2

```
+------------------------------------------------------------------------------------------------+
| SPRINT 1 (Semana 1)                                                                            |
|   • HU-01: Registro de cuenta de cliente [Alta]                                                |
|   • HU-02: Registro de barberos/estilistas y sus horarios [Alta]                              |
|   • HU-03: Ver disponibilidad de horarios en tiempo real [Alta]                                |
|   • HU-04: Agendar cita (servicio, barbero, horario) [Alta]                                    |
+------------------------------------------------------------------------------------------------+
| SPRINT 2 (Semana 2 - Cierre de MVP para Demo Final)                                            |
|   • HU-05: Confirmación automática de la cita [Alta]                                           |
|   • HU-06: Cancelar una cita agendada [Media]                                                  |
|   • HU-07: Ver listado de citas del día - Panel Admin [Alta]                                   |
|   • HU-08: Actualizar estado de una cita - Panel Admin [Alta]                                  |
+------------------------------------------------------------------------------------------------+
| BACKLOG / RELEASE 2 (Post-Demo)                                                                |
|   • HU-09: Ver historial de citas por cliente [Media]                                          |
|   • HU-10: Recordatorio de cita próxima vía mensaje [Media]                                    |
+------------------------------------------------------------------------------------------------+
```

### Detalle de Historias de Usuario y Criterios de Aceptación (Gherkin)

> **Nota sobre trazabilidad:** los criterios de HU-01 a HU-04 fueron validados mediante el proceso de entrevista/refinamiento (Actividad 4). Los criterios de HU-05 a HU-08 se presentan como **propuesta técnica del equipo**, pendientes de una validación equivalente antes de tomarse como definitivos.

#### ÉPICA 1: REGISTRO DE CLIENTE Y PERSONAL

**HU-01 — Registro de cuenta de cliente**
Descripción: Como cliente nuevo, quiero poder registrar mi cuenta con mi nombre, teléfono y correo electrónico, para poder agendar citas y que el negocio me identifique en el sistema.
Prioridad: Alta | Sprint: Semana 1

Criterios de Aceptación:
1. **(Registro exitoso):** Dado que el cliente se encuentra en la pantalla de registro, cuando completa su nombre, teléfono y correo con datos válidos y confirma, entonces el sistema encripta la contraseña, persiste la cuenta en CLIENTE y redirige al login o al inicio.
2. **(Correo duplicado):** Dado que se intenta registrar una cuenta con un correo ya existente en la base de datos, cuando se envía el formulario, entonces el sistema bloquea el registro y muestra un error indicando que el correo ya está en uso.
3. **(Campos obligatorios vacíos):** Dado que el usuario omite ingresar el nombre, teléfono o correo, cuando intenta confirmar el registro, entonces el sistema resalta los campos faltantes y no envía la petición.
4. **(Validación de formato de correo):** Dado que se ingresa un correo con formato sintáctico inválido, cuando se valida el formulario, entonces el sistema muestra un mensaje de validación de formato.

**HU-02 — Registro de barberos/estilistas y sus horarios**
Descripción: Como administrador del local, quiero poder registrar a los barberos/estilistas junto con sus horarios de disponibilidad, para que el sistema sepa quién trabaja, cuándo y pueda ofrecer esos horarios a los clientes.
Prioridad: Alta | Sprint: Semana 1

Criterios de Aceptación:
1. **(Alta de personal y horario):** Dado que el administrador ingresa el nombre, teléfono y franjas horarias semanales de un barbero, cuando confirma el formulario, entonces el sistema almacena el registro en BARBERO y HORARIO_DISPONIBILIDAD, listándolo en el catálogo del staff.
2. **(Actualización de disponibilidad en tiempo real):** Dado que un barbero ya cuenta con horarios registrados, cuando el administrador modifica su jornada, entonces el sistema actualiza de forma inmediata la disponibilidad en el módulo público de reservas.
3. **(Validación de rango horario inconsistente):** Dado que se intenta registrar una franja donde la hora de fin es igual o anterior a la hora de inicio, cuando se envía el formulario, entonces el sistema rechaza la operación y notifica el error de rango inválido.
4. **(Barbero sin disponibilidad):** Dado que un barbero no tiene horarios cargados en el sistema, cuando un cliente busca disponibilidad en la WebApp, entonces dicho barbero no figura como opción disponible para agendamiento.

#### ÉPICA 2: AGENDAMIENTO DE CITA

**HU-03 — Ver disponibilidad de horarios en tiempo real**
Descripción: Como cliente, quiero ver en tiempo real qué horarios están disponibles por barbero/estilista, para elegir un turno que realmente esté libre sin tener que llamar o preguntar.
Prioridad: Alta | Sprint: Semana 1

Criterios de Aceptación:
1. **(Visualización de turnos libres):** Dado que el cliente selecciona un barbero y una fecha, cuando consulta la agenda, entonces el sistema muestra únicamente los slots con estado Disponible dentro de la jornada de trabajo del profesional.
2. **(Fecha sin turnos libres):** Dado que no existen turnos disponibles para la fecha consultada, cuando se procesa la consulta, entonces el sistema emite el mensaje "Sin turnos disponibles para esta fecha" y ofrece el botón para saltar al día siguiente.
3. **(Bloqueo por concurrencia simultánea):** Dado que un turno es reservado por otro usuario mientras el cliente observaba la pantalla, cuando este intenta seleccionarlo, entonces el sistema refresca la vista, bloquea el slot e informa que el horario acaba de ser tomado.
4. **(Filtrado de horarios pasados para el día actual):** Dado que se consulta la disponibilidad para el día de hoy, cuando se cargan los horarios, entonces el sistema filtra y omite automáticamente los turnos cuya hora de inicio ya transcurrió.

**HU-04 — Agendar cita (servicio, barbero, horario)**
Descripción: Como cliente, quiero poder seleccionar un servicio, un barbero/estilista y un horario disponible para reservar mi cita, para asegurarme un turno sin necesidad de ir presencialmente o llamar al local.
Prioridad: Alta | Sprint: Semana 1

Criterios de Aceptación:
1. **(Habilitación de confirmación):** Dado que el usuario ha seleccionado satisfactoriamente el servicio, el barbero y un horario disponible, cuando los 3 parámetros son válidos, entonces el sistema activa el botón de confirmación de reserva.
2. **(Control de usuario no autenticado):** Dado que un usuario navega como invitado e intenta confirmar una reserva, cuando presiona reservar, entonces el sistema intercepta el flujo exigiéndole iniciar sesión o crear una cuenta.
3. **(Manejo de condiciones de carrera):** Dado que dos clientes confirman el mismo turno simultáneamente, cuando las peticiones impactan en el backend, entonces el sistema adjudica el turno al primer requerimiento creando la cita en estado Pendiente y notifica al segundo usuario para que elija otro turno.
4. **(Cálculo de snapshot de precio y duración):** Dado que la reserva es confirmada exitosamente, cuando se registra la fila en CITA, entonces el sistema guarda la duración y el precio vigentes del servicio y cambia el estado del turno a Reservado.

#### ÉPICA 3: CONFIRMACIÓN Y CANCELACIÓN

**HU-05 — Confirmación automática de la cita**
Descripción: Como cliente, quiero recibir una confirmación automática apenas agendo una cita, para tener la certeza de que mi reserva quedó registrada correctamente.
Prioridad: Alta | Sprint: Semana 2

Criterio de Aceptación (propuesto):
Dado que la cita ha sido registrada satisfactoriamente en la base de datos, cuando finaliza la transacción, entonces la interfaz muestra una vista modal/pantalla de confirmación con el código de cita, nombre del barbero, servicio, fecha, hora y monto a cancelar en caja.

**HU-06 — Cancelar una cita agendada**
Descripción: Como cliente, quiero poder cancelar una cita que ya agendé, para liberar el horario si ya no puedo asistir y evitar quedar mal con el local.
Prioridad: Media | Sprint: Semana 2

Criterio de Aceptación (propuesto):
Dado que el cliente visualiza su cita activa en estado Pendiente, cuando presiona "Cancelar Cita" y confirma el cuadro de diálogo, entonces el sistema actualiza el estado de la cita a Cancelada y libera el turno asociado cambiando su estado a Disponible de inmediato.

#### ÉPICA 4: GESTIÓN ADMINISTRATIVA

**HU-07 — Ver listado de citas del día (Panel Administrativo)**
Descripción: Como administrador del local, quiero ver un listado de todas las citas del día, para organizar la operación diaria y saber qué clientes esperar y a qué hora.
Prioridad: Alta | Sprint: Semana 2

Criterio de Aceptación (propuesto):
Dado que el administrador ingresa al panel de control, cuando selecciona la fecha de consulta (por defecto la fecha actual), entonces el sistema lista todas las citas del día ordenadas cronológicamente, indicando cliente, teléfono, barbero asignado, servicio, hora y estado actual.

**HU-08 — Actualizar estado de una cita**
Descripción: Como administrador del local, quiero poder actualizar el estado de una cita (Pendiente / Atendida / Cancelada), para llevar un control real de qué citas se cumplieron y cuáles no.
Prioridad: Alta | Sprint: Semana 2

Criterio de Aceptación (propuesto):
Dado que una cita se encuentra en estado Pendiente en el panel administrativo, cuando el administrador marca la cita como Atendida tras finalizar el corte, entonces el sistema guarda el nuevo estado y actualiza las métricas del día. Cuando el administrador marca la cita como Cancelada por inasistencia, entonces el sistema registra la cancelación y permite liberar el slot si aplica.

#### BACKLOG POST-MVP (Release 2)

**HU-09 — Ver historial de citas por cliente**
Descripción: Como administrador del local, quiero ver el historial de citas de un cliente específico, para conocer su frecuencia de visita y sus preferencias de servicio.
Prioridad: Media | Sprint: Fuera del alcance del MVP (Release 2)

**HU-10 — Recordatorio de cita próxima**
Descripción: Como cliente, quiero recibir un recordatorio antes de mi cita agendada, para no olvidarme del turno y llegar a tiempo.
Prioridad: Media | Sprint: Fuera del alcance del MVP (Release 2)

---

## 7. Modelado y Especificación Técnica (PlantUML)

> Los diagramas de casos de uso, secuencia, clases y estados para HU-01 a HU-04 se encuentran en el repositorio oficial: https://github.com/RanJava/Sistema-de-Gestion-y-Agendamiento-de-Citas-en-Linea/tree/main/docs/uml

---

## 8. Criterios de Calidad y No Funcionales (NFR)

> Los siguientes valores son estimaciones de referencia propuestas por el equipo, no derivadas de una entrevista o SLA formal documentado; ajustar si el docente o el proceso de refinamiento definen otros valores.

- **Rendimiento y Latencia:** La respuesta a consultas de disponibilidad de turnos no debe exceder los 300 ms en condiciones normales de tráfico.
- **Disponibilidad y Concurrencia:** La WebApp debe estar disponible 24/7 con soporte para múltiples peticiones concurrentes sin generar dobles reservas, apoyándose en el aislamiento transaccional de PostgreSQL y el manejo de concurrencia de Entity Framework Core.
- **Diseño Adaptativo (Mobile-First):** La interfaz de usuario debe ofrecer una experiencia fluida e intuitiva en pantallas de smartphones (desde 360px de ancho) y navegadores de escritorio.
- **Seguridad y Privacidad:** Cumplimiento estricto de la Ley 164 y D.S. 1793 mediante canales cifrados HTTPS/TLS y hashing robusto de contraseñas vía ASP.NET Core Identity.

---

## 9. Marco Legal y Ética de Datos

### 9.1 Habeas Data (Art. 130 CPE)

Actualmente el sistema no implementa autoservicio de Habeas Data: el cliente puede consultar sus propios datos vía `GET /api/cuentas/{id}`, pero no existe endpoint para que solicite la rectificación o eliminación de su información (`nombre`, `telefono`, `correo`). Se identifica como brecha a corregir en la Fase C de esta auditoría: se añadirá `DELETE /api/cuentas/{id}` (baja lógica, preservando el histórico de citas por obligación mercantil del Código de Comercio Art. 36) y `PUT /api/cuentas/{id}` para rectificación de datos.

### 9.2 Ley 164 — Estándares y Firma Digital

El sistema no maneja firma digital criptográfica per se; la validez probatoria de confirmaciones y cancelaciones se sustenta en el Art. 78 (mensajes de datos), respaldada por timestamps en el histórico de `cita` y `turno`. Como estándar abierto, la API expone contratos en JSON sobre HTTP (REST), documentados con OpenAPI/Swagger.

### 9.3 Seguridad ASFI: Cifrado y Logs de Auditoría

Estado actual (hallazgo de auditoría): `telefono` y `correo` se almacenan en texto plano en la tabla `cliente`; no existe una tabla de logs de auditoría que registre accesos a datos sensibles por parte de personal administrativo.

Medidas a implementar (Fase C):

- Cifrado en reposo (AES) para el campo `telefono` (dato de contacto sensible).
- Cifrado en reposo (AES) para el campo `correo`, dado que constituye un dato personal identificable y es también el medio usado para autenticación/recuperación de cuenta; se mantiene un índice hash determinístico (HMAC) sobre el correo para permitir búsquedas de login sin exponer el valor en claro en la base de datos.
- Tabla `logs_auditoria` inalterable (solo INSERT, sin UPDATE/DELETE a nivel de permisos de BD) que registre: quién (id_administrador), qué recurso, qué acción y cuándo, cada vez que se consulta el historial o los datos de un cliente vía `AdminClientesController`.

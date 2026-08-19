# 💈 Sistema de Gestión y Agendamiento de Citas en Línea

Plataforma web diseñada para optimizar la reserva de citas y la administración operativa en barberías y peluquerías. Este proyecto fue desarrollado como parte de la materia **Sistemas de Información**.

---

## 📌 Descripción del Proyecto

El sistema busca solucionar la problemática de la gestión manual de agendas y la pérdida de clientes por falta de canales digitales de reserva. Permite a los clientes agendar, reprogramar o cancelar citas en tiempo real, mientras que los administradores y barberos pueden gestionar sus horarios, servicios y personal de manera centralizada.

---
---

## 🎨 Diseño de Interfaz

Los diagramas y bocetos (wireframes) de la interfaz del sistema se encuentran en la carpeta [`/docs/design`](./docs/design), organizados de la siguiente manera:

| Archivo | Descripción |
|---|---|
| `Arquitectura.drawio` | Diagrama de arquitectura general del sistema. |
| `Diseño.drawio` | Diagrama de navegación entre pantallas y roles de usuario. |

**Pantallas incluidas en los wireframes:**

- **Listado de citas del día** (vista Administrador) — filtros por fecha/estado, tabla con badges de color según el estado de la cita (Pendiente, Confirmada, Completada, Cancelada) y paginación.
- **Login / Registro** — pantalla de acceso con pestañas para iniciar sesión o registrarse; el rol del usuario (Cliente, Barbero, Admin) se detecta automáticamente al validar credenciales.
- **Reporte visual** — panel de métricas del administrador con indicadores clave (KPIs) resumidos, gráfico de citas por día y ranking de servicios/barberos más solicitados.

Todos los archivos son editables abriéndolos en [draw.io / diagrams.net](https://app.diagrams.net).

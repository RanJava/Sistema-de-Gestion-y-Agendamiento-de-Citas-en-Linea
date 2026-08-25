using BarberLosPeluchitos.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace BarberLosPeluchitos.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Barbero> Barberos => Set<Barbero>();
    public DbSet<HorarioDisponibilidad> HorariosDisponibilidad => Set<HorarioDisponibilidad>();
    public DbSet<Turno> Turnos => Set<Turno>();
    public DbSet<Servicio> Servicios => Set<Servicio>();
    public DbSet<Cita> Citas => Set<Cita>();
    public DbSet<Administrador> Administradores => Set<Administrador>();
    public DbSet<NotificacionLog> NotificacionesLog => Set<NotificacionLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // CLIENTE
        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.ToTable("cliente");
            entity.HasKey(e => e.IdCliente);
            entity.Property(e => e.IdCliente).HasColumnName("id_cliente");
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Telefono).HasColumnName("telefono").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Correo).HasColumnName("correo").HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.Correo).IsUnique();
            entity.Property(e => e.ContrasenaHash).HasColumnName("contrasena_hash").HasMaxLength(255).IsRequired();
            entity.Property(e => e.FechaRegistro).HasColumnName("fecha_registro").HasDefaultValueSql("CURRENT_DATE");
        });

        // BARBERO
        modelBuilder.Entity<Barbero>(entity =>
        {
            entity.ToTable("barbero");
            entity.HasKey(e => e.IdBarbero);
            entity.Property(e => e.IdBarbero).HasColumnName("id_barbero");
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Telefono).HasColumnName("telefono").HasMaxLength(20).IsRequired();
        });

        // HORARIO_DISPONIBILIDAD
        modelBuilder.Entity<HorarioDisponibilidad>(entity =>
        {
            entity.ToTable("horario_disponibilidad");
            entity.HasKey(e => e.IdHorario);
            entity.Property(e => e.IdHorario).HasColumnName("id_horario");
            entity.Property(e => e.IdBarbero).HasColumnName("id_barbero").IsRequired();
            entity.Property(e => e.DiaSemana).HasColumnName("dia_semana").HasMaxLength(10).IsRequired();
            entity.Property(e => e.HoraInicio).HasColumnName("hora_inicio").IsRequired();
            entity.Property(e => e.HoraFin).HasColumnName("hora_fin").IsRequired();

            entity.HasOne(e => e.Barbero)
                .WithMany(b => b.HorariosDisponibilidad)
                .HasForeignKey(e => e.IdBarbero)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TURNO
        modelBuilder.Entity<Turno>(entity =>
        {
            entity.ToTable("turno");
            entity.HasKey(e => e.IdTurno);
            entity.Property(e => e.IdTurno).HasColumnName("id_turno");
            entity.Property(e => e.IdBarbero).HasColumnName("id_barbero").IsRequired();
            entity.Property(e => e.Fecha).HasColumnName("fecha").IsRequired();
            entity.Property(e => e.HoraInicio).HasColumnName("hora_inicio").IsRequired();
            entity.Property(e => e.HoraFin).HasColumnName("hora_fin").IsRequired();
            entity.Property(e => e.Estado).HasColumnName("estado").HasMaxLength(15).HasDefaultValue("Disponible").IsRequired();

            entity.HasOne(e => e.Barbero)
                .WithMany(b => b.Turnos)
                .HasForeignKey(e => e.IdBarbero)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.IdBarbero, e.Fecha, e.HoraInicio }).IsUnique();
            entity.HasIndex(e => new { e.IdBarbero, e.Fecha, e.Estado });
        });

        // SERVICIO
        modelBuilder.Entity<Servicio>(entity =>
        {
            entity.ToTable("servicio");
            entity.HasKey(e => e.IdServicio);
            entity.Property(e => e.IdServicio).HasColumnName("id_servicio");
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(50).IsRequired();
            entity.Property(e => e.DuracionBase).HasColumnName("duracion_base").IsRequired();
            entity.Property(e => e.PrecioBase).HasColumnName("precio_base").HasPrecision(8, 2).IsRequired();
        });

        // CITA
        modelBuilder.Entity<Cita>(entity =>
        {
            entity.ToTable("cita");
            entity.HasKey(e => e.IdCita);
            entity.Property(e => e.IdCita).HasColumnName("id_cita");
            entity.Property(e => e.IdCliente).HasColumnName("id_cliente").IsRequired();
            entity.Property(e => e.IdTurno).HasColumnName("id_turno").IsRequired();
            entity.Property(e => e.IdServicio).HasColumnName("id_servicio").IsRequired();
            entity.Property(e => e.FechaHora).HasColumnName("fecha_hora").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Estado).HasColumnName("estado").HasMaxLength(15).HasDefaultValue("Pendiente").IsRequired();
            entity.Property(e => e.Duracion).HasColumnName("duracion").IsRequired();
            entity.Property(e => e.Precio).HasColumnName("precio").HasPrecision(8, 2).IsRequired();

            entity.HasOne(e => e.Cliente)
                .WithMany(c => c.Citas)
                .HasForeignKey(e => e.IdCliente)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Turno)
                .WithOne(t => t.Cita)
                .HasForeignKey<Cita>(e => e.IdTurno)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Servicio)
                .WithMany(s => s.Citas)
                .HasForeignKey(e => e.IdServicio)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.IdTurno).IsUnique();
            entity.HasIndex(e => new { e.FechaHora, e.Estado });
        });

        // ADMINISTRADOR
        modelBuilder.Entity<Administrador>(entity =>
        {
            entity.ToTable("administrador");
            entity.HasKey(e => e.IdAdministrador);
            entity.Property(e => e.IdAdministrador).HasColumnName("id_administrador");
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Correo).HasColumnName("correo").HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.Correo).IsUnique();
            entity.Property(e => e.ContrasenaHash).HasColumnName("contrasena_hash").HasMaxLength(255).IsRequired();
            entity.Property(e => e.FechaCreacion).HasColumnName("fecha_creacion").HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // NOTIFICACION_LOG
        modelBuilder.Entity<NotificacionLog>(entity =>
        {
            entity.ToTable("notificacion_log");
            entity.HasKey(e => e.IdLog);
            entity.Property(e => e.IdLog).HasColumnName("id_log");
            entity.Property(e => e.IdCita).HasColumnName("id_cita").IsRequired();
            entity.Property(e => e.Destinatario).HasColumnName("destinatario").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Tipo).HasColumnName("tipo").HasMaxLength(30).HasDefaultValue("EmailConfirmacion").IsRequired();
            entity.Property(e => e.Exitoso).HasColumnName("exitoso").IsRequired();
            entity.Property(e => e.Mensaje).HasColumnName("mensaje").HasMaxLength(255).IsRequired();
            entity.Property(e => e.ErrorDetalle).HasColumnName("error_detalle");
            entity.Property(e => e.FechaRegistro).HasColumnName("fecha_registro").HasDefaultValueSql("CURRENT_TIMESTAMP");
        });
    }
}

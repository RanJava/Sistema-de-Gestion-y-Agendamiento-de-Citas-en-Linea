using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BarberLosPeluchitos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "barbero",
                columns: table => new
                {
                    id_barbero = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    telefono = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_barbero", x => x.id_barbero);
                });

            migrationBuilder.CreateTable(
                name: "cliente",
                columns: table => new
                {
                    id_cliente = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    telefono = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    correo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    contrasena_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    fecha_registro = table.Column<DateOnly>(type: "date", nullable: false, defaultValueSql: "CURRENT_DATE")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cliente", x => x.id_cliente);
                });

            migrationBuilder.CreateTable(
                name: "servicio",
                columns: table => new
                {
                    id_servicio = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    duracion_base = table.Column<int>(type: "integer", nullable: false),
                    precio_base = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_servicio", x => x.id_servicio);
                });

            migrationBuilder.CreateTable(
                name: "horario_disponibilidad",
                columns: table => new
                {
                    id_horario = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_barbero = table.Column<int>(type: "integer", nullable: false),
                    dia_semana = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    hora_inicio = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    hora_fin = table.Column<TimeOnly>(type: "time without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_horario_disponibilidad", x => x.id_horario);
                    table.ForeignKey(
                        name: "FK_horario_disponibilidad_barbero_id_barbero",
                        column: x => x.id_barbero,
                        principalTable: "barbero",
                        principalColumn: "id_barbero",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "turno",
                columns: table => new
                {
                    id_turno = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_barbero = table.Column<int>(type: "integer", nullable: false),
                    fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    hora_inicio = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    hora_fin = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    estado = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false, defaultValue: "Disponible")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_turno", x => x.id_turno);
                    table.ForeignKey(
                        name: "FK_turno_barbero_id_barbero",
                        column: x => x.id_barbero,
                        principalTable: "barbero",
                        principalColumn: "id_barbero",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "cita",
                columns: table => new
                {
                    id_cita = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_cliente = table.Column<int>(type: "integer", nullable: false),
                    id_turno = table.Column<int>(type: "integer", nullable: false),
                    id_servicio = table.Column<int>(type: "integer", nullable: false),
                    fecha_hora = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    estado = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false, defaultValue: "Pendiente"),
                    duracion = table.Column<int>(type: "integer", nullable: false),
                    precio = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cita", x => x.id_cita);
                    table.ForeignKey(
                        name: "FK_cita_cliente_id_cliente",
                        column: x => x.id_cliente,
                        principalTable: "cliente",
                        principalColumn: "id_cliente",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cita_servicio_id_servicio",
                        column: x => x.id_servicio,
                        principalTable: "servicio",
                        principalColumn: "id_servicio",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cita_turno_id_turno",
                        column: x => x.id_turno,
                        principalTable: "turno",
                        principalColumn: "id_turno",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_cita_fecha_hora_estado",
                table: "cita",
                columns: new[] { "fecha_hora", "estado" });

            migrationBuilder.CreateIndex(
                name: "IX_cita_id_cliente",
                table: "cita",
                column: "id_cliente");

            migrationBuilder.CreateIndex(
                name: "IX_cita_id_servicio",
                table: "cita",
                column: "id_servicio");

            migrationBuilder.CreateIndex(
                name: "IX_cita_id_turno",
                table: "cita",
                column: "id_turno",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cliente_correo",
                table: "cliente",
                column: "correo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_horario_disponibilidad_id_barbero",
                table: "horario_disponibilidad",
                column: "id_barbero");

            migrationBuilder.CreateIndex(
                name: "IX_turno_id_barbero_fecha_estado",
                table: "turno",
                columns: new[] { "id_barbero", "fecha", "estado" });

            migrationBuilder.CreateIndex(
                name: "IX_turno_id_barbero_fecha_hora_inicio",
                table: "turno",
                columns: new[] { "id_barbero", "fecha", "hora_inicio" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cita");

            migrationBuilder.DropTable(
                name: "horario_disponibilidad");

            migrationBuilder.DropTable(
                name: "cliente");

            migrationBuilder.DropTable(
                name: "servicio");

            migrationBuilder.DropTable(
                name: "turno");

            migrationBuilder.DropTable(
                name: "barbero");
        }
    }
}

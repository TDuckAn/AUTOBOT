using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoWashPro.DAL.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemConfigForMaintenance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SystemConfigs",
                columns: table => new
                {
                    Key = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Value = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemConfigs", x => x.Key);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SystemConfigs");
        }
    }
}

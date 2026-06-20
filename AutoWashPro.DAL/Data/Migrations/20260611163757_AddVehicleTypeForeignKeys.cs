using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoWashPro.DAL.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleTypeForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Add the FK columns as nullable so existing rows can be backfilled before
            //    the NOT NULL constraint is applied.
            migrationBuilder.AddColumn<Guid>(
                name: "VehicleTypeId",
                table: "Vehicles",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VehicleTypeId",
                table: "ServicePricings",
                type: "uniqueidentifier",
                nullable: true);

            // 2. Backfill the new FK from the legacy free-text VehicleType column by matching
            //    on the seeded VehicleTypes.Name. Any row whose text does not match a known
            //    type falls back to the first seeded vehicle type so the column can be made
            //    non-nullable without data loss.
            migrationBuilder.Sql(@"
                UPDATE v
                SET VehicleTypeId = COALESCE(vt.VehicleTypeId,
                    (SELECT TOP 1 VehicleTypeId FROM VehicleTypes ORDER BY CreatedAt, Name))
                FROM Vehicles AS v
                LEFT JOIN VehicleTypes AS vt ON vt.Name = v.VehicleType;");

            migrationBuilder.Sql(@"
                UPDATE sp
                SET VehicleTypeId = COALESCE(vt.VehicleTypeId,
                    (SELECT TOP 1 VehicleTypeId FROM VehicleTypes ORDER BY CreatedAt, Name))
                FROM ServicePricings AS sp
                LEFT JOIN VehicleTypes AS vt ON vt.Name = sp.VehicleType;");

            // 3. Now that every row has a value, enforce NOT NULL.
            migrationBuilder.AlterColumn<Guid>(
                name: "VehicleTypeId",
                table: "Vehicles",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "VehicleTypeId",
                table: "ServicePricings",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            // 4. Drop the legacy free-text columns and the ServiceId-only index that is now
            //    superseded by the composite (ServiceId, VehicleTypeId) unique index.
            migrationBuilder.DropIndex(
                name: "IX_ServicePricings_ServiceId",
                table: "ServicePricings");

            migrationBuilder.DropColumn(
                name: "VehicleType",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "VehicleType",
                table: "ServicePricings");

            // 5. Create indexes and foreign keys.
            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_VehicleTypeId",
                table: "Vehicles",
                column: "VehicleTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_ServicePricings_ServiceId_VehicleTypeId",
                table: "ServicePricings",
                columns: new[] { "ServiceId", "VehicleTypeId" });

            migrationBuilder.CreateIndex(
                name: "IX_ServicePricings_VehicleTypeId",
                table: "ServicePricings",
                column: "VehicleTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_ServicePricings_VehicleTypes_VehicleTypeId",
                table: "ServicePricings",
                column: "VehicleTypeId",
                principalTable: "VehicleTypes",
                principalColumn: "VehicleTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Vehicles_VehicleTypes_VehicleTypeId",
                table: "Vehicles",
                column: "VehicleTypeId",
                principalTable: "VehicleTypes",
                principalColumn: "VehicleTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ServicePricings_VehicleTypes_VehicleTypeId",
                table: "ServicePricings");

            migrationBuilder.DropForeignKey(
                name: "FK_Vehicles_VehicleTypes_VehicleTypeId",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_Vehicles_VehicleTypeId",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_ServicePricings_ServiceId_VehicleTypeId",
                table: "ServicePricings");

            migrationBuilder.DropIndex(
                name: "IX_ServicePricings_VehicleTypeId",
                table: "ServicePricings");

            // Re-create the legacy free-text columns and backfill names from VehicleTypes.
            migrationBuilder.AddColumn<string>(
                name: "VehicleType",
                table: "Vehicles",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VehicleType",
                table: "ServicePricings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE v
                SET VehicleType = vt.Name
                FROM Vehicles AS v
                INNER JOIN VehicleTypes AS vt ON vt.VehicleTypeId = v.VehicleTypeId;");

            migrationBuilder.Sql(@"
                UPDATE sp
                SET VehicleType = vt.Name
                FROM ServicePricings AS sp
                INNER JOIN VehicleTypes AS vt ON vt.VehicleTypeId = sp.VehicleTypeId;");

            migrationBuilder.Sql("UPDATE Vehicles SET VehicleType = '' WHERE VehicleType IS NULL;");
            migrationBuilder.Sql("UPDATE ServicePricings SET VehicleType = '' WHERE VehicleType IS NULL;");

            migrationBuilder.AlterColumn<string>(
                name: "VehicleType",
                table: "Vehicles",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "VehicleType",
                table: "ServicePricings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.DropColumn(
                name: "VehicleTypeId",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "VehicleTypeId",
                table: "ServicePricings");

            migrationBuilder.CreateIndex(
                name: "IX_ServicePricings_ServiceId",
                table: "ServicePricings",
                column: "ServiceId");
        }
    }
}

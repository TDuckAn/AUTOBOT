using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoWashPro.DAL.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PointsLedgers_CustomerId",
                table: "PointsLedgers");

            migrationBuilder.CreateIndex(
                name: "IX_PointsLedgers_CustomerId_Type",
                table: "PointsLedgers",
                columns: new[] { "CustomerId", "Type" });

            migrationBuilder.CreateIndex(
                name: "IX_PointsLedgers_ExpiryDate",
                table: "PointsLedgers",
                column: "ExpiryDate");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_ScheduledAt_Status",
                table: "Bookings",
                columns: new[] { "ScheduledAt", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PointsLedgers_CustomerId_Type",
                table: "PointsLedgers");

            migrationBuilder.DropIndex(
                name: "IX_PointsLedgers_ExpiryDate",
                table: "PointsLedgers");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_ScheduledAt_Status",
                table: "Bookings");

            migrationBuilder.CreateIndex(
                name: "IX_PointsLedgers_CustomerId",
                table: "PointsLedgers",
                column: "CustomerId");
        }
    }
}

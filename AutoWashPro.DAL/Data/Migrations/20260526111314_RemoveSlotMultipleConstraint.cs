using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoWashPro.DAL.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSlotMultipleConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_ServicePricing_DurationMinutes_SlotMultiple",
                table: "ServicePricings");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ServicePricing_DurationMinutes_Positive",
                table: "ServicePricings",
                sql: "[DurationMinutes] > 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_ServicePricing_DurationMinutes_Positive",
                table: "ServicePricings");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ServicePricing_DurationMinutes_SlotMultiple",
                table: "ServicePricings",
                sql: "[DurationMinutes] > 0 AND [DurationMinutes] % 30 = 0");
        }
    }
}

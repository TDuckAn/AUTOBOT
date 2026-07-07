using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoWashPro.DAL.Data.Migrations
{
    /// <inheritdoc />
    public partial class SyncDbReviewVoucherPromotion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsStackable",
                table: "Promotions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "MaxTierId",
                table: "Promotions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalUsageLimit",
                table: "Promotions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UsageLimitPerCustomer",
                table: "Promotions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UsedInBookingId",
                table: "CustomerVouchers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VoucherId",
                table: "Bookings",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PromotionUsages",
                columns: table => new
                {
                    UsageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PromotionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BookingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PromotionUsages", x => x.UsageId);
                    table.ForeignKey(
                        name: "FK_PromotionUsages_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "BookingId");
                    table.ForeignKey(
                        name: "FK_PromotionUsages_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "CustomerId");
                    table.ForeignKey(
                        name: "FK_PromotionUsages_Promotions_PromotionId",
                        column: x => x.PromotionId,
                        principalTable: "Promotions",
                        principalColumn: "PromotionId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Promotions_MaxTierId",
                table: "Promotions",
                column: "MaxTierId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerVouchers_UsedInBookingId",
                table: "CustomerVouchers",
                column: "UsedInBookingId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_VoucherId",
                table: "Bookings",
                column: "VoucherId");

            migrationBuilder.CreateIndex(
                name: "IX_PromotionUsages_BookingId",
                table: "PromotionUsages",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_PromotionUsages_CustomerId",
                table: "PromotionUsages",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_PromotionUsages_PromotionId_CustomerId",
                table: "PromotionUsages",
                columns: new[] { "PromotionId", "CustomerId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_CustomerVouchers_VoucherId",
                table: "Bookings",
                column: "VoucherId",
                principalTable: "CustomerVouchers",
                principalColumn: "VoucherId");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomerVouchers_Bookings_UsedInBookingId",
                table: "CustomerVouchers",
                column: "UsedInBookingId",
                principalTable: "Bookings",
                principalColumn: "BookingId");

            migrationBuilder.AddForeignKey(
                name: "FK_Promotions_TierConfigs_MaxTierId",
                table: "Promotions",
                column: "MaxTierId",
                principalTable: "TierConfigs",
                principalColumn: "TierId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_CustomerVouchers_VoucherId",
                table: "Bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_CustomerVouchers_Bookings_UsedInBookingId",
                table: "CustomerVouchers");

            migrationBuilder.DropForeignKey(
                name: "FK_Promotions_TierConfigs_MaxTierId",
                table: "Promotions");

            migrationBuilder.DropTable(
                name: "PromotionUsages");

            migrationBuilder.DropIndex(
                name: "IX_Promotions_MaxTierId",
                table: "Promotions");

            migrationBuilder.DropIndex(
                name: "IX_CustomerVouchers_UsedInBookingId",
                table: "CustomerVouchers");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_VoucherId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "IsStackable",
                table: "Promotions");

            migrationBuilder.DropColumn(
                name: "MaxTierId",
                table: "Promotions");

            migrationBuilder.DropColumn(
                name: "TotalUsageLimit",
                table: "Promotions");

            migrationBuilder.DropColumn(
                name: "UsageLimitPerCustomer",
                table: "Promotions");

            migrationBuilder.DropColumn(
                name: "UsedInBookingId",
                table: "CustomerVouchers");

            migrationBuilder.DropColumn(
                name: "VoucherId",
                table: "Bookings");
        }
    }
}

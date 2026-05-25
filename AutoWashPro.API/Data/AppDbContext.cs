using AutoWashPro.API.Common;
using AutoWashPro.API.Data.Entities;
using AutoWashPro.API.Data.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    private static readonly Guid MemberTierId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid SilverTierId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid GoldTierId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid PlatinumTierId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly DateTime SeededAt = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<ServicePricing> ServicePricings => Set<ServicePricing>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<PointsLedger> PointsLedgers => Set<PointsLedger>();
    public DbSet<TierConfig> TierConfigs => Set<TierConfig>();
    public DbSet<Promotion> Promotions => Set<Promotion>();
    public DbSet<SystemUser> SystemUsers => Set<SystemUser>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureCustomer(modelBuilder);
        ConfigureVehicle(modelBuilder);
        ConfigureService(modelBuilder);
        ConfigureServicePricing(modelBuilder);
        ConfigureBooking(modelBuilder);
        ConfigurePointsLedger(modelBuilder);
        ConfigureTierConfig(modelBuilder);
        ConfigurePromotion(modelBuilder);
        ConfigureSystemUser(modelBuilder);
        ConfigureNotification(modelBuilder);
        SeedData(modelBuilder);
    }

    private static void ConfigureCustomer(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(customer => customer.CustomerId);
            entity.Property(customer => customer.FullName).HasMaxLength(150).IsRequired();
            entity.Property(customer => customer.PhoneNumber).HasMaxLength(30).IsRequired();
            entity.Property(customer => customer.PasswordHash).HasMaxLength(255).IsRequired();
            entity.Property(customer => customer.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(customer => customer.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasIndex(customer => customer.PhoneNumber).IsUnique();
            entity.HasOne(customer => customer.TierConfig)
                .WithMany(tier => tier.Customers)
                .HasForeignKey(customer => customer.TierId)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }

    private static void ConfigureVehicle(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasKey(vehicle => vehicle.VehicleId);
            entity.Property(vehicle => vehicle.LicensePlate).HasMaxLength(30).IsRequired();
            entity.Property(vehicle => vehicle.VehicleType).HasMaxLength(50).IsRequired();
            entity.Property(vehicle => vehicle.Brand).HasMaxLength(100);
            entity.Property(vehicle => vehicle.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasIndex(vehicle => vehicle.LicensePlate).IsUnique();
            entity.HasOne(vehicle => vehicle.Customer)
                .WithMany(customer => customer.Vehicles)
                .HasForeignKey(vehicle => vehicle.CustomerId)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }

    private static void ConfigureService(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Service>(entity =>
        {
            entity.HasKey(service => service.ServiceId);
            entity.Property(service => service.Name).HasMaxLength(120).IsRequired();
            entity.Property(service => service.Description).HasMaxLength(500);
            entity.Property(service => service.IsActive).HasDefaultValue(true);
            entity.Property(service => service.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        });
    }

    private static void ConfigureServicePricing(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ServicePricing>(entity =>
        {
            entity.HasKey(pricing => pricing.PricingId);
            entity.Property(pricing => pricing.VehicleType).HasMaxLength(50).IsRequired();
            entity.Property(pricing => pricing.Price).HasPrecision(18, 2);
            entity.Property(pricing => pricing.IsActive).HasDefaultValue(true);
            entity.Property(pricing => pricing.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_ServicePricing_DurationMinutes_SlotMultiple",
                "[DurationMinutes] > 0 AND [DurationMinutes] % 30 = 0"));
            entity.HasOne(pricing => pricing.Service)
                .WithMany(service => service.Pricings)
                .HasForeignKey(pricing => pricing.ServiceId)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }

    private static void ConfigureBooking(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(booking => booking.BookingId);
            entity.Property(booking => booking.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(booking => booking.PerksApplied).HasMaxLength(500);
            entity.Property(booking => booking.CancelReason).HasMaxLength(500);
            entity.Property(booking => booking.WalkinPhone).HasMaxLength(30);
            entity.Property(booking => booking.WalkinLicensePlate).HasMaxLength(30);
            entity.Property(booking => booking.BasePrice).HasPrecision(18, 2);
            entity.Property(booking => booking.FinalPrice).HasPrecision(18, 2);
            entity.Property(booking => booking.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_Booking_WalkinContact_WhenNoCustomer",
                "([CustomerId] IS NOT NULL) OR ([WalkinPhone] IS NOT NULL AND [WalkinLicensePlate] IS NOT NULL)"));
            entity.HasOne(booking => booking.Customer)
                .WithMany(customer => customer.Bookings)
                .HasForeignKey(booking => booking.CustomerId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(booking => booking.Vehicle)
                .WithMany()
                .HasForeignKey(booking => booking.VehicleId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(booking => booking.Pricing)
                .WithMany(pricing => pricing.Bookings)
                .HasForeignKey(booking => booking.PricingId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(booking => booking.Promotion)
                .WithMany(promotion => promotion.Bookings)
                .HasForeignKey(booking => booking.PromotionId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(booking => booking.CreatedByUser)
                .WithMany(user => user.CreatedBookings)
                .HasForeignKey(booking => booking.CreatedBy)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }

    private static void ConfigurePointsLedger(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PointsLedger>(entity =>
        {
            entity.HasKey(ledger => ledger.EntryId);
            entity.Property(ledger => ledger.Type).HasConversion<string>().HasMaxLength(30);
            entity.Property(ledger => ledger.Note).HasMaxLength(500);
            entity.Property(ledger => ledger.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(ledger => ledger.NearExpiryNotified).HasDefaultValue(false);
            entity.HasOne(ledger => ledger.Customer)
                .WithMany(customer => customer.LedgerEntries)
                .HasForeignKey(ledger => ledger.CustomerId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(ledger => ledger.Booking)
                .WithMany(booking => booking.LedgerEntries)
                .HasForeignKey(ledger => ledger.BookingId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }

    private static void ConfigureTierConfig(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TierConfig>(entity =>
        {
            entity.HasKey(tier => tier.TierId);
            entity.Property(tier => tier.TierName).HasMaxLength(50).IsRequired();
            entity.Property(tier => tier.MinSpendPerMonth).HasPrecision(18, 2);
            entity.Property(tier => tier.PerksDescription).HasMaxLength(500);
            entity.Property(tier => tier.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasIndex(tier => tier.RankOrder).IsUnique();
            entity.HasIndex(tier => tier.TierName).IsUnique();
        });
    }

    private static void ConfigurePromotion(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Promotion>(entity =>
        {
            entity.HasKey(promotion => promotion.PromotionId);
            entity.Property(promotion => promotion.Name).HasMaxLength(120).IsRequired();
            entity.Property(promotion => promotion.Description).HasMaxLength(500);
            entity.Property(promotion => promotion.RewardType).HasConversion<string>().HasMaxLength(30);
            entity.Property(promotion => promotion.RewardValue).HasPrecision(18, 2);
            entity.Property(promotion => promotion.IsActive).HasDefaultValue(true);
            entity.Property(promotion => promotion.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasOne(promotion => promotion.MinTier)
                .WithMany(tier => tier.Promotions)
                .HasForeignKey(promotion => promotion.MinTierId)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }

    private static void ConfigureSystemUser(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SystemUser>(entity =>
        {
            entity.HasKey(user => user.UserId);
            entity.Property(user => user.FullName).HasMaxLength(150).IsRequired();
            entity.Property(user => user.Email).HasMaxLength(255).IsRequired();
            entity.Property(user => user.PasswordHash).HasMaxLength(255).IsRequired();
            entity.Property(user => user.Role).HasConversion<string>().HasMaxLength(30);
            entity.Property(user => user.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasIndex(user => user.Email).IsUnique();
        });
    }

    private static void ConfigureNotification(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(notification => notification.NotificationId);
            entity.Property(notification => notification.Title).HasMaxLength(150).IsRequired();
            entity.Property(notification => notification.Message).HasMaxLength(1000).IsRequired();
            entity.Property(notification => notification.Type).HasConversion<string>().HasMaxLength(30);
            entity.Property(notification => notification.IsRead).HasDefaultValue(false);
            entity.Property(notification => notification.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasOne(notification => notification.Customer)
                .WithMany(customer => customer.Notifications)
                .HasForeignKey(notification => notification.CustomerId)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TierConfig>().HasData(
            new TierConfig
            {
                TierId = MemberTierId,
                TierName = "Member",
                RankOrder = 1,
                BookingWindowDays = 7,
                MinVisitsPerMonth = 0,
                MinSpendPerMonth = 0m,
                PointsPerWash = 5,
                PerksDescription = "Base membership",
                UpdatedAt = SeededAt
            },
            new TierConfig
            {
                TierId = SilverTierId,
                TierName = "Silver",
                RankOrder = 2,
                BookingWindowDays = 10,
                MinVisitsPerMonth = 3,
                MinSpendPerMonth = 150000m,
                PointsPerWash = 8,
                PerksDescription = "Extended booking window",
                UpdatedAt = SeededAt
            },
            new TierConfig
            {
                TierId = GoldTierId,
                TierName = "Gold",
                RankOrder = 3,
                BookingWindowDays = 12,
                MinVisitsPerMonth = 6,
                MinSpendPerMonth = 300000m,
                PointsPerWash = 12,
                PerksDescription = "Priority booking and improved rewards",
                UpdatedAt = SeededAt
            },
            new TierConfig
            {
                TierId = PlatinumTierId,
                TierName = "Platinum",
                RankOrder = 4,
                BookingWindowDays = 14,
                MinVisitsPerMonth = 10,
                MinSpendPerMonth = 500000m,
                PointsPerWash = 20,
                PerksDescription = "Highest priority and best rewards",
                UpdatedAt = SeededAt
            });

        modelBuilder.Entity<Customer>().HasData(new Customer
        {
            CustomerId = AppConstants.GuestCustomerGuid,
            FullName = "Guest Customer",
            PhoneNumber = "WALK-IN",
            PasswordHash = "REPORTING_PLACEHOLDER",
            TierId = MemberTierId,
            PointsBalance = 0,
            CreatedAt = SeededAt,
            UpdatedAt = SeededAt
        });
    }
}

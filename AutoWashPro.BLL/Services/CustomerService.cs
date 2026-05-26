using AutoWashPro.BLL.Common;
using AutoWashPro.DAL.Data;
using AutoWashPro.DAL.Data.Entities;
using AutoWashPro.BLL.DTOs.Booking;
using AutoWashPro.BLL.DTOs.Customer;
using AutoWashPro.BLL.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.BLL.Services;

public class CustomerService(
    AppDbContext db,
    ILogger<CustomerService> logger) : ICustomerService
{
    private const int MaxPageSize = 100;
    private readonly AppDbContext _db = db;
    private readonly ILogger<CustomerService> _logger = logger;

    public async Task<Result<CustomerProfileDto>> GetProfileAsync(Guid customerId)
    {
        var customer = await _db.Customers
            .AsNoTracking()
            .Include(entity => entity.TierConfig)
            .SingleOrDefaultAsync(entity => entity.CustomerId == customerId);

        return customer is null
            ? Result<CustomerProfileDto>.Fail("Customer was not found.")
            : Result<CustomerProfileDto>.Ok(ToProfileDto(customer));
    }

    public async Task<Result<CustomerProfileDto>> UpdateProfileAsync(Guid customerId, UpdateCustomerProfileDto request)
    {
        var customer = await _db.Customers
            .Include(entity => entity.TierConfig)
            .SingleOrDefaultAsync(entity => entity.CustomerId == customerId);
        if (customer is null)
        {
            return Result<CustomerProfileDto>.Fail("Customer was not found.");
        }

        var phoneNumber = request.PhoneNumber.Trim();
        if (string.Equals(phoneNumber, "WALK-IN", StringComparison.OrdinalIgnoreCase))
        {
            return Result<CustomerProfileDto>.Fail("Phone number is reserved.");
        }

        var phoneExists = await _db.Customers.AnyAsync(entity =>
            entity.CustomerId != customerId && entity.PhoneNumber == phoneNumber);
        if (phoneExists)
        {
            return Result<CustomerProfileDto>.Fail("Phone number is already registered.");
        }

        customer.FullName = request.FullName.Trim();
        customer.PhoneNumber = phoneNumber;
        customer.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Updated customer profile {CustomerId}.", customerId);
        return Result<CustomerProfileDto>.Ok(ToProfileDto(customer));
    }

    public async Task<Result<PagedResultDto<VehicleDto>>> GetVehiclesAsync(Guid customerId, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = _db.Vehicles
            .AsNoTracking()
            .Where(vehicle => vehicle.CustomerId == customerId)
            .OrderBy(vehicle => vehicle.LicensePlate);

        var totalCount = await query.CountAsync();
        var vehicles = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(vehicle => ToVehicleDto(vehicle))
            .ToListAsync();

        return Result<PagedResultDto<VehicleDto>>.Ok(new PagedResultDto<VehicleDto>
        {
            Items = vehicles,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }

    public async Task<Result<VehicleDto>> AddVehicleAsync(Guid customerId, CreateVehicleDto request)
    {
        var customerExists = await _db.Customers.AnyAsync(customer => customer.CustomerId == customerId);
        if (!customerExists)
        {
            return Result<VehicleDto>.Fail("Customer was not found.");
        }

        var licensePlate = request.LicensePlate.Trim().ToUpperInvariant();
        var licenseExists = await _db.Vehicles.AnyAsync(vehicle => vehicle.LicensePlate == licensePlate);
        if (licenseExists)
        {
            return Result<VehicleDto>.Fail("License plate is already registered.");
        }

        var vehicle = new Vehicle
        {
            VehicleId = Guid.NewGuid(),
            CustomerId = customerId,
            LicensePlate = licensePlate,
            VehicleType = request.VehicleType.Trim(),
            Brand = string.IsNullOrWhiteSpace(request.Brand) ? null : request.Brand.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.Vehicles.Add(vehicle);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Added vehicle {VehicleId} for customer {CustomerId}.", vehicle.VehicleId, customerId);
        return Result<VehicleDto>.Ok(ToVehicleDto(vehicle));
    }

    public async Task<Result<bool>> DeleteVehicleAsync(Guid customerId, Guid vehicleId)
    {
        var vehicle = await _db.Vehicles.SingleOrDefaultAsync(entity =>
            entity.VehicleId == vehicleId && entity.CustomerId == customerId);

        if (vehicle is null)
        {
            return Result<bool>.Fail("Vehicle was not found.");
        }

        var hasBookings = await _db.Bookings.AnyAsync(booking => booking.VehicleId == vehicleId);
        if (hasBookings)
        {
            return Result<bool>.Fail("Vehicle with bookings cannot be removed.");
        }

        _db.Vehicles.Remove(vehicle);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Deleted vehicle {VehicleId} for customer {CustomerId}.", vehicleId, customerId);
        return Result<bool>.Ok(true);
    }

    public async Task<Result<PagedResultDto<NotificationDto>>> GetNotificationsAsync(Guid customerId, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = _db.Notifications
            .AsNoTracking()
            .Where(notification => notification.CustomerId == customerId)
            .OrderByDescending(notification => notification.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(notification => NotificationService.ToDto(notification))
            .ToListAsync();

        return Result<PagedResultDto<NotificationDto>>.Ok(new PagedResultDto<NotificationDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }

    private static CustomerProfileDto ToProfileDto(Customer customer)
    {
        return new CustomerProfileDto
        {
            CustomerId = customer.CustomerId,
            FullName = customer.FullName,
            PhoneNumber = customer.PhoneNumber,
            TierId = customer.TierId,
            TierName = customer.TierConfig.TierName,
            PointsBalance = customer.PointsBalance,
            CreatedAt = customer.CreatedAt,
            UpdatedAt = customer.UpdatedAt
        };
    }

    private static VehicleDto ToVehicleDto(Vehicle vehicle)
    {
        return new VehicleDto
        {
            VehicleId = vehicle.VehicleId,
            CustomerId = vehicle.CustomerId,
            LicensePlate = vehicle.LicensePlate,
            VehicleType = vehicle.VehicleType,
            Brand = vehicle.Brand,
            CreatedAt = vehicle.CreatedAt
        };
    }
}

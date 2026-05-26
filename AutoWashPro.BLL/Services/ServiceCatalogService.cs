using AutoWashPro.BLL.Common;
using AutoWashPro.DAL.Data;
using AutoWashPro.BLL.DTOs.Booking;
using AutoWashPro.BLL.DTOs.Service;
using AutoWashPro.BLL.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using ServiceEntity = AutoWashPro.DAL.Data.Entities.Service;
using ServicePricingEntity = AutoWashPro.DAL.Data.Entities.ServicePricing;

namespace AutoWashPro.BLL.Services;

public class ServiceCatalogService(
    AppDbContext db,
    ILogger<ServiceCatalogService> logger) : IServiceCatalogService
{
    private const int MaxPageSize = 100;
    private readonly AppDbContext _db = db;
    private readonly ILogger<ServiceCatalogService> _logger = logger;

    public async Task<Result<PagedResultDto<ServiceDto>>> ListActiveServicesAsync(int page, int pageSize)
    {
        var query = _db.Services
            .AsNoTracking()
            .Where(service => service.IsActive)
            .OrderBy(service => service.Name);

        return Result<PagedResultDto<ServiceDto>>.Ok(await ToPagedResultAsync(query, page, pageSize, ToServiceDto));
    }

    public async Task<Result<PagedResultDto<ServiceDto>>> ListAllServicesAsync(int page, int pageSize)
    {
        var query = _db.Services
            .AsNoTracking()
            .OrderBy(service => service.IsActive ? 0 : 1)
            .ThenBy(service => service.Name);

        return Result<PagedResultDto<ServiceDto>>.Ok(await ToPagedResultAsync(query, page, pageSize, ToServiceDto));
    }

    public async Task<Result<PagedResultDto<ServicePricingDto>>> GetPricingByServiceAsync(Guid serviceId, int page, int pageSize)
    {
        var serviceExists = await _db.Services
            .AsNoTracking()
            .AnyAsync(service => service.ServiceId == serviceId && service.IsActive);

        if (!serviceExists)
        {
            return Result<PagedResultDto<ServicePricingDto>>.Fail("Active service was not found.");
        }

        var query = _db.ServicePricings
            .AsNoTracking()
            .Where(item => item.ServiceId == serviceId && item.IsActive)
            .OrderBy(item => item.VehicleType);

        return Result<PagedResultDto<ServicePricingDto>>.Ok(await ToPagedResultAsync(query, page, pageSize, ToPricingDto));
    }

    public async Task<Result<ServiceDto>> CreateServiceAsync(CreateServiceDto request)
    {
        var name = request.Name.Trim();
        var duplicateExists = await _db.Services.AnyAsync(service => service.Name == name);
        if (duplicateExists)
        {
            return Result<ServiceDto>.Fail("Service name already exists.");
        }

        var service = new ServiceEntity
        {
            ServiceId = Guid.NewGuid(),
            Name = name,
            Description = NormalizeOptionalText(request.Description),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _db.Services.Add(service);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Created service {ServiceId}.", service.ServiceId);
        return Result<ServiceDto>.Ok(ToServiceDto(service));
    }

    public async Task<Result<ServiceDto>> UpdateServiceAsync(Guid serviceId, CreateServiceDto request)
    {
        var service = await _db.Services.SingleOrDefaultAsync(entity => entity.ServiceId == serviceId);
        if (service is null)
        {
            return Result<ServiceDto>.Fail("Service was not found.");
        }

        var name = request.Name.Trim();
        var duplicateExists = await _db.Services.AnyAsync(entity =>
            entity.ServiceId != serviceId && entity.Name == name);
        if (duplicateExists)
        {
            return Result<ServiceDto>.Fail("Service name already exists.");
        }

        service.Name = name;
        service.Description = NormalizeOptionalText(request.Description);
        service.IsActive = request.IsActive;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Updated service {ServiceId}.", service.ServiceId);
        return Result<ServiceDto>.Ok(ToServiceDto(service));
    }

    public async Task<Result<ServicePricingDto>> AddPricingAsync(Guid serviceId, CreatePricingDto request)
    {
        var serviceExists = await _db.Services.AnyAsync(service => service.ServiceId == serviceId);
        if (!serviceExists)
        {
            return Result<ServicePricingDto>.Fail("Service was not found.");
        }

        var validationError = ValidatePricing(request);
        if (validationError is not null)
        {
            return Result<ServicePricingDto>.Fail(validationError);
        }

        var vehicleType = request.VehicleType.Trim();
        var duplicateExists = await _db.ServicePricings.AnyAsync(pricing =>
            pricing.ServiceId == serviceId && pricing.VehicleType == vehicleType);
        if (duplicateExists)
        {
            return Result<ServicePricingDto>.Fail("Pricing for this vehicle type already exists.");
        }

        var pricing = new ServicePricingEntity
        {
            PricingId = Guid.NewGuid(),
            ServiceId = serviceId,
            VehicleType = vehicleType,
            Price = request.Price,
            DurationMinutes = request.DurationMinutes,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _db.ServicePricings.Add(pricing);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Created pricing {PricingId} for service {ServiceId}.", pricing.PricingId, serviceId);
        return Result<ServicePricingDto>.Ok(ToPricingDto(pricing));
    }

    public async Task<Result<ServicePricingDto>> UpdatePricingAsync(Guid serviceId, Guid pricingId, CreatePricingDto request)
    {
        var pricing = await _db.ServicePricings.SingleOrDefaultAsync(entity =>
            entity.ServiceId == serviceId && entity.PricingId == pricingId);
        if (pricing is null)
        {
            return Result<ServicePricingDto>.Fail("Pricing was not found.");
        }

        var validationError = ValidatePricing(request);
        if (validationError is not null)
        {
            return Result<ServicePricingDto>.Fail(validationError);
        }

        var vehicleType = request.VehicleType.Trim();
        var duplicateExists = await _db.ServicePricings.AnyAsync(entity =>
            entity.ServiceId == serviceId
            && entity.PricingId != pricingId
            && entity.VehicleType == vehicleType);
        if (duplicateExists)
        {
            return Result<ServicePricingDto>.Fail("Pricing for this vehicle type already exists.");
        }

        pricing.VehicleType = vehicleType;
        pricing.Price = request.Price;
        pricing.DurationMinutes = request.DurationMinutes;
        pricing.IsActive = request.IsActive;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Updated pricing {PricingId} for service {ServiceId}.", pricingId, serviceId);
        return Result<ServicePricingDto>.Ok(ToPricingDto(pricing));
    }

    private static string? ValidatePricing(CreatePricingDto request)
    {
        return request.Price <= 0 ? "Price must be greater than zero." : null;
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static ServiceDto ToServiceDto(ServiceEntity service)
    {
        return new ServiceDto
        {
            ServiceId = service.ServiceId,
            Name = service.Name,
            Description = service.Description,
            IsActive = service.IsActive,
            CreatedAt = service.CreatedAt
        };
    }

    private static ServicePricingDto ToPricingDto(ServicePricingEntity pricing)
    {
        return new ServicePricingDto
        {
            PricingId = pricing.PricingId,
            ServiceId = pricing.ServiceId,
            VehicleType = pricing.VehicleType,
            Price = pricing.Price,
            DurationMinutes = pricing.DurationMinutes,
            IsActive = pricing.IsActive,
            CreatedAt = pricing.CreatedAt
        };
    }

    private static async Task<PagedResultDto<TDto>> ToPagedResultAsync<TEntity, TDto>(
        IQueryable<TEntity> query,
        int page,
        int pageSize,
        Func<TEntity, TDto> map)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResultDto<TDto>
        {
            Items = items.Select(map).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}

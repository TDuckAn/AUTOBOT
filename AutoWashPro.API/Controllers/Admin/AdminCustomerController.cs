using AutoWashPro.API.Data;
using AutoWashPro.API.DTOs.Admin;
using AutoWashPro.API.DTOs.Booking;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.API.Controllers.Admin;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/customers")]
public class AdminCustomerController(
    AppDbContext db,
    ILogger<AdminCustomerController> logger) : ControllerBase
{
    private const int MaxPageSize = 100;
    private readonly AppDbContext _db = db;
    private readonly ILogger<AdminCustomerController> _logger = logger;

    [HttpGet]
    public async Task<IActionResult> GetCustomers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? tierId = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = _db.Customers
            .AsNoTracking()
            .Include(customer => customer.TierConfig)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim();
            query = query.Where(customer =>
                customer.FullName.Contains(normalizedSearch)
                || customer.PhoneNumber.Contains(normalizedSearch));
        }

        if (tierId.HasValue)
        {
            query = query.Where(customer => customer.TierId == tierId.Value);
        }

        var totalCount = await query.CountAsync();
        var customers = await query
            .OrderBy(customer => customer.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(customer => ToDto(customer))
            .ToListAsync();

        return Ok(new PagedResultDto<AdminCustomerDto>
        {
            Items = customers,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }

    [HttpPut("{id:guid}/tier")]
    public async Task<IActionResult> UpdateCustomerTier(Guid id, UpdateCustomerTierDto request)
    {
        var customer = await _db.Customers
            .Include(entity => entity.TierConfig)
            .SingleOrDefaultAsync(entity => entity.CustomerId == id);

        if (customer is null)
        {
            return NotFound("Customer was not found.");
        }

        var tier = await _db.TierConfigs.SingleOrDefaultAsync(entity => entity.TierId == request.TierId);
        if (tier is null)
        {
            return BadRequest("Tier was not found.");
        }

        customer.TierId = request.TierId;
        customer.TierConfig = tier;
        customer.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Updated customer {CustomerId} to tier {TierId}.", id, request.TierId);
        return Ok(ToDto(customer));
    }

    private static AdminCustomerDto ToDto(Data.Entities.Customer customer)
    {
        return new AdminCustomerDto
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
}

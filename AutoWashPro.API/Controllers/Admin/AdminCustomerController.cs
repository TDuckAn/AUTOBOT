using AutoWashPro.DAL.Data;
using AutoWashPro.DAL.Data.Entities;
using AutoWashPro.BLL.Common.Extensions;
using AutoWashPro.BLL.DTOs.Admin;
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
    private readonly AppDbContext _db = db;
    private readonly ILogger<AdminCustomerController> _logger = logger;

    [HttpGet]
    public async Task<IActionResult> GetCustomers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? tierId = null)
    {
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

        var ordered = query.OrderBy(customer => customer.FullName);
        return Ok(await ordered.ToPagedResultAsync(page, pageSize, ToDto));
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

    private static AdminCustomerDto ToDto(Customer customer)
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

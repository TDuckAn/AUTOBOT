using AutoWashPro.DAL.Data;
using AutoWashPro.DAL.Data.Entities;
using AutoWashPro.BLL.DTOs.Admin;
using AutoWashPro.BLL.DTOs.Booking;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.API.Controllers.Admin;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/tiers")]
public class AdminTierController(
    AppDbContext db,
    ILogger<AdminTierController> logger) : ControllerBase
{
    private readonly AppDbContext _db = db;
    private readonly ILogger<AdminTierController> _logger = logger;

    [HttpGet]
    public async Task<IActionResult> GetTiers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.TierConfigs
            .AsNoTracking()
            .OrderBy(tier => tier.RankOrder);

        var totalCount = await query.CountAsync();
        var tiers = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(tier => ToDto(tier))
            .ToListAsync();

        return Ok(new PagedResultDto<TierConfigDto>
        {
            Items = tiers,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTier(Guid id, TierConfigDto request)
    {
        var tier = await _db.TierConfigs.SingleOrDefaultAsync(entity => entity.TierId == id);
        if (tier is null)
        {
            return NotFound("Tier was not found.");
        }

        var duplicateName = await _db.TierConfigs.AnyAsync(entity =>
            entity.TierId != id && entity.TierName == request.TierName.Trim());
        if (duplicateName)
        {
            return BadRequest("Tier name already exists.");
        }

        var duplicateRank = await _db.TierConfigs.AnyAsync(entity =>
            entity.TierId != id && entity.RankOrder == request.RankOrder);
        if (duplicateRank)
        {
            return BadRequest("Tier rank already exists.");
        }

        tier.TierName = request.TierName.Trim();
        tier.RankOrder = request.RankOrder;
        tier.BookingWindowDays = request.BookingWindowDays;
        tier.MinVisitsPerMonth = request.MinVisitsPerMonth;
        tier.MinSpendPerMonth = request.MinSpendPerMonth;
        tier.PointsPerWash = request.PointsPerWash;
        tier.PerksDescription = string.IsNullOrWhiteSpace(request.PerksDescription) ? null : request.PerksDescription.Trim();
        tier.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Updated tier {TierId}.", id);
        return Ok(ToDto(tier));
    }

    private static TierConfigDto ToDto(TierConfig tier)
    {
        return new TierConfigDto
        {
            TierId = tier.TierId,
            TierName = tier.TierName,
            RankOrder = tier.RankOrder,
            BookingWindowDays = tier.BookingWindowDays,
            MinVisitsPerMonth = tier.MinVisitsPerMonth,
            MinSpendPerMonth = tier.MinSpendPerMonth,
            PointsPerWash = tier.PointsPerWash,
            PerksDescription = tier.PerksDescription,
            UpdatedAt = tier.UpdatedAt
        };
    }
}

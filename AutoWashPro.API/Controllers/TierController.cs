using AutoWashPro.DAL.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.API.Controllers;

[ApiController]
[Route("api/tiers")]
public class TierController(AppDbContext db) : ControllerBase
{
    private readonly AppDbContext _db = db;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetTiers()
    {
        var tiers = await _db.TierConfigs
            .AsNoTracking()
            .OrderBy(t => t.RankOrder)
            .Select(t => new
            {
                t.TierId,
                t.TierName,
                t.RankOrder,
                t.BookingWindowDays,
                t.PointsPerWash,
                t.MinVisitsPerMonth,
                t.MinSpendPerMonth,
                t.PerksDescription,
            })
            .ToListAsync();
        return Ok(tiers);
    }
}

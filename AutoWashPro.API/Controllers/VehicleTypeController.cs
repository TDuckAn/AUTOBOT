using AutoWashPro.API.Caching;
using AutoWashPro.BLL.DTOs.VehicleType;
using AutoWashPro.DAL.Data;
using AutoWashPro.DAL.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.API.Controllers;

[ApiController]
[Route("api/vehicle-types")]
public class VehicleTypeController(AppDbContext db, CatalogCache catalogCache) : ControllerBase
{
    private readonly AppDbContext _db = db;
    private readonly CatalogCache _catalogCache = catalogCache;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List()
    {
        var types = await _catalogCache.GetOrCreateAsync(
            "vehicletypes:active",
            async () => await _db.VehicleTypes
                .AsNoTracking()
                .Where(vt => vt.IsActive)
                .OrderBy(vt => vt.Name)
                .Select(vt => new VehicleTypeDto
                {
                    VehicleTypeId = vt.VehicleTypeId,
                    Name = vt.Name,
                    IsActive = vt.IsActive,
                })
                .ToListAsync());

        return Ok(types);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create(CreateVehicleTypeDto request)
    {
        var name = request.Name.Trim();
        var existing = await _db.VehicleTypes
            .SingleOrDefaultAsync(vt => vt.Name == name);

        if (existing is not null && existing.IsActive)
        {
            return BadRequest("Loại xe này đã tồn tại.");
        }

        if (existing is not null)
        {
            existing.IsActive = true;
            await _db.SaveChangesAsync();
            _catalogCache.Invalidate();

            return Ok(new VehicleTypeDto
            {
                VehicleTypeId = existing.VehicleTypeId,
                Name = existing.Name,
                IsActive = existing.IsActive,
            });
        }

        var vt = new VehicleType
        {
            VehicleTypeId = Guid.NewGuid(),
            Name = name,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        _db.VehicleTypes.Add(vt);
        await _db.SaveChangesAsync();
        _catalogCache.Invalidate();

        return Ok(new VehicleTypeDto
        {
            VehicleTypeId = vt.VehicleTypeId,
            Name = vt.Name,
            IsActive = vt.IsActive,
        });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var vt = await _db.VehicleTypes.FindAsync(id);
        if (vt is null)
        {
            return NotFound();
        }

        var usedByVehicle = await _db.Vehicles.AnyAsync(v => v.VehicleTypeId == id);
        if (usedByVehicle)
        {
            return BadRequest("Không thể xóa loại xe đang được sử dụng bởi khách hàng.");
        }

        var usedByActivePricing = await _db.ServicePricings
            .Include(pricing => pricing.Service)
            .AnyAsync(pricing =>
                pricing.VehicleTypeId == id
                && pricing.IsActive
                && pricing.Service.IsActive);

        if (usedByActivePricing)
        {
            return BadRequest("Không thể xóa loại xe đang được sử dụng bởi bảng giá còn hoạt động.");
        }

        // Keep historical FK references intact while hiding the type from selection lists.
        vt.IsActive = false;
        await _db.SaveChangesAsync();
        _catalogCache.Invalidate();

        return NoContent();
    }
}

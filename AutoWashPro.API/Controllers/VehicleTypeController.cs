using AutoWashPro.BLL.DTOs.VehicleType;
using AutoWashPro.DAL.Data;
using AutoWashPro.DAL.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.API.Controllers;

[ApiController]
[Route("api/vehicle-types")]
public class VehicleTypeController(AppDbContext db) : ControllerBase
{
    private readonly AppDbContext _db = db;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List()
    {
        var types = await _db.VehicleTypes
            .AsNoTracking()
            .Where(vt => vt.IsActive)
            .OrderBy(vt => vt.Name)
            .Select(vt => new VehicleTypeDto
            {
                VehicleTypeId = vt.VehicleTypeId,
                Name = vt.Name,
                IsActive = vt.IsActive,
            })
            .ToListAsync();

        return Ok(types);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create(CreateVehicleTypeDto request)
    {
        var exists = await _db.VehicleTypes.AnyAsync(vt => vt.Name == request.Name.Trim());
        if (exists)
        {
            return BadRequest("Loại xe này đã tồn tại.");
        }

        var vt = new VehicleType
        {
            VehicleTypeId = Guid.NewGuid(),
            Name = request.Name.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        _db.VehicleTypes.Add(vt);
        await _db.SaveChangesAsync();

        return Ok(new VehicleTypeDto { VehicleTypeId = vt.VehicleTypeId, Name = vt.Name, IsActive = vt.IsActive });
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

        _db.VehicleTypes.Remove(vt);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

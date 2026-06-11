using AutoWashPro.API.Caching;
using AutoWashPro.BLL.DTOs.Booking;
using AutoWashPro.BLL.DTOs.Service;
using AutoWashPro.BLL.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AutoWashPro.API.Controllers;

[ApiController]
[Route("api/services")]
public class ServiceController(
    IServiceCatalogService serviceCatalogService,
    CatalogCache catalogCache,
    ILogger<ServiceController> logger) : ControllerBase
{
    private readonly IServiceCatalogService _serviceCatalogService = serviceCatalogService;
    private readonly CatalogCache _catalogCache = catalogCache;
    private readonly ILogger<ServiceController> _logger = logger;

    [HttpGet]
    public async Task<IActionResult> GetServices([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        _logger.LogDebug("Public service catalogue requested.");
        var value = await _catalogCache.GetOrCreateAsync(
            $"services:active:{page}:{pageSize}",
            async () =>
            {
                var result = await _serviceCatalogService.ListActiveServicesAsync(page, pageSize);
                return result.IsSuccess ? result.Value : null;
            });

        if (value is null)
        {
            return BadRequest("Unable to load services.");
        }

        Response.Headers.CacheControl = "public, max-age=30";
        return Ok(value);
    }

    [HttpGet("{id:guid}/pricing")]
    public async Task<IActionResult> GetPricing(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var value = await _catalogCache.GetOrCreateAsync(
            $"pricing:{id}:{page}:{pageSize}",
            async () =>
            {
                var result = await _serviceCatalogService.GetPricingByServiceAsync(id, page, pageSize);
                return result.IsSuccess ? result.Value : null;
            });

        if (value is null)
        {
            return NotFound("Active service was not found.");
        }

        Response.Headers.CacheControl = "public, max-age=30";
        return Ok(value);
    }
}

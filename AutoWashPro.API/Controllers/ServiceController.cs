using AutoWashPro.BLL.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AutoWashPro.API.Controllers;

[ApiController]
[Route("api/services")]
public class ServiceController(
    IServiceCatalogService serviceCatalogService,
    ILogger<ServiceController> logger) : ControllerBase
{
    private readonly IServiceCatalogService _serviceCatalogService = serviceCatalogService;
    private readonly ILogger<ServiceController> _logger = logger;

    [HttpGet]
    public async Task<IActionResult> GetServices([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        _logger.LogDebug("Public service catalogue requested.");
        var result = await _serviceCatalogService.ListActiveServicesAsync(page, pageSize);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("{id:guid}/pricing")]
    public async Task<IActionResult> GetPricing(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _serviceCatalogService.GetPricingByServiceAsync(id, page, pageSize);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }
}

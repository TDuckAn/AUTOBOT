using AutoWashPro.API.DTOs.Service;
using AutoWashPro.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoWashPro.API.Controllers.Admin;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/services")]
public class AdminServiceController(
    IServiceCatalogService serviceCatalogService,
    ILogger<AdminServiceController> logger) : ControllerBase
{
    private readonly IServiceCatalogService _serviceCatalogService = serviceCatalogService;
    private readonly ILogger<AdminServiceController> _logger = logger;

    [HttpPost]
    public async Task<IActionResult> CreateService(CreateServiceDto request)
    {
        var result = await _serviceCatalogService.CreateServiceAsync(request);
        if (!result.IsSuccess)
        {
            return BadRequest(result.Error);
        }

        _logger.LogInformation("Admin created service {ServiceId}.", result.Value!.ServiceId);
        return CreatedAtAction(
            nameof(ServiceController.GetPricing),
            "Service",
            new { id = result.Value.ServiceId },
            result.Value);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateService(Guid id, CreateServiceDto request)
    {
        var result = await _serviceCatalogService.UpdateServiceAsync(id, request);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("{id:guid}/pricing")]
    public async Task<IActionResult> AddPricing(Guid id, CreatePricingDto request)
    {
        var result = await _serviceCatalogService.AddPricingAsync(id, request);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}/pricing/{pricingId:guid}")]
    public async Task<IActionResult> UpdatePricing(Guid id, Guid pricingId, CreatePricingDto request)
    {
        var result = await _serviceCatalogService.UpdatePricingAsync(id, pricingId, request);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}

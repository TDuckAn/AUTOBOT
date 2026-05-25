using AutoWashPro.API.DTOs.Admin;
using AutoWashPro.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoWashPro.API.Controllers.Admin;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/promotions")]
public class AdminPromotionController(
    IPromotionService promotionService,
    ILogger<AdminPromotionController> logger) : ControllerBase
{
    private readonly IPromotionService _promotionService = promotionService;
    private readonly ILogger<AdminPromotionController> _logger = logger;

    [HttpGet]
    public async Task<IActionResult> GetPromotions(
        [FromQuery] bool includeInactive = true,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _promotionService.GetPromotionsAsync(includeInactive, page, pageSize);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPromotion(Guid id)
    {
        var result = await _promotionService.GetPromotionAsync(id);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> CreatePromotion(CreatePromotionDto request)
    {
        var result = await _promotionService.CreatePromotionAsync(request);
        if (!result.IsSuccess)
        {
            return BadRequest(result.Error);
        }

        _logger.LogInformation("Created promotion {PromotionId}.", result.Value!.PromotionId);
        return CreatedAtAction(nameof(GetPromotion), new { id = result.Value.PromotionId }, result.Value);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdatePromotion(Guid id, CreatePromotionDto request)
    {
        var result = await _promotionService.UpdatePromotionAsync(id, request);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeletePromotion(Guid id)
    {
        var result = await _promotionService.DeletePromotionAsync(id);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}

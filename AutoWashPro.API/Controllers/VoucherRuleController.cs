using AutoWashPro.BLL.DTOs.Voucher;
using AutoWashPro.BLL.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoWashPro.API.Controllers;

[ApiController]
[Route("api/voucher-rules")]
public class VoucherRuleController(IVoucherService voucherService) : ControllerBase
{
    private readonly IVoucherService _voucherService = voucherService;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetActive()
    {
        var rules = await _voucherService.GetActiveRulesAsync();
        return Ok(rules);
    }

    [HttpGet("all")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetAll()
    {
        var rules = await _voucherService.GetAllRulesAsync();
        return Ok(rules);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create(CreateVoucherRuleDto dto)
    {
        var result = await _voucherService.CreateRuleAsync(dto);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update(Guid id, CreateVoucherRuleDto dto)
    {
        var result = await _voucherService.UpdateRuleAsync(id, dto);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _voucherService.DeleteRuleAsync(id);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}

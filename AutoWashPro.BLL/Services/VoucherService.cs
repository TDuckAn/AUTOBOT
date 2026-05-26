using AutoWashPro.BLL.Common;
using AutoWashPro.BLL.DTOs.Voucher;
using AutoWashPro.BLL.Services.Interfaces;
using AutoWashPro.DAL.Data;
using AutoWashPro.DAL.Data.Entities;
using AutoWashPro.DAL.Data.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.BLL.Services;

public class VoucherService(AppDbContext db) : IVoucherService
{
    private readonly AppDbContext _db = db;

    public async Task<List<VoucherRedemptionRuleDto>> GetActiveRulesAsync()
    {
        return await _db.VoucherRedemptionRules
            .AsNoTracking()
            .Where(r => r.IsActive)
            .OrderBy(r => r.PointCost)
            .Select(r => ToDto(r))
            .ToListAsync();
    }

    public async Task<List<VoucherRedemptionRuleDto>> GetAllRulesAsync()
    {
        return await _db.VoucherRedemptionRules
            .AsNoTracking()
            .OrderBy(r => r.PointCost)
            .Select(r => ToDto(r))
            .ToListAsync();
    }

    public async Task<Result<VoucherRedemptionRuleDto>> CreateRuleAsync(CreateVoucherRuleDto dto)
    {
        var rule = new VoucherRedemptionRule
        {
            VoucherRuleId = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            PointCost = dto.PointCost,
            DiscountAmount = dto.DiscountAmount,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow,
        };
        _db.VoucherRedemptionRules.Add(rule);
        await _db.SaveChangesAsync();
        return Result<VoucherRedemptionRuleDto>.Ok(ToDto(rule));
    }

    public async Task<Result<VoucherRedemptionRuleDto>> UpdateRuleAsync(Guid id, CreateVoucherRuleDto dto)
    {
        var rule = await _db.VoucherRedemptionRules.SingleOrDefaultAsync(r => r.VoucherRuleId == id);
        if (rule is null) return Result<VoucherRedemptionRuleDto>.Fail("Voucher rule not found.");

        rule.Name = dto.Name.Trim();
        rule.Description = dto.Description?.Trim();
        rule.PointCost = dto.PointCost;
        rule.DiscountAmount = dto.DiscountAmount;
        rule.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Result<VoucherRedemptionRuleDto>.Ok(ToDto(rule));
    }

    public async Task<Result<bool>> DeleteRuleAsync(Guid id)
    {
        var rule = await _db.VoucherRedemptionRules.SingleOrDefaultAsync(r => r.VoucherRuleId == id);
        if (rule is null) return Result<bool>.Fail("Voucher rule not found.");
        _db.VoucherRedemptionRules.Remove(rule);
        await _db.SaveChangesAsync();
        return Result<bool>.Ok(true);
    }

    public async Task<Result<CustomerVoucherDto>> RedeemAsync(Guid customerId, Guid voucherRuleId)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();

        var customer = await _db.Customers
            .SingleOrDefaultAsync(c => c.CustomerId == customerId);
        if (customer is null) return Result<CustomerVoucherDto>.Fail("Customer not found.");

        var rule = await _db.VoucherRedemptionRules
            .AsNoTracking()
            .SingleOrDefaultAsync(r => r.VoucherRuleId == voucherRuleId && r.IsActive);
        if (rule is null) return Result<CustomerVoucherDto>.Fail("Voucher rule not found or inactive.");

        if (customer.PointsBalance < rule.PointCost)
            return Result<CustomerVoucherDto>.Fail($"Không đủ điểm. Cần {rule.PointCost} điểm, bạn có {customer.PointsBalance} điểm.");

        customer.PointsBalance -= rule.PointCost;

        _db.PointsLedgers.Add(new PointsLedger
        {
            EntryId = Guid.NewGuid(),
            CustomerId = customerId,
            Type = LedgerEntryType.Redeem,
            Points = -rule.PointCost,
            ExpiryDate = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(1)),
            Note = $"Đổi voucher: {rule.Name}",
            CreatedAt = DateTime.UtcNow,
        });

        var code = GenerateVoucherCode();
        var voucher = new CustomerVoucher
        {
            VoucherId = Guid.NewGuid(),
            CustomerId = customerId,
            VoucherRuleId = voucherRuleId,
            Code = code,
            DiscountAmount = rule.DiscountAmount,
            RedeemedAt = DateTime.UtcNow,
            IsUsed = false,
        };
        _db.CustomerVouchers.Add(voucher);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Result<CustomerVoucherDto>.Ok(new CustomerVoucherDto
        {
            VoucherId = voucher.VoucherId,
            RuleName = rule.Name,
            Code = code,
            DiscountAmount = rule.DiscountAmount,
            RedeemedAt = voucher.RedeemedAt,
            IsUsed = false,
        });
    }

    public async Task<List<CustomerVoucherDto>> GetCustomerVouchersAsync(Guid customerId)
    {
        return await _db.CustomerVouchers
            .AsNoTracking()
            .Where(v => v.CustomerId == customerId)
            .OrderByDescending(v => v.RedeemedAt)
            .Select(v => new CustomerVoucherDto
            {
                VoucherId = v.VoucherId,
                RuleName = v.VoucherRule.Name,
                Code = v.Code,
                DiscountAmount = v.DiscountAmount,
                RedeemedAt = v.RedeemedAt,
                IsUsed = v.IsUsed,
            })
            .ToListAsync();
    }

    private static VoucherRedemptionRuleDto ToDto(VoucherRedemptionRule r) => new()
    {
        VoucherRuleId = r.VoucherRuleId,
        Name = r.Name,
        Description = r.Description,
        PointCost = r.PointCost,
        DiscountAmount = r.DiscountAmount,
        IsActive = r.IsActive,
        CreatedAt = r.CreatedAt,
    };

    private static string GenerateVoucherCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var random = new Random();
        var code = new char[8];
        for (var i = 0; i < 8; i++) code[i] = chars[random.Next(chars.Length)];
        return "AW-" + new string(code);
    }
}

using AutoWashPro.BLL.Common;
using AutoWashPro.BLL.DTOs.Voucher;

namespace AutoWashPro.BLL.Services.Interfaces;

public interface IVoucherService
{
    Task<List<VoucherRedemptionRuleDto>> GetActiveRulesAsync();
    Task<List<VoucherRedemptionRuleDto>> GetAllRulesAsync();
    Task<Result<VoucherRedemptionRuleDto>> CreateRuleAsync(CreateVoucherRuleDto dto);
    Task<Result<VoucherRedemptionRuleDto>> UpdateRuleAsync(Guid id, CreateVoucherRuleDto dto);
    Task<Result<bool>> DeleteRuleAsync(Guid id);
    Task<Result<CustomerVoucherDto>> RedeemAsync(Guid customerId, Guid voucherRuleId);
    Task<List<CustomerVoucherDto>> GetCustomerVouchersAsync(Guid customerId);
}

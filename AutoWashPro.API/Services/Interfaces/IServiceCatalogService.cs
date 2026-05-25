using AutoWashPro.API.Common;
using AutoWashPro.API.DTOs.Booking;
using AutoWashPro.API.DTOs.Service;

namespace AutoWashPro.API.Services.Interfaces;

public interface IServiceCatalogService
{
    Task<Result<PagedResultDto<ServiceDto>>> ListActiveServicesAsync(int page, int pageSize);
    Task<Result<PagedResultDto<ServicePricingDto>>> GetPricingByServiceAsync(Guid serviceId, int page, int pageSize);
    Task<Result<ServiceDto>> CreateServiceAsync(CreateServiceDto request);
    Task<Result<ServiceDto>> UpdateServiceAsync(Guid serviceId, CreateServiceDto request);
    Task<Result<ServicePricingDto>> AddPricingAsync(Guid serviceId, CreatePricingDto request);
    Task<Result<ServicePricingDto>> UpdatePricingAsync(Guid serviceId, Guid pricingId, CreatePricingDto request);
}

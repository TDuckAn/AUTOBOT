using AutoWashPro.BLL.Common;
using AutoWashPro.BLL.DTOs.Booking;
using AutoWashPro.BLL.DTOs.Customer;

namespace AutoWashPro.BLL.Services.Interfaces;

public interface ICustomerService
{
    Task<Result<CustomerProfileDto>> GetProfileAsync(Guid customerId);
    Task<Result<CustomerProfileDto>> UpdateProfileAsync(Guid customerId, UpdateCustomerProfileDto request);
    Task<Result<PagedResultDto<VehicleDto>>> GetVehiclesAsync(Guid customerId, int page, int pageSize);
    Task<Result<VehicleDto>> AddVehicleAsync(Guid customerId, CreateVehicleDto request);
    Task<Result<bool>> DeleteVehicleAsync(Guid customerId, Guid vehicleId);
    Task<Result<PagedResultDto<NotificationDto>>> GetNotificationsAsync(Guid customerId, int page, int pageSize);
}

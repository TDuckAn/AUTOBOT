using AutoWashPro.BLL.DTOs.Booking;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.BLL.Common.Extensions;

public static class QueryableExtensions
{
    public const int MaxPageSize = 100;

    /// <summary>
    /// Pages an <b>ordered</b> entity query and maps each row to a DTO. Page/pageSize are
    /// clamped, Skip/Take run in SQL (OFFSET/FETCH), then <paramref name="map"/> is applied
    /// in memory — so it works with mapping functions that EF cannot translate to SQL.
    /// </summary>
    public static async Task<PagedResultDto<TResult>> ToPagedResultAsync<TSource, TResult>(
        this IQueryable<TSource> query,
        int page,
        int pageSize,
        Func<TSource, TResult> map,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResultDto<TResult>
        {
            Items = items.Select(map).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}

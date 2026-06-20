using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Primitives;

namespace AutoWashPro.API.Caching;

/// <summary>
/// Process-wide cache for read-heavy, rarely-changing catalogue data
/// (services, pricing, vehicle types, tiers). Every entry shares a single change
/// token, so any catalogue write evicts the whole group via <see cref="Invalidate"/>.
/// This keeps invalidation correct even though entries are keyed per page/pageSize.
/// </summary>
public sealed class CatalogCache(IMemoryCache cache)
{
    private static readonly TimeSpan Ttl = TimeSpan.FromSeconds(60);
    private readonly IMemoryCache _cache = cache;
    private readonly object _gate = new();
    private CancellationTokenSource _resetSource = new();

    public async Task<T?> GetOrCreateAsync<T>(string key, Func<Task<T?>> factory)
        where T : class
    {
        if (_cache.TryGetValue(key, out T? cached) && cached is not null)
        {
            return cached;
        }

        var value = await factory();
        if (value is null)
        {
            // Never cache failures (e.g. not-found lookups).
            return null;
        }

        var options = new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = Ttl };
        lock (_gate)
        {
            // Read the token while holding the lock so _resetSource cannot be swapped
            // underneath us. The current source is never cancelled/disposed (only
            // swapped-out sources are), so reading .Token here cannot throw. If
            // Invalidate() then cancels this source before Set runs, the entry is added
            // with an already-cancelled token and evicted immediately — never stale.
            options.AddExpirationToken(new CancellationChangeToken(_resetSource.Token));
        }

        _cache.Set(key, value, options);
        return value;
    }

    /// <summary>Evicts every cached catalogue entry. Call after any catalogue write.</summary>
    public void Invalidate()
    {
        CancellationTokenSource previous;
        lock (_gate)
        {
            previous = _resetSource;
            _resetSource = new CancellationTokenSource();
        }

        // Cancel (which fires the change token and evicts linked entries) but do NOT
        // Dispose: a concurrent GetOrCreateAsync may still hold this reference, and
        // reading .Token on a disposed CTS throws ObjectDisposedException. A cancelled
        // but undisposed source is reclaimed by GC; invalidations are infrequent.
        previous.Cancel();
    }
}

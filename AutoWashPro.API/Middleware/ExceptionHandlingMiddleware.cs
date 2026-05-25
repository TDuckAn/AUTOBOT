using System.Net;
using Microsoft.AspNetCore.Mvc;

namespace AutoWashPro.API.Middleware;

public class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger)
{
    private readonly RequestDelegate _next = next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger = logger;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception processing {Method} {Path}.", context.Request.Method, context.Request.Path);
            await WriteProblemDetailsAsync(context);
        }
    }

    private static async Task WriteProblemDetailsAsync(HttpContext context)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.Clear();
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        context.Response.ContentType = "application/problem+json";

        var problemDetails = new ProblemDetails
        {
            Status = context.Response.StatusCode,
            Title = "An unexpected error occurred.",
            Type = "https://tools.ietf.org/html/rfc7807",
            Detail = "The request could not be completed."
        };

        await context.Response.WriteAsJsonAsync(problemDetails);
    }
}

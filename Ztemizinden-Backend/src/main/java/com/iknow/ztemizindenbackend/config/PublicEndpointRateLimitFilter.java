package com.iknow.ztemizindenbackend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class PublicEndpointRateLimitFilter extends OncePerRequestFilter {
    private static final Map<String, Limit> LIMITS = Map.of(
            "/api/auth/forgot-password", new Limit(5, Duration.ofHours(1)),
            "/api/customers", new Limit(10, Duration.ofHours(1)),
            "/api/providers", new Limit(10, Duration.ofHours(1))
    );

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final AtomicLong requestCounter = new AtomicLong();
    private final Clock clock;

    public PublicEndpointRateLimitFilter() {
        this(Clock.systemUTC());
    }

    PublicEndpointRateLimitFilter(Clock clock) {
        this.clock = clock;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Limit limit = "POST".equalsIgnoreCase(request.getMethod()) ? LIMITS.get(request.getRequestURI()) : null;
        if (limit == null) {
            filterChain.doFilter(request, response);
            return;
        }

        Instant now = clock.instant();
        String key = request.getRequestURI() + ":" + clientAddress(request);
        Decision decision = consume(key, limit, now);
        if (!decision.allowed()) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.setHeader("Retry-After", Long.toString(decision.retryAfterSeconds()));
            response.getWriter().write("{\"title\":\"Too Many Requests\",\"status\":429,"
                    + "\"detail\":\"Rate limit exceeded. Try again later.\"}");
            return;
        }

        if (requestCounter.incrementAndGet() % 1_000 == 0) {
            windows.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
        }
        filterChain.doFilter(request, response);
    }

    private Decision consume(String key, Limit limit, Instant now) {
        Decision[] result = new Decision[1];
        windows.compute(key, (ignored, current) -> {
            if (current == null || !current.expiresAt().isAfter(now)) {
                Window created = new Window(1, now.plus(limit.window()));
                result[0] = new Decision(true, 0);
                return created;
            }
            if (current.count() >= limit.maxRequests()) {
                long retryAfter = Math.max(1, Duration.between(now, current.expiresAt()).toSeconds());
                result[0] = new Decision(false, retryAfter);
                return current;
            }
            result[0] = new Decision(true, 0);
            return new Window(current.count() + 1, current.expiresAt());
        });
        return result[0];
    }

    private String clientAddress(HttpServletRequest request) {
        String remoteAddress = request.getRemoteAddr();
        return remoteAddress == null || remoteAddress.isBlank() ? "unknown" : remoteAddress;
    }

    private record Limit(int maxRequests, Duration window) {
    }

    private record Window(int count, Instant expiresAt) {
    }

    private record Decision(boolean allowed, long retryAfterSeconds) {
    }
}

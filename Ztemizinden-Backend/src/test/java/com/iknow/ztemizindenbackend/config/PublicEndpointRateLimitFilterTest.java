package com.iknow.ztemizindenbackend.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class PublicEndpointRateLimitFilterTest {

    @Test
    void blocksRegistrationRequestsAfterPerIpLimit() throws Exception {
        PublicEndpointRateLimitFilter filter = new PublicEndpointRateLimitFilter(
                Clock.fixed(Instant.parse("2026-07-12T10:00:00Z"), ZoneOffset.UTC)
        );
        AtomicInteger acceptedRequests = new AtomicInteger();

        for (int requestNumber = 1; requestNumber <= 11; requestNumber++) {
            MockHttpServletRequest request = request("/api/customers", "203.0.113.10");
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(request, response, (ignoredRequest, ignoredResponse) -> acceptedRequests.incrementAndGet());

            if (requestNumber == 11) {
                assertThat(response.getStatus()).isEqualTo(429);
                assertThat(response.getHeader("Retry-After")).isEqualTo("3600");
            }
        }

        assertThat(acceptedRequests).hasValue(10);
    }

    @Test
    void limitsAreIsolatedByClientAddress() throws Exception {
        PublicEndpointRateLimitFilter filter = new PublicEndpointRateLimitFilter(
                Clock.fixed(Instant.parse("2026-07-12T10:00:00Z"), ZoneOffset.UTC)
        );
        AtomicInteger acceptedRequests = new AtomicInteger();

        for (int requestNumber = 0; requestNumber < 10; requestNumber++) {
            filter.doFilter(
                    request("/api/customers", "203.0.113.10"),
                    new MockHttpServletResponse(),
                    (ignoredRequest, ignoredResponse) -> acceptedRequests.incrementAndGet()
            );
        }
        MockHttpServletResponse otherClientResponse = new MockHttpServletResponse();
        filter.doFilter(
                request("/api/customers", "203.0.113.11"),
                otherClientResponse,
                (ignoredRequest, ignoredResponse) -> acceptedRequests.incrementAndGet()
        );

        assertThat(otherClientResponse.getStatus()).isEqualTo(200);
        assertThat(acceptedRequests).hasValue(11);
    }

    @Test
    void usesForwardedClientAddressBehindReverseProxy() throws Exception {
        PublicEndpointRateLimitFilter filter = new PublicEndpointRateLimitFilter(
                Clock.fixed(Instant.parse("2026-07-12T10:00:00Z"), ZoneOffset.UTC)
        );
        AtomicInteger acceptedRequests = new AtomicInteger();

        for (int requestNumber = 0; requestNumber < 10; requestNumber++) {
            MockHttpServletRequest request = request("/api/providers", "127.0.0.1");
            request.addHeader("X-Forwarded-For", "203.0.113.20, 127.0.0.1");
            filter.doFilter(
                    request,
                    new MockHttpServletResponse(),
                    (ignoredRequest, ignoredResponse) -> acceptedRequests.incrementAndGet()
            );
        }

        MockHttpServletRequest otherForwardedClient = request("/api/providers", "127.0.0.1");
        otherForwardedClient.addHeader("X-Forwarded-For", "203.0.113.21, 127.0.0.1");
        MockHttpServletResponse otherForwardedClientResponse = new MockHttpServletResponse();
        filter.doFilter(
                otherForwardedClient,
                otherForwardedClientResponse,
                (ignoredRequest, ignoredResponse) -> acceptedRequests.incrementAndGet()
        );

        assertThat(otherForwardedClientResponse.getStatus()).isEqualTo(200);
        assertThat(acceptedRequests).hasValue(11);
    }

    private MockHttpServletRequest request(String path, String remoteAddress) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setRemoteAddr(remoteAddress);
        return request;
    }
}

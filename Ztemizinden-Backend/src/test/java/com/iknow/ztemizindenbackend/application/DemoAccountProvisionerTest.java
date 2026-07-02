package com.iknow.ztemizindenbackend.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.iknow.ztemizindenbackend.domain.AssetRepository;
import com.iknow.ztemizindenbackend.domain.AuthUserRepository;
import com.iknow.ztemizindenbackend.domain.CustomerRepository;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import com.iknow.ztemizindenbackend.domain.ServiceProvider;
import com.iknow.ztemizindenbackend.domain.ServiceProviderRepository;
import com.iknow.ztemizindenbackend.domain.TicketRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "app.demo-data.reset-and-seed=true",
        "app.demo-data.ensure-demo-accounts=false"
})
class DemoAccountProvisionerTest {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ServiceProviderRepository serviceProviderRepository;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private AuthUserRepository authUserRepository;

    @Test
    void resetAndSeedCreatesPresentationDataset() {
        assertThat(customerRepository.count()).isEqualTo(3);
        assertThat(serviceProviderRepository.count()).isEqualTo(5);
        assertThat(assetRepository.count()).isEqualTo(6);
        assertThat(ticketRepository.count()).isEqualTo(7);
        assertThat(authUserRepository.count()).isEqualTo(9);

        ServiceProvider electricProvider = serviceProviderRepository.findByEmailIgnoreCase("service2@demo.com")
                .orElseThrow();
        assertThat(electricProvider.getSpecialties())
                .containsExactlyInAnyOrder(TicketCategory.ELECTRIC, TicketCategory.SOFTWARE);
        assertThat(electricProvider.getCoverageDistricts())
                .contains("Ataşehir", "Kadıköy", "Maltepe", "Ümraniye");
    }
}

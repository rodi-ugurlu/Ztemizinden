package com.iknow.ztemizindenbackend.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.iknow.ztemizindenbackend.domain.AssetRepository;
import com.iknow.ztemizindenbackend.domain.CustomerRepository;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import com.iknow.ztemizindenbackend.domain.ServiceProvider;
import com.iknow.ztemizindenbackend.domain.ServiceProviderRepository;
import com.iknow.ztemizindenbackend.domain.Ticket;
import com.iknow.ztemizindenbackend.domain.TicketRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

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
    private ProviderService providerService;

    @Autowired
    private TicketService ticketService;

    @Autowired
    private EntityManager entityManager;

    @Test
    @Transactional
    void resetAndSeedCreatesPresentationDataset() {
        assertThat(customerRepository.count()).isEqualTo(3);
        assertThat(serviceProviderRepository.count()).isEqualTo(5);
        assertThat(assetRepository.count()).isEqualTo(6);
        assertThat(ticketRepository.count()).isEqualTo(7);
        ServiceProvider electricProvider = serviceProviderRepository.findByEmailIgnoreCase("service2@demo.com")
                .orElseThrow();
        assertThat(electricProvider.getSpecialties())
                .containsExactlyInAnyOrder(TicketCategory.ELECTRIC, TicketCategory.SOFTWARE);
        assertThat(electricProvider.getCoverageDistricts())
                .contains("Ataşehir", "Kadıköy", "Maltepe", "Ümraniye");

        ServiceProvider providerResponseData = providerService.getByEmail("service2@demo.com");
        assertThat(providerResponseData.getDocuments())
                .describedAs("provider documents must not be multiplied by joined provider collections")
                .hasSize(2)
                .extracting(document -> document.getId())
                .doesNotHaveDuplicates();

        String customerId = customerRepository.findByEmailIgnoreCase("customer@demo.com")
                .orElseThrow()
                .getId();
        Ticket offeredTicket = ticketService.listForCustomer(customerId).stream()
                .filter(ticket -> ticket.getOffers().size() == 2)
                .findFirst()
                .orElseThrow();
        offeredTicket.addCustomerMessage("İkinci müşteri mesajı");
        ticketRepository.saveAndFlush(offeredTicket);
        entityManager.clear();

        Ticket reloadedTicket = ticketService.get(offeredTicket.getId());
        assertThat(reloadedTicket.getOffers())
                .describedAs("ticket offers must not be multiplied by joined ticket collections")
                .hasSize(2)
                .extracting(offer -> offer.getId())
                .doesNotHaveDuplicates();
        assertThat(reloadedTicket.getMessages())
                .extracting(message -> message.getId())
                .doesNotHaveDuplicates();
    }
}

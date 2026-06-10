package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.domain.Customer;
import com.iknow.ztemizindenbackend.domain.CustomerRepository;
import com.iknow.ztemizindenbackend.domain.NotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class CustomerService {
    private final CustomerRepository customerRepository;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<Customer> list() {
        return customerRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Customer getByEmail(String email) {
        return customerRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("Customer not found"));
    }

    @Transactional
    public Customer updateProfileByEmail(String email, UpdateCustomerProfileCommand command) {
        Customer customer = getByEmail(email);
        customer.updateProfile(
                command.contactName(),
                command.companyName(),
                command.phone(),
                command.city(),
                command.district(),
                command.address(),
                command.taxNumber(),
                command.logoUrl()
        );
        return customer;
    }

    @Transactional
    public Customer create(CreateCustomerCommand command) {
        if (customerRepository.existsByEmailIgnoreCase(command.email())) {
            throw new IllegalStateException("Customer email is already registered");
        }

        Customer customer = new Customer(
                required(command.name(), "Customer name is required"),
                required(command.email(), "Customer email is required"),
                required(command.phone(), "Customer phone is required"),
                defaultValue(command.companyName(), command.name()),
                defaultValue(command.city(), "Istanbul"),
                defaultValue(command.district(), "Belirtilmedi")
        );

        Customer savedCustomer = customerRepository.save(customer);
        authService.createCustomerUser(savedCustomer, command.password());
        return savedCustomer;
    }

    private String required(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String defaultValue(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : required(fallback, "Customer profile value is required");
    }

    public record CreateCustomerCommand(
            String name,
            String email,
            String phone,
            String companyName,
            String city,
            String district,
            String password
    ) {
    }

    public record UpdateCustomerProfileCommand(
            String contactName,
            String companyName,
            String phone,
            String city,
            String district,
            String address,
            String taxNumber,
            String logoUrl
    ) {
    }
}

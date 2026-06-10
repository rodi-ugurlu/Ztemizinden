package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.application.CurrentUser;
import com.iknow.ztemizindenbackend.application.CustomerService;
import com.iknow.ztemizindenbackend.application.CustomerService.CreateCustomerCommand;
import com.iknow.ztemizindenbackend.application.CustomerService.UpdateCustomerProfileCommand;
import com.iknow.ztemizindenbackend.domain.BadRequestException;
import com.iknow.ztemizindenbackend.domain.Customer;
import com.iknow.ztemizindenbackend.domain.Enums.CustomerStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/customers")
public class CustomerController {
    private final CustomerService customerService;
    private final CurrentUser currentUser;

    @GetMapping
    public List<CustomerResponse> list() {
        return customerService.list().stream().map(CustomerResponse::from).toList();
    }

    @GetMapping("/me")
    public CustomerResponse me() {
        String email = currentUser.email();
        if (email == null) {
            throw new BadRequestException("Customer email is missing from token");
        }
        return CustomerResponse.from(customerService.getByEmail(email));
    }

    @PutMapping("/me")
    public CustomerResponse updateMe(@Valid @RequestBody UpdateCustomerProfileRequest request) {
        String email = currentUser.email();
        if (email == null) {
            throw new BadRequestException("Customer email is missing from token");
        }
        Customer customer = customerService.updateProfileByEmail(email, new UpdateCustomerProfileCommand(
                request.contactName(),
                request.companyName(),
                request.phone(),
                request.city(),
                request.district(),
                request.address(),
                request.taxNumber(),
                request.logoUrl()
        ));
        return CustomerResponse.from(customer);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerResponse create(@Valid @RequestBody CreateCustomerRequest request) {
        Customer customer = customerService.create(new CreateCustomerCommand(
                request.name(),
                request.email(),
                request.phone(),
                request.companyName(),
                request.city(),
                request.district(),
                request.password()
        ));
        return CustomerResponse.from(customer);
    }

    public record CreateCustomerRequest(
            @NotBlank String name,
            @Email @NotBlank String email,
            @NotBlank String phone,
            String companyName,
            String city,
            String district,
            @NotBlank String password
    ) {
    }

    public record UpdateCustomerProfileRequest(
            @NotBlank String contactName,
            @NotBlank String companyName,
            @NotBlank String phone,
            @NotBlank String city,
            @NotBlank String district,
            String address,
            String taxNumber,
            String logoUrl
    ) {
    }

    public record CustomerResponse(
            String id,
            String name,
            String contactName,
            String email,
            String phone,
            String companyName,
            String city,
            String district,
            String logoUrl,
            String address,
            String taxNumber,
            CustomerStatus status,
            Instant createdAt,
            Instant updatedAt
    ) {
        static CustomerResponse from(Customer customer) {
            return new CustomerResponse(
                    customer.getId(),
                    customer.getName(),
                    customer.getName(),
                    customer.getEmail(),
                    customer.getPhone(),
                    customer.getCompanyName(),
                    customer.getCity(),
                    customer.getDistrict(),
                    customer.getLogoUrl(),
                    customer.getAddress(),
                    customer.getTaxNumber(),
                    customer.getStatus(),
                    customer.getCreatedAt(),
                    customer.getUpdatedAt()
            );
        }
    }
}

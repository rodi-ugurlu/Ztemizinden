package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.domain.Asset;
import com.iknow.ztemizindenbackend.domain.AssetRepository;
import com.iknow.ztemizindenbackend.domain.BadRequestException;
import com.iknow.ztemizindenbackend.domain.Enums.OfferType;
import com.iknow.ztemizindenbackend.domain.Enums.ProviderStatus;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import com.iknow.ztemizindenbackend.domain.Enums.TicketPriority;
import com.iknow.ztemizindenbackend.domain.Enums.TicketStatus;
import com.iknow.ztemizindenbackend.domain.NotFoundException;
import com.iknow.ztemizindenbackend.domain.ServiceProvider;
import com.iknow.ztemizindenbackend.domain.ServiceProviderRepository;
import com.iknow.ztemizindenbackend.domain.Ticket;
import com.iknow.ztemizindenbackend.domain.TicketConversation;
import com.iknow.ztemizindenbackend.domain.TicketMessage;
import com.iknow.ztemizindenbackend.domain.TicketOffer;
import com.iknow.ztemizindenbackend.domain.TicketRepository;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TicketService {
    private final TicketRepository ticketRepository;
    private final AssetRepository assetRepository;
    private final ServiceProviderRepository serviceProviderRepository;

    @Transactional(readOnly = true)
    public List<Ticket> listForCustomer(String customerId) {
        return ticketRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Transactional(readOnly = true)
    public List<Ticket> listOpportunities(String providerId) {
        ServiceProvider provider = requireVerifiedProvider(providerId);
        List<Ticket> tickets = ticketRepository.findByStatusInOrderByCreatedAtAsc(
                List.of(TicketStatus.OPEN, TicketStatus.OFFERED));
        return tickets.stream()
                .filter(ticket -> isQualifiedForTicket(provider, ticket))
                .filter(ticket -> ticket.getOffers().stream()
                        .noneMatch(offer -> offer.getProviderId().equals(providerId)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Ticket> listForProvider(String providerId) {
        requireVerifiedProvider(providerId);
        return ticketRepository.findVisibleForProvider(providerId);
    }

    @Transactional(readOnly = true)
    public Ticket get(String id) {
        return ticketRepository.findById(id).orElseThrow(() -> new NotFoundException("Ticket not found"));
    }

    @Transactional(readOnly = true)
    public Ticket getForProvider(String ticketId, String providerId) {
        Ticket ticket = get(ticketId);
        ServiceProvider provider = requireVerifiedProvider(providerId);
        if (isVisibleForProvider(ticket, provider)) {
            return ticket;
        }
        throw new AccessDeniedException("Ticket is not visible to current provider");
    }

    @Transactional
    public Ticket create(CreateTicketCommand command) {
        Asset asset = assetRepository.findById(command.assetId())
                .orElseThrow(() -> new NotFoundException("Asset not found"));
        if (!asset.getOwnerId().equals(command.customerId())) {
            throw new BadRequestException("Asset does not belong to customer");
        }

        Ticket ticket = new Ticket(
                command.customerId(),
                command.customerName(),
                command.customerCompany(),
                command.customerLocation(),
                command.customerCity(),
                command.customerDistrict(),
                command.customerAddress(),
                asset,
                command.title(),
                command.description(),
                command.category(),
                command.priority(),
                command.mediaUrls()
        );

        return ticketRepository.save(ticket);
    }

    @Transactional
    public TicketOffer addOffer(String ticketId, AddOfferCommand command) {
        Ticket ticket = get(ticketId);
        ServiceProvider provider = serviceProviderRepository.findById(command.providerId())
                .orElseThrow(() -> new NotFoundException("Provider not found"));
        if (provider.getStatus() != ProviderStatus.VERIFIED) {
            throw new IllegalStateException("Provider is not verified");
        }
        requireQualifiedForTicket(provider, ticket);

        return ticket.addOffer(
                provider.getId(),
                provider.getName(),
                command.type(),
                command.estimatedCost(),
                command.eta(),
                command.message()
        );
    }

    @Transactional
    public TicketMutationResult inviteOffer(String ticketId, String offerId) {
        Ticket ticket = get(ticketId);
        List<TicketMessage> previousConversationMessages = conversationMessages(ticket);
        ticket.inviteOffer(offerId);
        return new TicketMutationResult(ticket, newConversationSystemMessages(ticket, previousConversationMessages));
    }

    @Transactional
    public TicketMutationResult acceptOffer(String ticketId, String offerId) {
        Ticket ticket = get(ticketId);
        List<TicketMessage> previousConversationMessages = conversationMessages(ticket);
        ticket.acceptOffer(offerId);
        return new TicketMutationResult(ticket, newConversationSystemMessages(ticket, previousConversationMessages));
    }

    private ServiceProvider requireVerifiedProvider(String providerId) {
        ServiceProvider provider = serviceProviderRepository.findById(providerId)
                .orElseThrow(() -> new NotFoundException("Provider not found"));
        if (provider.getStatus() != ProviderStatus.VERIFIED) {
            throw new IllegalStateException("Provider is not verified");
        }
        return provider;
    }

    private boolean isVisibleForProvider(Ticket ticket, ServiceProvider provider) {
        if (provider.getId().equals(ticket.getAssignedProviderId())) {
            return true;
        }
        if (ticket.getOffers().stream().anyMatch(offer -> offer.getProviderId().equals(provider.getId()))) {
            return true;
        }
        return isOpenOpportunity(ticket) && isQualifiedForTicket(provider, ticket);
    }

    private boolean isOpenOpportunity(Ticket ticket) {
        return ticket.getStatus() == TicketStatus.OPEN || ticket.getStatus() == TicketStatus.OFFERED;
    }

    private void requireQualifiedForTicket(ServiceProvider provider, Ticket ticket) {
        if (!isQualifiedForTicket(provider, ticket)) {
            throw new AccessDeniedException("Provider is not qualified for this ticket category");
        }
    }

    private boolean isQualifiedForTicket(ServiceProvider provider, Ticket ticket) {
        return provider.getSpecialties() != null && provider.getSpecialties().contains(ticket.getCategory());
    }

    @Transactional
    public TicketMutationResult rejectOffer(String ticketId, String offerId) {
        Ticket ticket = get(ticketId);
        List<TicketMessage> previousConversationMessages = conversationMessages(ticket);
        ticket.rejectOffer(offerId);
        return new TicketMutationResult(ticket, newConversationSystemMessages(ticket, previousConversationMessages));
    }

    @Transactional
    public Ticket cancel(String ticketId) {
        Ticket ticket = get(ticketId);
        ticket.cancel();
        return ticket;
    }

    @Transactional
    public Ticket submitFinalBilling(String ticketId, SubmitBillingCommand command) {
        Ticket ticket = get(ticketId);
        ticket.submitFinalBilling(command.actualCost(), command.notes());
        return ticket;
    }

    @Transactional
    public Ticket disputeFinalBilling(String ticketId, DisputeBillingCommand command) {
        Ticket ticket = get(ticketId);
        ticket.disputeFinalBilling(command.reason());
        return ticket;
    }

    @Transactional
    public MessageResult addCustomerMessage(String ticketId, String senderName, String body) {
        Ticket ticket = get(ticketId);
        TicketMessage message = ticket.addCustomerMessage(senderName, body);
        return new MessageResult(ticket, message);
    }

    @Transactional
    public MessageResult addServiceMessage(String ticketId, String senderName, String body) {
        Ticket ticket = get(ticketId);
        TicketMessage message = ticket.addServiceMessage(senderName, body);
        return new MessageResult(ticket, message);
    }

    @Transactional
    public MessageResult addCustomerConversationMessage(
            String ticketId,
            String conversationId,
            String senderName,
            String body
    ) {
        Ticket ticket = get(ticketId);
        TicketMessage message = ticket.addCustomerConversationMessage(conversationId, senderName, body);
        return new MessageResult(ticket, message);
    }

    @Transactional
    public MessageResult addServiceConversationMessage(
            String ticketId,
            String conversationId,
            String providerId,
            String senderName,
            String body
    ) {
        Ticket ticket = get(ticketId);
        TicketConversation conversation = ticket.conversation(conversationId);
        if (providerId != null && !conversation.isForProvider(providerId)) {
            throw new AccessDeniedException("Conversation is not visible to current provider");
        }
        TicketMessage message = ticket.addServiceConversationMessage(conversationId, providerId, senderName, body);
        return new MessageResult(ticket, message);
    }

    @Transactional
    public Ticket markMessagesReadByCustomer(String ticketId) {
        Ticket ticket = get(ticketId);
        ticket.markMessagesReadByCustomer();
        return ticket;
    }

    @Transactional
    public Ticket markMessagesReadByService(String ticketId) {
        Ticket ticket = get(ticketId);
        ticket.markMessagesReadByService();
        return ticket;
    }

    @Transactional
    public Ticket markConversationMessagesReadByCustomer(String ticketId, String conversationId) {
        Ticket ticket = get(ticketId);
        ticket.markConversationMessagesReadByCustomer(conversationId);
        return ticket;
    }

    @Transactional
    public Ticket markConversationMessagesReadByService(String ticketId, String conversationId, String providerId) {
        Ticket ticket = get(ticketId);
        ticket.markConversationMessagesReadByService(conversationId, providerId);
        return ticket;
    }

    @Transactional
    public Ticket approveFinalBilling(String ticketId) {
        Ticket ticket = get(ticketId);
        ticket.approveFinalBilling();
        return ticket;
    }

    private List<TicketMessage> conversationMessages(Ticket ticket) {
        return ticket.getConversations().stream()
                .flatMap(conversation -> conversation.getMessages().stream())
                .toList();
    }

    private List<TicketMessage> newConversationSystemMessages(
            Ticket ticket,
            List<TicketMessage> previousConversationMessages
    ) {
        return ticket.getConversations().stream()
                .flatMap(conversation -> conversation.getMessages().stream())
                .filter(message -> !previousConversationMessages.contains(message))
                .filter(message -> message.getConversation() != null)
                .filter(message -> "system".equals(message.getSenderRole()))
                .toList();
    }

    public record CreateTicketCommand(
            String customerId,
            String customerName,
            String customerCompany,
            String customerLocation,
            String customerCity,
            String customerDistrict,
            String customerAddress,
            String assetId,
            String title,
            String description,
            TicketCategory category,
            TicketPriority priority,
            List<String> mediaUrls
    ) {
    }

    public record AddOfferCommand(
            String providerId,
            String providerName,
            OfferType type,
            BigDecimal estimatedCost,
            String eta,
            String message
    ) {
    }

    public record SubmitBillingCommand(BigDecimal actualCost, String notes) {
    }

    public record DisputeBillingCommand(String reason) {
    }

    public record MessageResult(Ticket ticket, TicketMessage message) {
    }

    public record TicketMutationResult(Ticket ticket, List<TicketMessage> messages) {
    }
}

alter table ticket_conversations
    drop constraint if exists uq_ticket_conversations_provider;

create unique index if not exists uq_ticket_conversations_active_provider
    on ticket_conversations (ticket_id, provider_id)
    where status in ('ACTIVE', 'ACCEPTED');

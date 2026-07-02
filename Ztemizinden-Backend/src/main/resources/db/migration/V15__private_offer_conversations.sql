create table if not exists ticket_conversations (
    id varchar(255) primary key,
    ticket_id varchar(255) not null references tickets(id) on delete cascade,
    offer_id varchar(255) not null references ticket_offers(id) on delete cascade,
    provider_id varchar(255) not null,
    provider_name varchar(255) not null,
    status varchar(50) not null,
    closed_reason varchar(50),
    created_at timestamptz not null,
    updated_at timestamptz not null,
    constraint uq_ticket_conversations_offer unique (offer_id),
    constraint uq_ticket_conversations_provider unique (ticket_id, provider_id)
);

alter table ticket_messages
    add column if not exists conversation_id varchar(255);

do $$
begin
    alter table ticket_messages
        add constraint fk_ticket_messages_conversation
        foreign key (conversation_id) references ticket_conversations(id) on delete cascade;
exception
    when duplicate_object then null;
end $$;

create index if not exists idx_ticket_conversations_ticket on ticket_conversations(ticket_id);
create index if not exists idx_ticket_conversations_provider on ticket_conversations(provider_id);
create index if not exists idx_ticket_messages_conversation on ticket_messages(conversation_id);

insert into ticket_conversations (
    id,
    ticket_id,
    offer_id,
    provider_id,
    provider_name,
    status,
    closed_reason,
    created_at,
    updated_at
)
select
    concat('conversation-', offer.id),
    offer.ticket_id,
    offer.id,
    offer.provider_id,
    offer.provider_name,
    'ACCEPTED',
    null,
    offer.created_at,
    offer.updated_at
from ticket_offers offer
where offer.status = 'ACCEPTED'
on conflict (offer_id) do nothing;

update ticket_messages message
set conversation_id = conversation.id
from ticket_conversations conversation
where message.ticket_id = conversation.ticket_id
  and message.conversation_id is null
  and message.sender_role in ('customer', 'service');

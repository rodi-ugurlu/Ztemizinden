-- Keep the string-id domain model, but enforce that identity references point
-- to real rows. RESTRICT is intentional for operational history; linked
-- customers/providers cannot be removed before their business records.

alter table assets
    add constraint fk_assets_owner
        foreign key (owner_id) references customers(id) on delete restrict not valid;

alter table tickets
    add constraint fk_tickets_customer
        foreign key (customer_id) references customers(id) on delete restrict not valid;

alter table tickets
    add constraint fk_tickets_assigned_provider
        foreign key (assigned_provider_id) references service_providers(id) on delete restrict not valid;

alter table ticket_offers
    add constraint fk_ticket_offers_provider
        foreign key (provider_id) references service_providers(id) on delete restrict not valid;

alter table ticket_conversations
    add constraint fk_ticket_conversations_provider
        foreign key (provider_id) references service_providers(id) on delete restrict not valid;

alter table auth_users
    add constraint fk_auth_users_customer
        foreign key (customer_id) references customers(id) on delete cascade not valid;

alter table auth_users
    add constraint fk_auth_users_provider
        foreign key (provider_id) references service_providers(id) on delete cascade not valid;

alter table assets validate constraint fk_assets_owner;
alter table tickets validate constraint fk_tickets_customer;
alter table tickets validate constraint fk_tickets_assigned_provider;
alter table ticket_offers validate constraint fk_ticket_offers_provider;
alter table ticket_conversations validate constraint fk_ticket_conversations_provider;
alter table auth_users validate constraint fk_auth_users_customer;
alter table auth_users validate constraint fk_auth_users_provider;

create index if not exists idx_tickets_assigned_provider
    on tickets(assigned_provider_id);

create index if not exists idx_ticket_offers_provider
    on ticket_offers(provider_id);

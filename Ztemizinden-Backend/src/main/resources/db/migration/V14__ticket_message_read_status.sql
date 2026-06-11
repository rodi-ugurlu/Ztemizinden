alter table ticket_messages
    add column if not exists read_by_customer boolean not null default false;

alter table ticket_messages
    add column if not exists read_by_service boolean not null default false;

update ticket_messages
set read_by_customer = true
where sender_role in ('customer', 'system');

update ticket_messages
set read_by_service = true
where sender_role in ('service', 'system');

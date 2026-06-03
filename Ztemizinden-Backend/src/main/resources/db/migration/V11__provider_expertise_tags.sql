create table service_provider_expertise_tags (
    provider_id varchar(255) not null references service_providers(id) on delete cascade,
    tag varchar(120) not null,
    primary key (provider_id, tag)
);

create index idx_service_provider_expertise_tags_tag on service_provider_expertise_tags(tag);

insert into service_provider_expertise_tags (provider_id, tag)
select 'sp-001', tag
from (values
    ('vana'),
    ('pompa'),
    ('motor'),
    ('rulman'),
    ('elektrik'),
    ('otomasyon'),
    ('inverter'),
    ('kompresör'),
    ('hidrofor'),
    ('hvac'),
    ('filtre'),
    ('pt100')
) as expertise_tags(tag)
where exists (select 1 from service_providers where id = 'sp-001')
on conflict do nothing;

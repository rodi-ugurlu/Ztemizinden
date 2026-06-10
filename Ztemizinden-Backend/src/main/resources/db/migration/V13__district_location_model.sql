alter table customers
    add column district varchar(255);

update customers
set district = case
    when id = 'cust-001' then 'Kadıköy'
    else 'Belirtilmedi'
end
where district is null;

alter table customers
    alter column district set not null;

alter table service_providers
    add column district varchar(255);

update service_providers
set district = case
    when id = 'sp-001' then 'Kadıköy'
    else 'Belirtilmedi'
end
where district is null;

alter table service_providers
    alter column district set not null;

create table service_provider_coverage_districts (
    provider_id varchar(255) not null,
    district varchar(120) not null,
    primary key (provider_id, district),
    constraint fk_service_provider_coverage_districts_provider
        foreign key (provider_id) references service_providers(id)
);

insert into service_provider_coverage_districts (provider_id, district)
select id, district
from service_providers
where district is not null;

insert into service_provider_coverage_districts (provider_id, district)
select 'sp-001', district
from (
    values
        ('Ataşehir'),
        ('Kadıköy'),
        ('Maltepe'),
        ('Ümraniye'),
        ('Üsküdar')
) as demo_districts(district)
where exists (select 1 from service_providers where id = 'sp-001')
on conflict do nothing;

alter table tickets
    add column customer_city varchar(255),
    add column customer_district varchar(255),
    add column customer_address varchar(500);

update tickets
set
    customer_city = coalesce(nullif(split_part(customer_location, ',', 1), ''), 'Belirtilmedi'),
    customer_district = 'Belirtilmedi',
    customer_address = customer_location
where customer_city is null;

alter table customers
    add column logo_url varchar(1000),
    add column address varchar(500),
    add column tax_number varchar(100);

alter table service_providers
    add column logo_url varchar(1000),
    add column address varchar(500),
    add column tax_number varchar(100);

update customers
set
    address = 'Istanbul, Turkiye',
    tax_number = '1111111111'
where id = 'cust-001'
  and address is null;

update service_providers
set
    address = 'Istanbul, Turkiye',
    tax_number = '2222222222'
where id = 'sp-001'
  and address is null;

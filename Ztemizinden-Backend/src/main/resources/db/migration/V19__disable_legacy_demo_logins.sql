-- Demo identities were historically inserted by V10 with the public password
-- "demo123". Keep the business records for migration compatibility, but remove
-- their login records. Explicit demo provisioning may recreate them in a
-- deliberately configured non-production environment.
delete from auth_users
where lower(email) in (
    'customer@demo.com',
    'customer2@demo.com',
    'customer3@demo.com',
    'service@demo.com',
    'service2@demo.com',
    'service3@demo.com',
    'service4@demo.com',
    'service5@demo.com',
    'admin@demo.com'
);

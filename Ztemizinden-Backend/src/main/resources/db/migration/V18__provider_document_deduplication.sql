alter table provider_documents
    add column content_sha256 varchar(64);

create unique index uq_provider_documents_content
    on provider_documents(provider_id, type, content_sha256)
    where content_sha256 is not null;

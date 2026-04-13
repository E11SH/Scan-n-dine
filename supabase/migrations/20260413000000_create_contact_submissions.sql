-- Create contact_submissions table to store all form submissions
create table if not exists contact_submissions (
  id          uuid        default gen_random_uuid() primary key,
  name        text        not null,
  email       text        not null,
  business    text,
  message     text        not null,
  created_at  timestamptz default now()
);

-- Enable Row Level Security (no public access — only Edge Function via service role can write)
alter table contact_submissions enable row level security;

create table if not exists public.posts (
  slug text primary key,
  title text not null,
  date date not null default current_date,
  description text not null default '',
  tags text[] not null default '{}',
  content_md text not null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;

create trigger posts_set_updated_at
before update on public.posts
for each row
execute function public.set_posts_updated_at();

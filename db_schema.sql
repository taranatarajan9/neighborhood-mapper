-- Schema for Neighborhood Mapper application

-- Enable RLS (Row Level Security)
alter table if exists public.locations enable row level security;

-- Create locations table
create table if not exists public.locations (
  id uuid primary key default uuid_generate_v4(),
  location_id text not null,  -- The location ID based on rounded coordinates
  names jsonb not null,       -- Array of neighborhood names as JSON
  lat numeric not null,       -- Latitude (rounded)
  lng numeric not null,       -- Longitude (rounded)
  exact_lat numeric not null, -- Exact latitude
  exact_lng numeric not null, -- Exact longitude
  count integer default 1,    -- Number of names
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid references auth.users(id) -- If using auth
);

-- Create an index on location_id for faster lookups
create index if not exists locations_location_id_idx on public.locations(location_id);

-- Create index on user_id for faster filtering
create index if not exists locations_user_id_idx on public.locations(user_id);

-- Create table for neighborhood colors
create table if not exists public.neighborhood_colors (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,  -- Neighborhood name (lowercase)
  color text not null,        -- Color in CSS format (HSL)
  created_at timestamp with time zone default now(),
  user_id uuid references auth.users(id) -- If using auth
);

-- Create index on neighborhood name
create index if not exists neighborhood_colors_name_idx on public.neighborhood_colors(name);

-- Enable RLS
alter table if not exists public.neighborhood_colors enable row level security;

-- RLS policies (if using auth)
-- For now we'll allow all operations, but you can restrict this based on user_id if needed
create policy "Allow all operations on locations"
  on public.locations
  for all
  using (true);

create policy "Allow all operations on neighborhood colors"
  on public.neighborhood_colors
  for all
  using (true);

-- Function to update timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update timestamp on locations
create trigger set_updated_at
before update on public.locations
for each row
execute function update_updated_at_column();
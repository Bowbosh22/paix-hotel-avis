-- =====================================================================
-- Hôtel de la Paix — demandes de réservation (à coller UNE FOIS dans Supabase > SQL Editor > Run)
-- Sans danger si relancé : rien n'est supprimé.
-- =====================================================================
create table if not exists public.reservations (
  id            text primary key,
  created_at    timestamptz not null default now(),
  arrivee       date not null,
  depart        date not null,
  personnes     int  not null check (personnes between 1 and 10),
  chambre       text not null check (chambre in ('standard','semi-luxe','semi-grand-luxe','grand-luxe')),
  total_estime  int  check (total_estime is null or total_estime between 0 and 100000000),
  nom           text not null check (char_length(nom) between 1 and 120),
  tel           text not null check (char_length(tel) between 3 and 30),
  email         text check (email is null or char_length(email) <= 120),
  canal         text not null default 'whatsapp' check (canal in ('whatsapp','email')),
  message       text check (message is null or char_length(message) <= 500),
  lang          text not null default 'fr' check (lang in ('fr','en')),
  statut        text not null default 'Nouvelle' check (statut in ('Nouvelle','Confirmée','Refusée','Annulée')),
  historique    jsonb not null default '[]'::jsonb,
  note_interne  text check (note_interne is null or char_length(note_interne) <= 500),
  constraint resa_dates   check (depart > arrivee and depart - arrivee <= 60 and arrivee >= (created_at at time zone 'utc')::date - 1),
  constraint resa_email   check (canal <> 'email' or (email is not null and email like '%_@_%._%'))
);
create index if not exists reservations_created_idx on public.reservations (created_at desc);

alter table public.reservations enable row level security;
revoke all on public.reservations from anon, authenticated;
grant insert on public.reservations to anon, authenticated;                      -- les clients envoient une demande
grant select on public.reservations to authenticated;                            -- le personnel lit
grant update (statut, note_interne, historique) on public.reservations to authenticated;
grant delete on public.reservations to authenticated;                            -- limité à la direction

drop policy if exists "clients: envoyer une demande" on public.reservations;
create policy "clients: envoyer une demande" on public.reservations
  for insert to anon, authenticated
  with check (statut = 'Nouvelle' and historique = '[]'::jsonb and note_interne is null);

drop policy if exists "personnel: lire les demandes" on public.reservations;
create policy "personnel: lire les demandes" on public.reservations
  for select to authenticated
  using (exists (select 1 from public.staff s where s.user_id = auth.uid()));

drop policy if exists "personnel: traiter les demandes" on public.reservations;
create policy "personnel: traiter les demandes" on public.reservations
  for update to authenticated
  using      (exists (select 1 from public.staff s where s.user_id = auth.uid()))
  with check (exists (select 1 from public.staff s where s.user_id = auth.uid()));

drop policy if exists "direction: supprimer les demandes" on public.reservations;
create policy "direction: supprimer les demandes" on public.reservations
  for delete to authenticated
  using (exists (select 1 from public.staff s where s.user_id = auth.uid() and s.role = 'direction'));

-- Protection contre les abus : pas plus de 10 demandes par minute
create or replace function public.limit_reservations() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.reservations where created_at > now() - interval '1 minute') >= 10 then
    raise exception 'Trop de demandes, réessayez dans une minute.';
  end if;
  return new;
end $$;
drop trigger if exists trg_limit_reservations on public.reservations;
create trigger trg_limit_reservations before insert on public.reservations
  for each row execute function public.limit_reservations();

-- =====================================================================
-- Hôtel de la Paix — abonnés à la newsletter (à coller UNE FOIS dans Supabase > SQL Editor > Run)
-- Sans danger si relancé : rien n'est supprimé.
-- =====================================================================
create table if not exists public.abonnes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  nom         text not null check (char_length(nom) between 1 and 120),
  email       text not null check (char_length(email) <= 160 and email like '%_@_%._%'),
  consentement boolean not null check (consentement = true),
  source      text not null default 'site' check (char_length(source) <= 40)
);
-- une adresse = une inscription (insensible à la casse)
create unique index if not exists abonnes_email_uniq on public.abonnes (lower(email));
create index if not exists abonnes_created_idx on public.abonnes (created_at desc);

alter table public.abonnes enable row level security;
revoke all on public.abonnes from anon, authenticated;
grant insert on public.abonnes to anon, authenticated;     -- les visiteurs s'inscrivent
grant select on public.abonnes to authenticated;           -- le personnel lit
grant delete on public.abonnes to authenticated;           -- limité à la direction

drop policy if exists "visiteurs: s'inscrire" on public.abonnes;
create policy "visiteurs: s'inscrire" on public.abonnes
  for insert to anon, authenticated
  with check (consentement = true);

drop policy if exists "personnel: lire les abonnés" on public.abonnes;
create policy "personnel: lire les abonnés" on public.abonnes
  for select to authenticated
  using (exists (select 1 from public.staff s where s.user_id = auth.uid()));

drop policy if exists "direction: supprimer les abonnés" on public.abonnes;
create policy "direction: supprimer les abonnés" on public.abonnes
  for delete to authenticated
  using (exists (select 1 from public.staff s where s.user_id = auth.uid() and s.role = 'direction'));

-- Protection contre les abus : pas plus de 20 inscriptions par minute
create or replace function public.limit_abonnes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.abonnes where created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Trop d''inscriptions, réessayez dans une minute.';
  end if;
  return new;
end $$;
drop trigger if exists trg_limit_abonnes on public.abonnes;
create trigger trg_limit_abonnes before insert on public.abonnes
  for each row execute function public.limit_abonnes();

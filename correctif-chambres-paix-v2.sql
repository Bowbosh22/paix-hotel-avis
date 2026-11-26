-- Hôtel de la Paix : nouveaux types de chambres (standard, excellence, twin, f3)
alter table public.reservations drop constraint if exists reservations_chambre_check;
update public.reservations set chambre='excellence' where chambre='familiale';
update public.reservations set chambre='twin'       where chambre='suite';
update public.reservations set chambre='f3'         where chambre='suite-nuptiale';
alter table public.reservations add constraint reservations_chambre_check
  check (chambre in ('standard','excellence','twin','f3'));

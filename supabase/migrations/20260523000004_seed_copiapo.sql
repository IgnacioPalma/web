insert into public.comunas (cut, nombre, region)
values ('03101', 'Copiapó', 'Atacama')
on conflict (cut) do nothing;

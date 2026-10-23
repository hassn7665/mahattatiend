-- ============================================================
-- محطاتي — سكربت قاعدة البيانات (Supabase / PostgreSQL)
-- الصقه كاملاً في: Supabase > SQL Editor > New query > Run
-- ============================================================
create extension if not exists pgcrypto with schema extensions;

-- 1) الجداول -------------------------------------------------
create table public.stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  governorate text not null,
  area text,
  address text,
  phones text,
  map_url text,
  lat double precision,
  lng double precision,
  hours_from text not null default '06:00',
  hours_to   text not null default '22:00',
  manual_status text check (manual_status in ('open','closed')),
  fuel   jsonb not null default '{"b89":false,"b95":false,"b98":false,"d":false,"m":false}',
  prices jsonb not null default '{}',
  prices_updated_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role text not null default 'owner' check (role in ('admin','owner')),
  station_id uuid references public.stations(id) on delete set null,
  must_reset boolean not null default true,
  failed_attempts int not null default 0,
  reset_code text,
  reset_code_expires timestamptz,
  code_tries int not null default 0,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  updated_at timestamptz not null default now()
);

-- 2) دوال مساعدة ----------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin') $$;

create or replace function public.my_station() returns uuid
language sql stable security definer set search_path = public as $$
  select station_id from profiles where id = auth.uid() $$;

-- يمنع صاحب المحطة من تغيير اسم المحطة أو محافظتها، ويحدّث وقت التعديل
create or replace function public.guard_station() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and (new.name <> old.name or new.governorate <> old.governorate) then
    raise exception 'غير مسموح بتغيير اسم المحطة أو محافظتها';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger trg_guard_station before update on public.stations
  for each row execute function public.guard_station();

create or replace function public.touch_service() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
create trigger trg_touch_service before update on public.services
  for each row execute function public.touch_service();

-- 3) صلاحيات الصفوف (RLS) --------------------------------------
alter table public.stations enable row level security;
alter table public.profiles enable row level security;
alter table public.services enable row level security;

-- القراءة متاحة للجميع بلا تسجيل دخول
create policy "stations_read" on public.stations for select using (true);
create policy "services_read" on public.services for select using (true);
-- المدير يضيف ويحذف المحطات، والمدير أو صاحبها يعدّلها
create policy "stations_admin_ins" on public.stations for insert with check (is_admin());
create policy "stations_admin_del" on public.stations for delete using (is_admin());
create policy "stations_update" on public.stations for update
  using (is_admin() or id = my_station()) with check (is_admin() or id = my_station());
-- الخدمات: المدير أو صاحب المحطة فقط
create policy "services_write" on public.services for all
  using (is_admin() or station_id = my_station())
  with check (is_admin() or station_id = my_station());
-- الحسابات: كل مستخدم يرى حسابه، والمدير يرى ويضيف الجميع
create policy "profiles_read" on public.profiles for select using (id = auth.uid() or is_admin());
create policy "profiles_admin_ins" on public.profiles for insert with check (is_admin());

-- 4) دوال الدخول وإعادة التعيين -------------------------------
-- هل الحساب موقوف (5 محاولات خاطئة)؟
create or replace function public.login_locked(p_username text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select failed_attempts >= 5 from profiles where username = lower(p_username)), false) $$;

create or replace function public.login_failed(p_username text) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update profiles set failed_attempts = failed_attempts + 1
   where username = lower(p_username) returning failed_attempts into n;
  return coalesce(n, 0);
end $$;

create or replace function public.login_ok() returns void
language sql security definer set search_path = public as $$
  update profiles set failed_attempts = 0 where id = auth.uid() $$;

create or replace function public.done_reset() returns void
language sql security definer set search_path = public as $$
  update profiles set must_reset = false where id = auth.uid() $$;

-- المدير يولّد كوداً من 6 أرقام صالحاً 24 ساعة
create or replace function public.admin_make_code(p_username text) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not is_admin() then raise exception 'للمدير فقط'; end if;
  c := lpad((floor(random() * 1000000))::int::text, 6, '0');
  update profiles set reset_code = c, reset_code_expires = now() + interval '24 hours', code_tries = 0
   where username = lower(p_username);
  return c;
end $$;

-- صاحب المحطة يعيد تعيين كلمة المرور بالكود (5 محاولات خاطئة ثم يبطل الكود)
create or replace function public.reset_with_code(p_username text, p_code text, p_new_password text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare p profiles%rowtype;
begin
  if length(p_new_password) < 6 then raise exception 'كلمة المرور قصيرة'; end if;
  select * into p from profiles where username = lower(p_username);
  if not found or p.reset_code is null or p.reset_code_expires < now() or p.code_tries >= 5 then return false; end if;
  if p.reset_code <> p_code then
    update profiles set code_tries = code_tries + 1 where id = p.id;
    return false;
  end if;
  update auth.users set encrypted_password = crypt(p_new_password, gen_salt('bf')) where id = p.id;
  update profiles set reset_code = null, reset_code_expires = null, code_tries = 0,
         failed_attempts = 0, must_reset = false where id = p.id;
  return true;
end $$;

-- حذف حساب صاحب محطة (للمدير فقط)
create or replace function public.admin_delete_owner(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'للمدير فقط'; end if;
  delete from auth.users where id = p_id and id <> auth.uid();
end $$;

-- 5) صور الخدمات ----------------------------------------------
insert into storage.buckets (id, name, public) values ('service-images', 'service-images', true)
on conflict (id) do nothing;
create policy "img_read" on storage.objects for select using (bucket_id = 'service-images');
create policy "img_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'service-images' and (is_admin() or (storage.foldername(name))[1] = my_station()::text));
create policy "img_update" on storage.objects for update to authenticated
  using (bucket_id = 'service-images' and (is_admin() or (storage.foldername(name))[1] = my_station()::text));
create policy "img_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'service-images' and (is_admin() or (storage.foldername(name))[1] = my_station()::text));

-- 6) التحديث اللحظي --------------------------------------------
alter publication supabase_realtime add table public.stations, public.services;

-- ============================================================
-- بعد إنشاء حساب المدير من Authentication > Users (Add user)،
-- شغّل هذا السطر مرة واحدة بعد تعديل البريد ليطابق بريدك:
--
-- insert into public.profiles (id, username, role, must_reset)
-- select id, 'oil', 'admin', false from auth.users where email = 'oil@mahattati.app';
-- ============================================================

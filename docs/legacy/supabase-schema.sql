-- =====================================================================
--  schema.sql — Database di Hub Studenti (PostgreSQL, pensato per Supabase)
--
--  COME USARLO
--  1. Crea un progetto su supabase.com (scegli una regione europea).
--  2. Menu "SQL Editor" -> "New query" -> incolla TUTTO questo file -> "Run".
--  3. Per rendere admin un rappresentante (dopo che si è registrato):
--       update public.profili set ruolo = 'admin' where id = '<id-utente>';
--     (l'id si vede in Authentication -> Users)
--
--  LE RIGHE CHE INIZIANO CON "--" SONO COMMENTI.
--
--  IDEE DI SICUREZZA USATE QUI
--  - RLS (Row Level Security): ogni tabella ha regole su chi può leggere/scrivere.
--    Il sito usa la chiave pubblica, quindi sono QUESTE regole a proteggere i dati.
--  - Un voto per persona: le tabelle dei voti hanno chiave (contenuto, utente).
--  - Il ruolo "admin" non si può assegnare da soli: solo da qui (SQL Editor).
--  - Registrazione limitata al dominio scolastico direttamente nel database.
--  - I conteggi (voti, partecipanti…) si leggono dalle "viste" che finiscono con _v.
-- =====================================================================


-- ---------------------------------------------------------------------
-- IMPOSTAZIONI
-- ---------------------------------------------------------------------
create table public.impostazioni (
    chiave text primary key,
    valore text not null
);

insert into public.impostazioni (chiave, valore) values
    ('soglia_idee', '30'),                            -- sostegni per portare un'idea in assemblea
    ('commissione_percentuale', '2'),                 -- % sui libri a pagamento (0 = nessuna)
    ('dominio_email', '@istitutovalleseriana.edu.it'); -- email ammesse alla registrazione

-- Per cambiare un valore:  update public.impostazioni set valore = '40' where chiave = 'soglia_idee';


-- ---------------------------------------------------------------------
-- 1. PROFILI (uno per ogni utente registrato)
--    L'email e la password stanno nel sistema di accesso di Supabase (auth.users).
-- ---------------------------------------------------------------------
create table public.profili (
    id        uuid primary key references auth.users (id) on delete cascade,
    nome      text not null check (char_length(nome) between 1 and 60),
    cognome   text not null default '' check (char_length(cognome) <= 60),
    classe    text check (char_length(classe) <= 6),
    ruolo     text not null default 'studente' check (ruolo in ('studente', 'admin')),
    creato_il timestamptz not null default now()
);

-- Solo il database può dare il ruolo admin: il sito non può modificare la colonna "ruolo"
-- (vedi i permessi a fine file).

-- Funzione: l'utente attuale è admin?
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
    select exists (select 1 from public.profili where id = (select auth.uid()) and ruolo = 'admin');
$$;

-- Funzione: nome da mostrare agli altri ("Mario R."): il cognome completo resta privato
create function public.nome_breve(p_id uuid) returns text
language sql stable security definer set search_path = public as $$
    select p.nome || coalesce(' ' || nullif(left(p.cognome, 1), '') || '.', '')
    from public.profili p where p.id = p_id;
$$;

-- Alla registrazione: controlla il dominio dell'email...
create function public.controlla_dominio_email() returns trigger
language plpgsql security definer set search_path = public as $$
declare dominio text;
begin
    select valore into dominio from public.impostazioni where chiave = 'dominio_email';
    if dominio is not null and right(lower(coalesce(new.email, '')), length(dominio)) <> lower(dominio) then
        raise exception 'Registrazione consentita solo con email %', dominio;
    end if;
    return new;
end $$;

create trigger controlla_dominio before insert on auth.users
    for each row execute function public.controlla_dominio_email();

-- ...e crea automaticamente il profilo con i dati inseriti nel modulo
-- (il ruolo è SEMPRE "studente", qualunque cosa arrivi dal sito)
create function public.crea_profilo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    insert into public.profili (id, nome, cognome, classe)
    values (new.id,
            left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), 'Studente'), 60),
            left(coalesce(trim(new.raw_user_meta_data ->> 'cognome'), ''), 60),
            left(nullif(trim(new.raw_user_meta_data ->> 'classe'), ''), 6));
    return new;
end $$;

create trigger nuovo_utente after insert on auth.users
    for each row execute function public.crea_profilo();


-- ---------------------------------------------------------------------
-- 2. COMUNICAZIONI DEI RAPPRESENTANTI e EVENTI
-- ---------------------------------------------------------------------
create table public.comunicazioni (
    id        uuid primary key default gen_random_uuid(),
    titolo    text not null check (char_length(titolo) between 1 and 120),
    testo     text not null default '' check (char_length(testo) <= 600),
    autore_id uuid not null default auth.uid() references public.profili (id),
    creato_il timestamptz not null default now()
);

create table public.eventi (
    id          uuid primary key default gen_random_uuid(),
    titolo      text not null check (char_length(titolo) between 1 and 120),
    descrizione text not null default '' check (char_length(descrizione) <= 600),
    luogo       text not null default '' check (char_length(luogo) <= 80),
    categoria   text not null default 'Scuola' check (categoria in ('Scuola', 'Sport', 'Studio', 'Cultura')),
    inizio      timestamptz not null,
    autore_id   uuid not null default auth.uid() references public.profili (id),
    creato_il   timestamptz not null default now()
);

create table public.partecipazioni (
    evento_id uuid not null references public.eventi (id) on delete cascade,
    utente_id uuid not null default auth.uid() references public.profili (id) on delete cascade,
    creato_il timestamptz not null default now(),
    primary key (evento_id, utente_id)        -- una sola iscrizione per persona
);


-- ---------------------------------------------------------------------
-- 3. IDEE PER L'ISTITUTO (con voti e soglia per l'assemblea)
-- ---------------------------------------------------------------------
create table public.idee (
    id          uuid primary key default gen_random_uuid(),
    titolo      text not null check (char_length(titolo) between 1 and 80),
    descrizione text not null default '' check (char_length(descrizione) <= 400),
    stato       text not null default 'aperta' check (stato in ('aperta', 'esposta')),  -- "esposta" = portata in assemblea
    autore_id   uuid not null default auth.uid() references public.profili (id) on delete cascade,
    creato_il   timestamptz not null default now()
);

create table public.voti_idee (
    idea_id   uuid not null references public.idee (id) on delete cascade,
    utente_id uuid not null default auth.uid() references public.profili (id) on delete cascade,
    creato_il timestamptz not null default now(),
    primary key (idea_id, utente_id)          -- un solo sostegno per persona
);


-- ---------------------------------------------------------------------
-- 4. SONDAGGI (domanda + opzioni + voti; si può cambiare voto)
-- ---------------------------------------------------------------------
create table public.sondaggi (
    id        uuid primary key default gen_random_uuid(),
    domanda   text not null check (char_length(domanda) between 1 and 120),
    autore_id uuid not null default auth.uid() references public.profili (id) on delete cascade,
    creato_il timestamptz not null default now()
);

create table public.sondaggi_opzioni (
    id          uuid primary key default gen_random_uuid(),
    sondaggio_id uuid not null references public.sondaggi (id) on delete cascade,
    testo       text not null check (char_length(testo) between 1 and 60),
    posizione   smallint not null default 0,
    unique (id, sondaggio_id)                 -- serve al vincolo qui sotto
);

create table public.sondaggi_voti (
    sondaggio_id uuid not null references public.sondaggi (id) on delete cascade,
    utente_id    uuid not null default auth.uid() references public.profili (id) on delete cascade,
    opzione_id   uuid not null,
    creato_il    timestamptz not null default now(),
    primary key (sondaggio_id, utente_id),    -- un voto per sondaggio (per cambiarlo si aggiorna la riga)
    -- l'opzione votata deve appartenere proprio a quel sondaggio
    foreign key (opzione_id, sondaggio_id) references public.sondaggi_opzioni (id, sondaggio_id) on delete cascade
);

-- Creazione in un colpo solo: domanda + da 2 a 5 opzioni.
-- Dal sito:  supabase.rpc('crea_sondaggio', { p_domanda: '...', p_opzioni: ['A', 'B'] })
create function public.crea_sondaggio(p_domanda text, p_opzioni text[]) returns uuid
language plpgsql as $$
declare
    v_id uuid;
    v_op text[];
begin
    select array_agg(trim(o) order by n) into v_op
    from unnest(p_opzioni) with ordinality as t(o, n) where trim(o) <> '';

    if trim(coalesce(p_domanda, '')) = '' then
        raise exception 'Serve una domanda';
    end if;
    if coalesce(array_length(v_op, 1), 0) < 2 or array_length(v_op, 1) > 5 then
        raise exception 'Servono da 2 a 5 opzioni';
    end if;

    insert into public.sondaggi (domanda) values (trim(p_domanda)) returning id into v_id;
    insert into public.sondaggi_opzioni (sondaggio_id, testo, posizione)
    select v_id, o, n from unnest(v_op) with ordinality as t(o, n);
    return v_id;
end $$;


-- ---------------------------------------------------------------------
-- 5. APPUNTI (foto + spiegazione, voti su/giù e commenti)
--    La foto sta nello "Storage" (bucket "appunti"); qui si salva solo il suo percorso.
-- ---------------------------------------------------------------------
create table public.appunti (
    id             uuid primary key default gen_random_uuid(),
    titolo         text not null check (char_length(titolo) between 1 and 80),
    materia        text not null check (materia in ('Matematica','Italiano','Inglese','Scienze','Storia','Informatica','Altro')),
    testo          text not null check (char_length(testo) between 1 and 600),
    immagine_path  text not null,             -- es. "<id-utente>/<nome-file>.jpg"
    autore_id      uuid not null default auth.uid() references public.profili (id) on delete cascade,
    creato_il      timestamptz not null default now()
);

create table public.appunti_voti (
    appunto_id uuid not null references public.appunti (id) on delete cascade,
    utente_id  uuid not null default auth.uid() references public.profili (id) on delete cascade,
    valore     smallint not null check (valore in (1, -1)),   -- 1 = su, -1 = giù
    primary key (appunto_id, utente_id)
);

create table public.commenti_appunti (
    id         uuid primary key default gen_random_uuid(),
    appunto_id uuid not null references public.appunti (id) on delete cascade,
    autore_id  uuid not null default auth.uid() references public.profili (id) on delete cascade,
    testo      text not null check (char_length(testo) between 1 and 300),
    creato_il  timestamptz not null default now()
);
create index on public.commenti_appunti (appunto_id);


-- ---------------------------------------------------------------------
-- 6. LIBRI (regalo o vendita) e richieste
--    Prezzo in CENTESIMI (800 = 8,00 €) per evitare errori di arrotondamento.
--    Prezzo 0 = regalo. Nessun pagamento passa da qui: la tabella registra solo gli annunci.
-- ---------------------------------------------------------------------
create table public.libri (
    id           uuid primary key default gen_random_uuid(),
    titolo       text not null check (char_length(titolo) between 1 and 80),
    materia      text not null check (materia in ('Matematica','Italiano','Inglese','Scienze','Storia','Informatica','Altro')),
    classe       text not null check (classe in ('1ª','2ª','3ª','4ª','5ª')),
    condizione   text not null check (condizione in ('Come nuovo','Buono','Usato')),
    prezzo_cent  integer not null default 0 check (prezzo_cent between 0 and 20000),
    nota         text not null default '' check (char_length(nota) <= 200),
    stato        text not null default 'disponibile' check (stato in ('disponibile','riservato','ceduto')),
    venditore_id uuid not null default auth.uid() references public.profili (id) on delete cascade,
    creato_il    timestamptz not null default now()
);

create table public.richieste_libri (
    libro_id       uuid not null references public.libri (id) on delete cascade,
    richiedente_id uuid not null default auth.uid() references public.profili (id) on delete cascade,
    stato          text not null default 'in_attesa' check (stato in ('in_attesa','accettata','rifiutata')),
    creato_il      timestamptz not null default now(),
    primary key (libro_id, richiedente_id)
);


-- ---------------------------------------------------------------------
-- 7. SEGNALAZIONI (moderazione): chiunque segnala, solo gli admin leggono
-- ---------------------------------------------------------------------
create table public.segnalazioni (
    id            uuid primary key default gen_random_uuid(),
    tipo          text not null check (tipo in ('idea','sondaggio','appunto','commento','libro')),
    contenuto_id  uuid not null,
    motivo        text not null default '' check (char_length(motivo) <= 300),
    segnalato_da  uuid not null default auth.uid() references public.profili (id) on delete cascade,
    stato         text not null default 'aperta' check (stato in ('aperta','risolta')),
    creato_il     timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 8. VISTE: dati già pronti per il sito (con conteggi e nome breve dell'autore)
--    Le viste leggono i conteggi anche se le singole righe di voto sono private.
-- ---------------------------------------------------------------------
create view public.eventi_v as
select e.*,
       (select count(*) from public.partecipazioni p where p.evento_id = e.id)::int as partecipanti
from public.eventi e;

create view public.comunicazioni_v as
select c.*, public.nome_breve(c.autore_id) as autore
from public.comunicazioni c;

create view public.idee_v as
select i.*,
       public.nome_breve(i.autore_id) as autore,
       (select count(*) from public.voti_idee v where v.idea_id = i.id)::int as voti,
       (select count(*) from public.voti_idee v where v.idea_id = i.id)
           >= (select valore::int from public.impostazioni where chiave = 'soglia_idee') as pronta
from public.idee i;

create view public.sondaggi_v as
select s.*, public.nome_breve(s.autore_id) as autore
from public.sondaggi s;

create view public.sondaggi_opzioni_v as
select o.*,
       (select count(*) from public.sondaggi_voti v where v.opzione_id = o.id)::int as voti
from public.sondaggi_opzioni o;

create view public.appunti_v as
select a.*,
       public.nome_breve(a.autore_id) as autore,
       coalesce((select sum(v.valore) from public.appunti_voti v where v.appunto_id = a.id), 0)::int as punteggio,
       (select count(*) from public.commenti_appunti c where c.appunto_id = a.id)::int as n_commenti
from public.appunti a;

create view public.commenti_appunti_v as
select c.*, public.nome_breve(c.autore_id) as autore
from public.commenti_appunti c;

create view public.libri_v as
select l.*,
       public.nome_breve(l.venditore_id) as venditore,
       (select count(*) from public.richieste_libri r where r.libro_id = l.id)::int as n_richieste,
       -- commissione e netto calcolati con la percentuale in "impostazioni"
       round(l.prezzo_cent * (select valore::numeric from public.impostazioni where chiave = 'commissione_percentuale') / 100)::int as commissione_cent,
       l.prezzo_cent - round(l.prezzo_cent * (select valore::numeric from public.impostazioni where chiave = 'commissione_percentuale') / 100)::int as netto_cent
from public.libri l;


-- ---------------------------------------------------------------------
-- 9. REGOLE DI ACCESSO (RLS): chi può fare cosa
--    "to authenticated" = solo utenti che hanno fatto l'accesso.
--    (select auth.uid()) = id dell'utente collegato.
-- ---------------------------------------------------------------------
alter table public.impostazioni     enable row level security;
alter table public.profili          enable row level security;
alter table public.comunicazioni    enable row level security;
alter table public.eventi           enable row level security;
alter table public.partecipazioni   enable row level security;
alter table public.idee             enable row level security;
alter table public.voti_idee        enable row level security;
alter table public.sondaggi         enable row level security;
alter table public.sondaggi_opzioni enable row level security;
alter table public.sondaggi_voti    enable row level security;
alter table public.appunti          enable row level security;
alter table public.appunti_voti     enable row level security;
alter table public.commenti_appunti enable row level security;
alter table public.libri            enable row level security;
alter table public.richieste_libri  enable row level security;
alter table public.segnalazioni     enable row level security;

-- Impostazioni: tutti leggono, solo admin modifica
create policy imp_lettura on public.impostazioni for select to authenticated using (true);
create policy imp_admin   on public.impostazioni for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Profili: ognuno vede e modifica il proprio (nome, cognome, classe); gli admin vedono tutti
create policy profili_lettura on public.profili for select to authenticated
    using (id = (select auth.uid()) or public.is_admin());
create policy profili_modifica on public.profili for update to authenticated
    using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Comunicazioni ed eventi: tutti leggono, solo admin scrive
create policy com_lettura on public.comunicazioni for select to authenticated using (true);
create policy com_admin   on public.comunicazioni for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy ev_lettura  on public.eventi for select to authenticated using (true);
create policy ev_admin    on public.eventi for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Partecipazioni: ognuno vede e gestisce solo le proprie (i totali arrivano da eventi_v)
create policy part_lettura on public.partecipazioni for select to authenticated using (utente_id = (select auth.uid()));
create policy part_insert  on public.partecipazioni for insert to authenticated with check (utente_id = (select auth.uid()));
create policy part_delete  on public.partecipazioni for delete to authenticated using (utente_id = (select auth.uid()));

-- Idee: tutti leggono e propongono; elimina l'autore o un admin; solo l'admin cambia lo stato
create policy idee_lettura on public.idee for select to authenticated using (true);
create policy idee_insert  on public.idee for insert to authenticated with check (autore_id = (select auth.uid()));
create policy idee_update  on public.idee for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy idee_delete  on public.idee for delete to authenticated using (autore_id = (select auth.uid()) or public.is_admin());

create policy videe_lettura on public.voti_idee for select to authenticated using (utente_id = (select auth.uid()));
create policy videe_insert  on public.voti_idee for insert to authenticated with check (utente_id = (select auth.uid()));
create policy videe_delete  on public.voti_idee for delete to authenticated using (utente_id = (select auth.uid()));

-- Sondaggi
create policy sond_lettura on public.sondaggi for select to authenticated using (true);
create policy sond_insert  on public.sondaggi for insert to authenticated with check (autore_id = (select auth.uid()));
create policy sond_delete  on public.sondaggi for delete to authenticated using (autore_id = (select auth.uid()) or public.is_admin());

create policy sopz_lettura on public.sondaggi_opzioni for select to authenticated using (true);
create policy sopz_insert  on public.sondaggi_opzioni for insert to authenticated
    with check (exists (select 1 from public.sondaggi s where s.id = sondaggio_id and s.autore_id = (select auth.uid())));

create policy svoti_lettura on public.sondaggi_voti for select to authenticated using (utente_id = (select auth.uid()));
create policy svoti_insert  on public.sondaggi_voti for insert to authenticated with check (utente_id = (select auth.uid()));
create policy svoti_update  on public.sondaggi_voti for update to authenticated using (utente_id = (select auth.uid())) with check (utente_id = (select auth.uid()));
create policy svoti_delete  on public.sondaggi_voti for delete to authenticated using (utente_id = (select auth.uid()));

-- Appunti e commenti
create policy app_lettura on public.appunti for select to authenticated using (true);
create policy app_insert  on public.appunti for insert to authenticated with check (autore_id = (select auth.uid()));
create policy app_delete  on public.appunti for delete to authenticated using (autore_id = (select auth.uid()) or public.is_admin());

create policy avoti_lettura on public.appunti_voti for select to authenticated using (utente_id = (select auth.uid()));
create policy avoti_insert  on public.appunti_voti for insert to authenticated with check (utente_id = (select auth.uid()));
create policy avoti_update  on public.appunti_voti for update to authenticated using (utente_id = (select auth.uid())) with check (utente_id = (select auth.uid()));
create policy avoti_delete  on public.appunti_voti for delete to authenticated using (utente_id = (select auth.uid()));

create policy comm_lettura on public.commenti_appunti for select to authenticated using (true);
create policy comm_insert  on public.commenti_appunti for insert to authenticated with check (autore_id = (select auth.uid()));
create policy comm_delete  on public.commenti_appunti for delete to authenticated using (autore_id = (select auth.uid()) or public.is_admin());

-- Libri: tutti leggono; solo il venditore (o un admin) modifica ed elimina
create policy libri_lettura on public.libri for select to authenticated using (true);
create policy libri_insert  on public.libri for insert to authenticated with check (venditore_id = (select auth.uid()));
create policy libri_update  on public.libri for update to authenticated
    using (venditore_id = (select auth.uid()) or public.is_admin()) with check (venditore_id = (select auth.uid()) or public.is_admin());
create policy libri_delete  on public.libri for delete to authenticated using (venditore_id = (select auth.uid()) or public.is_admin());

-- Richieste: le vedono chi le ha fatte, il venditore del libro e gli admin; non si chiede il proprio libro
create policy rich_lettura on public.richieste_libri for select to authenticated
    using (richiedente_id = (select auth.uid())
           or exists (select 1 from public.libri l where l.id = libro_id and l.venditore_id = (select auth.uid()))
           or public.is_admin());
create policy rich_insert on public.richieste_libri for insert to authenticated
    with check (richiedente_id = (select auth.uid())
                and not exists (select 1 from public.libri l where l.id = libro_id and l.venditore_id = (select auth.uid())));
create policy rich_update on public.richieste_libri for update to authenticated   -- il venditore accetta/rifiuta
    using (exists (select 1 from public.libri l where l.id = libro_id and l.venditore_id = (select auth.uid())))
    with check (exists (select 1 from public.libri l where l.id = libro_id and l.venditore_id = (select auth.uid())));
create policy rich_delete on public.richieste_libri for delete to authenticated using (richiedente_id = (select auth.uid()));

-- Segnalazioni: tutti possono segnalare, solo gli admin leggono e chiudono
create policy segn_insert on public.segnalazioni for insert to authenticated with check (segnalato_da = (select auth.uid()));
create policy segn_admin  on public.segnalazioni for select to authenticated using (public.is_admin());
create policy segn_update on public.segnalazioni for update to authenticated using (public.is_admin()) with check (public.is_admin());


-- ---------------------------------------------------------------------
-- 10. FOTO DEGLI APPUNTI (Storage)
--     Bucket privato, max 2 MB, solo immagini. Ognuno carica dentro la propria cartella
--     (<id-utente>/nome.jpg). Per mostrarle il sito usa "signed URL" temporanei.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('appunti', 'appunti', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy foto_lettura on storage.objects for select to authenticated
    using (bucket_id = 'appunti');
create policy foto_upload on storage.objects for insert to authenticated
    with check (bucket_id = 'appunti' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy foto_elimina on storage.objects for delete to authenticated
    using (bucket_id = 'appunti' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));


-- ---------------------------------------------------------------------
-- 11. PERMESSI SULLE TABELLE (secondo livello di protezione, oltre alle regole RLS)
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon;                 -- chi non ha fatto l'accesso non vede nulla
grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;        -- lettura (filtrata dalle regole sopra)

grant insert, update, delete on
    public.impostazioni, public.comunicazioni, public.eventi,
    public.idee, public.sondaggi, public.sondaggi_opzioni, public.appunti,
    public.commenti_appunti, public.libri, public.segnalazioni
    to authenticated;
grant insert, delete on public.partecipazioni, public.voti_idee to authenticated;
grant insert, update, delete on public.sondaggi_voti, public.appunti_voti, public.richieste_libri to authenticated;

-- Profili: il sito può modificare SOLO nome, cognome e classe (mai il ruolo)
revoke insert, update, delete on public.profili from authenticated;
grant update (nome, cognome, classe) on public.profili to authenticated;

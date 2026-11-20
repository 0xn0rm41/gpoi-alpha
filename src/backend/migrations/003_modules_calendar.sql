-- 003 — per-school module switches/options, user language, class representative flag, calendar agenda.

-- moduli: JSON object of explicit overrides, e.g. {"bar":true}. Defaults live in modules.js.
-- opzioni: JSON object of per-school options (assembly rules, bar settings...).
ALTER TABLE scuole ADD COLUMN moduli  TEXT NOT NULL DEFAULT '{}';
ALTER TABLE scuole ADD COLUMN opzioni TEXT NOT NULL DEFAULT '{}';

ALTER TABLE utenti ADD COLUMN lingua TEXT NOT NULL DEFAULT 'it' CHECK (lingua IN ('it', 'en'));
ALTER TABLE utenti ADD COLUMN rappresentante INTEGER NOT NULL DEFAULT 0;     -- class representative (set by a school admin)
ALTER TABLE utenti ADD COLUMN ics_token_hash TEXT;                          -- private calendar feed (sha256 of the URL token)

-- Class/school agenda: tests, homework, interrogations, notes. classe NULL = whole school.
CREATE TABLE agenda (
    id          TEXT PRIMARY KEY,
    scuola_id   TEXT NOT NULL REFERENCES scuole (id) ON DELETE CASCADE,
    classe      TEXT,
    tipo        TEXT NOT NULL CHECK (tipo IN ('verifica', 'interrogazione', 'compito', 'evento', 'altro')),
    titolo      TEXT NOT NULL CHECK (length(titolo) BETWEEN 1 AND 120),
    descrizione TEXT NOT NULL DEFAULT '' CHECK (length(descrizione) <= 1000),
    materia     TEXT NOT NULL DEFAULT '' CHECK (length(materia) <= 40),
    inizio      INTEGER NOT NULL,                       -- ms since epoch (all-day entries: local midnight)
    fine        INTEGER,                                -- optional
    tutto_il_giorno INTEGER NOT NULL DEFAULT 1,
    autore_id   TEXT REFERENCES utenti (id) ON DELETE SET NULL,
    creato_il   INTEGER NOT NULL
);
CREATE INDEX idx_agenda_scuola ON agenda (scuola_id, inizio);
CREATE INDEX idx_agenda_classe ON agenda (scuola_id, classe, inizio);

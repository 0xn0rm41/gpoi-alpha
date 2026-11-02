-- 002 — multi-school (multi-tenant) support.
-- Every community lives in one school ("scuola"); users join it with an invite code.
-- scuola_id is added to users and to the top-level content tables. Child tables
-- (votes, options, participations, requests) inherit their school from the parent row.
-- Columns are nullable at SQL level (SQLite ALTER limitation); the application always sets them.

CREATE TABLE scuole (
    id            TEXT PRIMARY KEY,                                   -- UUID
    nome          TEXT NOT NULL CHECK (length(nome) BETWEEN 2 AND 100),
    codice_invito TEXT NOT NULL UNIQUE,                               -- join code shown to the school admin only
    dominio_email TEXT,                                               -- optional: restrict sign-ups to "@school.edu"
    soglia_idee   INTEGER CHECK (soglia_idee IS NULL OR soglia_idee BETWEEN 1 AND 100000),
    attiva        INTEGER NOT NULL DEFAULT 1,                         -- 0 = suspended by the operator
    creato_il     INTEGER NOT NULL
);

ALTER TABLE utenti          ADD COLUMN scuola_id TEXT REFERENCES scuole (id);
ALTER TABLE comunicazioni   ADD COLUMN scuola_id TEXT REFERENCES scuole (id);
ALTER TABLE eventi          ADD COLUMN scuola_id TEXT REFERENCES scuole (id);
ALTER TABLE idee            ADD COLUMN scuola_id TEXT REFERENCES scuole (id);
ALTER TABLE sondaggi        ADD COLUMN scuola_id TEXT REFERENCES scuole (id);
ALTER TABLE appunti         ADD COLUMN scuola_id TEXT REFERENCES scuole (id);
ALTER TABLE commenti_appunti ADD COLUMN scuola_id TEXT REFERENCES scuole (id);
ALTER TABLE libri           ADD COLUMN scuola_id TEXT REFERENCES scuole (id);
ALTER TABLE segnalazioni    ADD COLUMN scuola_id TEXT REFERENCES scuole (id);

CREATE INDEX idx_utenti_scuola ON utenti (scuola_id);
CREATE INDEX idx_eventi_scuola ON eventi (scuola_id, inizio);
CREATE INDEX idx_idee_scuola ON idee (scuola_id);
CREATE INDEX idx_sondaggi_scuola ON sondaggi (scuola_id);
CREATE INDEX idx_appunti_scuola ON appunti (scuola_id);
CREATE INDEX idx_libri_scuola ON libri (scuola_id);
CREATE INDEX idx_comunicazioni_scuola ON comunicazioni (scuola_id);
CREATE INDEX idx_segnalazioni_scuola ON segnalazioni (scuola_id);

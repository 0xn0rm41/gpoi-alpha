-- 005 — class assembly requests (assemblea di classe).
CREATE TABLE assemblee (
    id              TEXT PRIMARY KEY,
    scuola_id       TEXT NOT NULL REFERENCES scuole (id) ON DELETE CASCADE,
    classe          TEXT NOT NULL,
    richiedente_id  TEXT REFERENCES utenti (id) ON DELETE SET NULL,
    data_proposta   INTEGER NOT NULL,                 -- local midnight of the proposed day (ms)
    ora_inizio      TEXT NOT NULL DEFAULT '',          -- "HH:MM" or lesson hour label, free
    durata_ore      INTEGER NOT NULL CHECK (durata_ore BETWEEN 1 AND 8),
    ordine_giorno   TEXT NOT NULL CHECK (length(ordine_giorno) BETWEEN 5 AND 1000),
    note            TEXT NOT NULL DEFAULT '' CHECK (length(note) <= 500),
    stato           TEXT NOT NULL DEFAULT 'inviata' CHECK (stato IN ('inviata', 'approvata', 'rifiutata', 'annullata', 'svolta')),
    data_confermata INTEGER,                           -- the school may move the date
    motivo_decisione TEXT NOT NULL DEFAULT '' CHECK (length(motivo_decisione) <= 500),
    deciso_il       INTEGER,
    creato_il       INTEGER NOT NULL
);
CREATE INDEX idx_assemblee_scuola ON assemblee (scuola_id, stato, data_proposta);

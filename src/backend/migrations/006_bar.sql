-- 006 — bar / canteen pre-orders (optional module, enabled per school by the operator). Pay at pickup: no payments here.
CREATE TABLE bar_prodotti (
    id          TEXT PRIMARY KEY,
    scuola_id   TEXT NOT NULL REFERENCES scuole (id) ON DELETE CASCADE,
    nome        TEXT NOT NULL CHECK (length(nome) BETWEEN 1 AND 80),
    descrizione TEXT NOT NULL DEFAULT '' CHECK (length(descrizione) <= 300),
    categoria   TEXT NOT NULL DEFAULT '' CHECK (length(categoria) <= 30),
    prezzo_cent INTEGER NOT NULL CHECK (prezzo_cent BETWEEN 0 AND 10000),
    allergeni   TEXT NOT NULL DEFAULT '' CHECK (length(allergeni) <= 200),
    disponibile INTEGER NOT NULL DEFAULT 1,
    creato_il   INTEGER NOT NULL
);
CREATE INDEX idx_bar_prodotti_scuola ON bar_prodotti (scuola_id);

-- Pickup slots (e.g. "Morning break 10:10"): orders must be placed before cutoff_min minutes ahead.
CREATE TABLE bar_fasce (
    id          TEXT PRIMARY KEY,
    scuola_id   TEXT NOT NULL REFERENCES scuole (id) ON DELETE CASCADE,
    etichetta   TEXT NOT NULL CHECK (length(etichetta) BETWEEN 1 AND 40),
    ora         TEXT NOT NULL CHECK (ora GLOB '[0-2][0-9]:[0-5][0-9]'),
    cutoff_min  INTEGER NOT NULL DEFAULT 60 CHECK (cutoff_min BETWEEN 0 AND 600),
    attiva      INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_bar_fasce_scuola ON bar_fasce (scuola_id);

CREATE TABLE bar_ordini (
    id          TEXT PRIMARY KEY,
    scuola_id   TEXT NOT NULL REFERENCES scuole (id) ON DELETE CASCADE,
    utente_id   TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    fascia_id   TEXT NOT NULL REFERENCES bar_fasce (id) ON DELETE CASCADE,
    giorno      TEXT NOT NULL,                          -- YYYY-MM-DD (school-local)
    codice      TEXT NOT NULL,                          -- short pickup code
    stato       TEXT NOT NULL DEFAULT 'richiesto' CHECK (stato IN ('richiesto', 'in_preparazione', 'pronto', 'ritirato', 'annullato')),
    nota        TEXT NOT NULL DEFAULT '' CHECK (length(nota) <= 200),
    totale_cent INTEGER NOT NULL,
    creato_il   INTEGER NOT NULL,
    aggiornato_il INTEGER NOT NULL
);
CREATE INDEX idx_bar_ordini_scuola ON bar_ordini (scuola_id, giorno, fascia_id);
CREATE INDEX idx_bar_ordini_utente ON bar_ordini (utente_id, giorno);

CREATE TABLE bar_ordini_righe (
    ordine_id   TEXT NOT NULL REFERENCES bar_ordini (id) ON DELETE CASCADE,
    prodotto_id TEXT REFERENCES bar_prodotti (id) ON DELETE SET NULL,
    nome        TEXT NOT NULL,                          -- snapshot at order time
    prezzo_cent INTEGER NOT NULL,
    qta         INTEGER NOT NULL CHECK (qta BETWEEN 1 AND 10)
);
CREATE INDEX idx_bar_righe_ordine ON bar_ordini_righe (ordine_id);

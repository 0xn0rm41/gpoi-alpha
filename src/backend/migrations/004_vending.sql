-- 004 — vending machines: products, price and availability (crowd-reported, school-admin managed).
CREATE TABLE distributori (
    id          TEXT PRIMARY KEY,
    scuola_id   TEXT NOT NULL REFERENCES scuole (id) ON DELETE CASCADE,
    nome        TEXT NOT NULL CHECK (length(nome) BETWEEN 1 AND 60),
    ubicazione  TEXT NOT NULL DEFAULT '' CHECK (length(ubicazione) <= 100),
    tipo        TEXT NOT NULL DEFAULT 'misto' CHECK (tipo IN ('snack', 'bevande', 'caffe', 'misto')),
    attivo      INTEGER NOT NULL DEFAULT 1,
    creato_il   INTEGER NOT NULL
);
CREATE INDEX idx_distributori_scuola ON distributori (scuola_id);

CREATE TABLE distributori_prodotti (
    id             TEXT PRIMARY KEY,
    distributore_id TEXT NOT NULL REFERENCES distributori (id) ON DELETE CASCADE,
    scuola_id      TEXT NOT NULL REFERENCES scuole (id) ON DELETE CASCADE,
    nome           TEXT NOT NULL CHECK (length(nome) BETWEEN 1 AND 80),
    categoria      TEXT NOT NULL DEFAULT '' CHECK (length(categoria) <= 30),
    prezzo_cent    INTEGER NOT NULL CHECK (prezzo_cent BETWEEN 0 AND 10000),
    stato          TEXT NOT NULL DEFAULT 'disponibile' CHECK (stato IN ('disponibile', 'pochi', 'esaurito')),
    fonte          TEXT NOT NULL DEFAULT 'admin' CHECK (fonte IN ('admin', 'studenti')),
    aggiornato_il  INTEGER NOT NULL
);
CREATE INDEX idx_dprod_distributore ON distributori_prodotti (distributore_id);

-- Student availability reports (one row per user+product, replaced when they report again)
CREATE TABLE distributori_segnalazioni (
    prodotto_id TEXT NOT NULL REFERENCES distributori_prodotti (id) ON DELETE CASCADE,
    utente_id   TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    stato       TEXT NOT NULL CHECK (stato IN ('disponibile', 'pochi', 'esaurito')),
    creato_il   INTEGER NOT NULL,
    PRIMARY KEY (prodotto_id, utente_id)
);

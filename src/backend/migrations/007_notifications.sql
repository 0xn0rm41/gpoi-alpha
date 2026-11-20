-- 007 — follow bell + e-mail notifications (opt-in, batched), poll closing.
ALTER TABLE utenti ADD COLUMN notifiche_freq TEXT NOT NULL DEFAULT 'off' CHECK (notifiche_freq IN ('off', 'subito', 'giornaliera'));
ALTER TABLE utenti ADD COLUMN disiscr_token TEXT;                -- capability for the one-click unsubscribe link in e-mails

-- What a user follows. tipo = category ('eventi','comunicazioni','idee','sondaggi','appunti','libri','agenda','assemblee','distributori','bar')
-- with ref = '' (whole category) or a specific object: tipo 'idea' / 'sondaggio' / 'libro' / 'appunto' with ref = id.
CREATE TABLE iscrizioni (
    utente_id TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    tipo      TEXT NOT NULL,
    ref       TEXT NOT NULL DEFAULT '',
    creato_il INTEGER NOT NULL,
    PRIMARY KEY (utente_id, tipo, ref)
);

-- Pending notifications; a worker sends one digest e-mail per user and deletes sent rows after 7 days.
CREATE TABLE notifiche (
    id        TEXT PRIMARY KEY,
    utente_id TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    tipo      TEXT NOT NULL,
    chiave    TEXT NOT NULL,                              -- message key, rendered in the reader's language (it/en)
    dati      TEXT NOT NULL DEFAULT '{}',                  -- JSON parameters of the message
    link      TEXT NOT NULL DEFAULT '',
    creato_il INTEGER NOT NULL,
    letta     INTEGER NOT NULL DEFAULT 0,
    inviata_il INTEGER
);
CREATE INDEX idx_notifiche_utente ON notifiche (utente_id, inviata_il, creato_il);

ALTER TABLE sondaggi ADD COLUMN chiuso_il INTEGER;               -- closed polls publish their results to followers

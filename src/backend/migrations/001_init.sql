-- =====================================================================
--  schema.sql — Database di Hub Studenti (SQLite)
--
--  Non devi eseguirlo a mano: il server lo applica da solo all'avvio
--  (server/db.js). Tutte le istruzioni sono "IF NOT EXISTS", quindi si può
--  rieseguire senza rischi. Il file del database è data/hub.sqlite.
--
--  PRINCIPI (GDPR, vedi docs/GDPR.md)
--  - Minimizzazione: dell'utente si salvano solo nome, cognome, email scolastica,
--    classe e l'impronta della password. Niente data di nascita, telefono, indirizzo.
--  - Cancellazione: ogni contenuto dell'utente ha ON DELETE CASCADE. Cancellando
--    l'account sparisce tutto ciò che ha creato (le foto vengono tolte dal disco dal server).
--  - Le password non sono mai salvate in chiaro (scrypt + sale casuale).
--  - I token di sessione e di verifica sono salvati solo come impronta SHA-256.
--  - Tempi in millisecondi Unix (INTEGER); prezzi in centesimi (INTEGER).
-- =====================================================================

PRAGMA foreign_keys = ON;

-- Impostazioni modificabili senza toccare il codice (npm run admin -- set <chiave> <valore>)
CREATE TABLE IF NOT EXISTS impostazioni (
    chiave TEXT PRIMARY KEY,
    valore TEXT NOT NULL
);

-- ---------------------------------------------------------------------
-- UTENTI e accesso
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utenti (
    id                TEXT PRIMARY KEY,                       -- UUID
    email             TEXT NOT NULL UNIQUE COLLATE NOCASE,
    nome              TEXT NOT NULL CHECK (length(nome) BETWEEN 1 AND 60),
    cognome           TEXT NOT NULL DEFAULT '' CHECK (length(cognome) <= 60),
    classe            TEXT CHECK (classe IS NULL OR length(classe) <= 6),
    ruolo             TEXT NOT NULL DEFAULT 'studente' CHECK (ruolo IN ('studente', 'admin')),
    pw_hash           TEXT NOT NULL,                          -- "scrypt$N$r$p$sale$hash"
    verificato        INTEGER NOT NULL DEFAULT 0,             -- 1 = ha confermato l'email
    consenso_il       INTEGER NOT NULL,                       -- quando ha accettato regole e informativa
    consenso_versione TEXT NOT NULL,                          -- versione dell'informativa accettata
    creato_il         INTEGER NOT NULL,
    ultimo_accesso    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessioni (
    token_hash TEXT PRIMARY KEY,                              -- SHA-256 del cookie
    utente_id  TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    creata_il  INTEGER NOT NULL,
    scade_il   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessioni_utente ON sessioni (utente_id);
CREATE INDEX IF NOT EXISTS idx_sessioni_scadenza ON sessioni (scade_il);

-- Link monouso inviati per email: conferma dell'indirizzo e recupero password
CREATE TABLE IF NOT EXISTS token_email (
    token_hash TEXT PRIMARY KEY,
    utente_id  TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    scopo      TEXT NOT NULL CHECK (scopo IN ('verifica', 'reset')),
    scade_il   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_token_utente ON token_email (utente_id);

-- ---------------------------------------------------------------------
-- COMUNICAZIONI DEI RAPPRESENTANTI ed EVENTI (li scrivono solo gli admin)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comunicazioni (
    id        TEXT PRIMARY KEY,
    titolo    TEXT NOT NULL CHECK (length(titolo) BETWEEN 1 AND 120),
    testo     TEXT NOT NULL DEFAULT '' CHECK (length(testo) <= 600),
    autore_id TEXT REFERENCES utenti (id) ON DELETE SET NULL,   -- la comunicazione resta anche se l'admin se ne va
    creato_il INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS eventi (
    id          TEXT PRIMARY KEY,
    titolo      TEXT NOT NULL CHECK (length(titolo) BETWEEN 1 AND 120),
    descrizione TEXT NOT NULL DEFAULT '' CHECK (length(descrizione) <= 600),
    luogo       TEXT NOT NULL DEFAULT '' CHECK (length(luogo) <= 80),
    categoria   TEXT NOT NULL DEFAULT 'Scuola' CHECK (categoria IN ('Scuola', 'Sport', 'Studio', 'Cultura')),
    inizio      INTEGER NOT NULL,
    autore_id   TEXT REFERENCES utenti (id) ON DELETE SET NULL,
    creato_il   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_eventi_inizio ON eventi (inizio);

CREATE TABLE IF NOT EXISTS partecipazioni (
    evento_id TEXT NOT NULL REFERENCES eventi (id) ON DELETE CASCADE,
    utente_id TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    creato_il INTEGER NOT NULL,
    PRIMARY KEY (evento_id, utente_id)                        -- una sola iscrizione per persona
);

-- ---------------------------------------------------------------------
-- IDEE per l'istituto
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS idee (
    id          TEXT PRIMARY KEY,
    titolo      TEXT NOT NULL CHECK (length(titolo) BETWEEN 1 AND 80),
    descrizione TEXT NOT NULL DEFAULT '' CHECK (length(descrizione) <= 400),
    stato       TEXT NOT NULL DEFAULT 'aperta' CHECK (stato IN ('aperta', 'esposta')),   -- esposta = portata in assemblea
    autore_id   TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    creato_il   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS voti_idee (
    idea_id   TEXT NOT NULL REFERENCES idee (id) ON DELETE CASCADE,
    utente_id TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    creato_il INTEGER NOT NULL,
    PRIMARY KEY (idea_id, utente_id)                          -- un solo sostegno per persona
);

-- ---------------------------------------------------------------------
-- SONDAGGI (2-5 opzioni, si può cambiare voto)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sondaggi (
    id        TEXT PRIMARY KEY,
    domanda   TEXT NOT NULL CHECK (length(domanda) BETWEEN 1 AND 120),
    autore_id TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    creato_il INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sondaggi_opzioni (
    id           TEXT PRIMARY KEY,
    sondaggio_id TEXT NOT NULL REFERENCES sondaggi (id) ON DELETE CASCADE,
    testo        TEXT NOT NULL CHECK (length(testo) BETWEEN 1 AND 60),
    posizione    INTEGER NOT NULL DEFAULT 0,
    UNIQUE (id, sondaggio_id)
);

CREATE TABLE IF NOT EXISTS sondaggi_voti (
    sondaggio_id TEXT NOT NULL REFERENCES sondaggi (id) ON DELETE CASCADE,
    utente_id    TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    opzione_id   TEXT NOT NULL,
    creato_il    INTEGER NOT NULL,
    PRIMARY KEY (sondaggio_id, utente_id),                    -- un voto per sondaggio (si cambia aggiornando la riga)
    FOREIGN KEY (opzione_id, sondaggio_id) REFERENCES sondaggi_opzioni (id, sondaggio_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- APPUNTI (foto + spiegazione, voti su/giù, commenti)
-- La foto è un file in data/uploads/; qui si salva solo il nome del file.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appunti (
    id        TEXT PRIMARY KEY,
    titolo    TEXT NOT NULL CHECK (length(titolo) BETWEEN 1 AND 80),
    materia   TEXT NOT NULL CHECK (materia IN ('Matematica','Italiano','Inglese','Scienze','Storia','Informatica','Altro')),
    testo     TEXT NOT NULL CHECK (length(testo) BETWEEN 1 AND 600),
    foto      TEXT NOT NULL,                                  -- es. "3f2a….jpg"
    autore_id TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    creato_il INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS appunti_voti (
    appunto_id TEXT NOT NULL REFERENCES appunti (id) ON DELETE CASCADE,
    utente_id  TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    valore     INTEGER NOT NULL CHECK (valore IN (1, -1)),    -- 1 = su, -1 = giù
    PRIMARY KEY (appunto_id, utente_id)
);

CREATE TABLE IF NOT EXISTS commenti_appunti (
    id         TEXT PRIMARY KEY,
    appunto_id TEXT NOT NULL REFERENCES appunti (id) ON DELETE CASCADE,
    autore_id  TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    testo      TEXT NOT NULL CHECK (length(testo) BETWEEN 1 AND 300),
    creato_il  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_commenti_appunto ON commenti_appunti (appunto_id);

-- ---------------------------------------------------------------------
-- LIBRI (regalo o vendita) e richieste "Lo voglio"
-- Prezzo 0 = regalo. Nessun pagamento passa da qui: si registrano solo annunci e richieste.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS libri (
    id           TEXT PRIMARY KEY,
    titolo       TEXT NOT NULL CHECK (length(titolo) BETWEEN 1 AND 80),
    materia      TEXT NOT NULL CHECK (materia IN ('Matematica','Italiano','Inglese','Scienze','Storia','Informatica','Altro')),
    classe       TEXT NOT NULL CHECK (classe IN ('1ª','2ª','3ª','4ª','5ª')),
    condizione   TEXT NOT NULL CHECK (condizione IN ('Come nuovo','Buono','Usato')),
    prezzo_cent  INTEGER NOT NULL DEFAULT 0 CHECK (prezzo_cent BETWEEN 0 AND 20000),
    nota         TEXT NOT NULL DEFAULT '' CHECK (length(nota) <= 200),
    stato        TEXT NOT NULL DEFAULT 'disponibile' CHECK (stato IN ('disponibile','riservato','ceduto')),
    venditore_id TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    creato_il    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS richieste_libri (
    libro_id       TEXT NOT NULL REFERENCES libri (id) ON DELETE CASCADE,
    richiedente_id TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    stato          TEXT NOT NULL DEFAULT 'in_attesa' CHECK (stato IN ('in_attesa','accettata','rifiutata')),
    creato_il      INTEGER NOT NULL,
    PRIMARY KEY (libro_id, richiedente_id)
);

-- ---------------------------------------------------------------------
-- SEGNALAZIONI (moderazione): chiunque segnala, solo gli admin leggono
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS segnalazioni (
    id           TEXT PRIMARY KEY,
    tipo         TEXT NOT NULL CHECK (tipo IN ('idea','sondaggio','appunto','commento','libro')),
    contenuto_id TEXT NOT NULL,
    motivo       TEXT NOT NULL DEFAULT '' CHECK (length(motivo) <= 300),
    segnalato_da TEXT NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
    stato        TEXT NOT NULL DEFAULT 'aperta' CHECK (stato IN ('aperta','risolta')),
    creato_il    INTEGER NOT NULL,
    UNIQUE (tipo, contenuto_id, segnalato_da)                 -- non si segnala due volte lo stesso contenuto
);

-- Versione dello schema, per le migrazioni future
CREATE TABLE IF NOT EXISTS meta (chiave TEXT PRIMARY KEY, valore TEXT NOT NULL);
INSERT OR IGNORE INTO meta (chiave, valore) VALUES ('schema_versione', '1');

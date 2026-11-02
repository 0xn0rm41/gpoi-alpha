# Architettura Tecnica e Linee Guida di Sviluppo: Hub Studenti Open Source

Questo documento definisce le specifiche ingegneristiche, i requisiti strutturali e l'architettura software per la realizzazione della Web App scolastica. Il sistema è progettato secondo i principi di **modularità**, **sicurezza by design**, ed è ottimizzato per l'hosting gratuito e la collaborazione open-source su GitHub.

---

## 1. Stack Tecnologico Consigliato (Jamstack Architecture)

Per minimizzare i costi di gestione (0€ totali) e massimizzare la manutenibilità, si adotta un'architettura disaccoppiata (Decoupled Jamstack):

*   **Frontend Framework:** **Vite.js + React** (oppure HTML5/Vanilla JS per massima semplicità). Consente di strutturare l'applicazione in componenti riutilizzabili (es. Componente Post, Componente Sondaggio).
*   **Stile & UI:** **Tailwind CSS**. Un framework CSS utility-first che garantisce una reattività immediata su dispositivi mobile (smartphone degli studenti) senza scrivere file CSS mastodontici.
*   **Backend-as-a-Service (BaaS):** **Supabase (Open Source)**. Sostituisce la necessità di configurare un server fisico (Node.js/Python) e offre nativamente:
    *   PostgreSQL come Database Relazionale.
    *   Supabase Auth (Gestione sessioni e JWT).
    *   Supabase Storage (Bucket per l'upload di file PDF/Immagini per gli appunti).
*   **Hosting & CI/CD:** **Vercel** o **Netlify**. Connessi direttamente alla cartella (repository) di GitHub, eseguono il deploy automatico online a ogni `git push`.

---

## 2. Architettura del Database (Schema Relazionale)

Il database PostgreSQL di Supabase utilizzerà quattro tabelle principali relazionate tra loro:

```
  +------------------+         +------------------+
  |     profiles     |         |      posts       |
  +------------------+         +------------------+
  | id (UUID, PK)    | 1     N | id (UUID, PK)    |
  | full_name (text) |-------->| user_id (FK)     |
  | email (text)     |         | type (text)      | -- 'appunto', 'aiuto', 'evento'
  | is_admin (bool)  |         | title (text)     |
  +------------------+         | content (text)   |
           |                   | file_url (text)  | -- Link al PDF nello Storage
           | 1                 +------------------+
           |
           v N
  +------------------+
  |      votes       |
  +------------------+
  | id (BigInt, PK)  |
  | user_id (FK)     |
  | post_id (FK)     |
  +------------------+
```

### Specifiche delle Tabelle:
1.  **profiles:** Estensione della tabella di autenticazione nativa. Il campo cruciale è `is_admin (boolean, default: false)`, che determina gerarchicamente i permessi software dell'utente.
2.  **posts:** Contiene tutte le interazioni (Scambio appunti, richieste d'aiuto, annunci di eventi). Il campo `type` fa da discriminante algoritmica per smistare i dati nelle diverse bacheche del frontend.
3.  **votes:** Tabella pivot per gestire il sistema di *Upvote* (Mi Piace) degli appunti. Impedisce che lo stesso studente voti più volte lo stesso contenuto (Vincolo Unique composto: `user_id` + `post_id`).
4.  **polls (Sondaggi):** Tabella dedicata ai sondaggi amministrativi, strutturata con un array di opzioni (JSONB) e una tabella correlata `poll_votes` per tracciare le risposte in modo anonimo ma univoco.

---

## 3. Logica di Autenticazione e Sicurezza (RLS)

### Validazione del Dominio Istituzionale
L'iscrizione deve essere blindata lato client e confermata lato server. Sfruttando i **Trigger di PostgreSQL** in Supabase, si blocca l'inserimento nel database di qualsiasi utente la cui email non termini con il dominio specifico della scuola:

```sql
CREATE OR REPLACE FUNCTION check_school_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email NOT LIKE '%@istituto.edu.it' THEN
        RAISE EXCEPTION 'Accesso consentito solo con email istituzionale.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Row Level Security (RLS)
PostgreSQL permette di blindare i dati direttamente nel database, rendendo inutile qualsiasi tentativo di "crackare" il frontend o fare reverse engineering malevolo sulle API pubbliche.
Vengono applicate le seguenti politiche (Policies):
*   **Tabella `posts` (Lettura):** Consentita a tutti gli utenti autenticati (`auth.role() = 'authenticated'`).
*   **Tabella `posts` (Scrittura):** Consentita agli utenti autenticati se `auth.uid() = user_id` (gli studenti possono scrivere o modificare solo i propri post).
*   **Tabella `polls` (Creazione Sondaggi):** Consentita solo se l'utente ha il flag `is_admin = true` nella tabella `profiles`.

---

## 4. Struttura del Codice del Frontend (Organizzazione Cartelle)

Per mantenere il progetto ordinato e pronto per la collaborazione open-source su GitHub, la struttura delle cartelle deve seguire lo standard standardizzato dei progetti web moderni:

```text
├── .github/               # Workflows per CI/CD automatico
├── src/
│   ├── assets/            # Immagini, loghi scolastici, icone SVG
│   ├── components/        # Componenti dell'interfaccia riutilizzabili
│   │   ├── Navbar.jsx     # Barra di navigazione (mostra tasto Admin se autorizzato)
│   │   ├── PostCard.jsx   # Box del singolo appunto / richiesta aiuto
│   │   └── PollWidget.jsx # Interfaccia visiva del sondaggio attivo
│   ├── context/
│   │   └── AuthContext.jsx# Stato globale dell'utente (Sessione, dati profilo, ruolo)
│   ├── views/             # Pagine principali dell'applicazione
│   │   ├── Login.jsx      # Schermata di accesso con controllo dominio
│   │   ├── HubAppunti.jsx # Bacheca download/upload file di studio
│   │   ├── SosStudio.jsx  # Sezione cerco/offro aiuto tra classi
│   │   └── AdminConsole.jsx# Pannello di controllo e debug protetto
│   ├── supabaseClient.js  # Inizializzazione della connessione al BaaS
│   ├── App.jsx            # Router principale (Gestione dei percorsi delle pagine)
│   └── main.jsx           # Entry point dell'applicazione
├── .env.example           # File di esempio per le chiavi API (da spingere su GitHub)
├── .gitignore             # Istruzioni per escludere file sensibili (es. .env)
└── tailwind.config.js     # Configurazione del framework grafico
```

---

## 5. Implementazione del Debug Privato (Admin Console)

Come richiesto, il debug approfondito deve essere ad uso esclusivo del team di amministrazione, integrando le configurazioni di sicurezza per la modalità Open Source.

### Gestione dei Segreti tramite Variabili d'Ambiente
Nel file `.gitignore` deve essere tassativamente inserita la voce `.env`. All'interno del file locale `.env` verranno salvate le credenziali di sviluppo:
```env
VITE_SUPABASE_URL=https://tuoidprogetto.supabase.co
VITE_SUPABASE_ANON_KEY=la_tua_chiave_anonima_pubblica
```

### Logica di Debug Condizionale nel Codice
Nel pannello di controllo degli amministratori (`AdminConsole.jsx`), viene implementato un middleware che intercetta lo stato dell'utente. I log sensibili e le funzioni di diagnostica vengono esposti solo se la verifica crittografica del JWT (JSON Web Token) conferma il ruolo di amministratore:

```javascript
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminConsole() {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        // Controllo di sicurezza lato Client
        const verificareRuoloAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profilo } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single();

            if (!profilo || !profilo.is_admin) {
                // Se non è admin, reindirizza immediatamente alla bacheca comune
                window.location.href = '/hub-appunti';
                return;
            }

            // [DEBUG MODE] Attivazione log tecnici visibili solo in Console F12 per gli sviluppatori
            console.warn("[SECURITY NOTICE] Console di amministrazione sbloccata per l'utente UID:", user.id);
        };

        verificareRuoloAdmin();
    }, []);

    return (
        <div class="p-6 bg-slate-900 text-green-400 font-mono h-screen">
            <h1 class="text-xl font-bold border-b border-slate-700 pb-2">SYSTEM DEBUG CONSOLE</h1>
            {/* Interfaccia per monitoraggio e moderazione dei contenuti */}
        </div>
    );
}
```

---

## 6. Flusso di Lavoro su GitHub (Modificabilità e Trasparenza)

Per permettere agli altri studenti di studiare il codice (Reverse Engineering formativo) e proporre modifiche senza compromettere il sito online, si applica il modello **Git-Flow**:

1.  **Branch `main`:** Contiene il codice stabile di produzione. È protetto: nessuno può fare modifiche dirette su questo ramo. Vercel legge questo branch per aggiornare il sito ufficiale.
2.  **Branch `development`:** Il ramo dove tu e i tuoi collaboratori integrate le nuove funzioni prima di renderle pubbliche.
3.  **Fork e Pull Request (Per gli studenti esterni):** Se un compagno di scuola nota un bug o vuole migliorare la grafica della bacheca appunti:
    *   Fa un *Fork* del tuo archivio GitHub.
    *   Modifica il codice sul suo profilo.
    *   Invia una *Pull Request* (richiesta di unione) al tuo archivio.
    *   **Tu e i tuoi amministratori** analizzerete il codice proposto nella vostra console di debug e deciderete se approvarlo e integrarlo nel sito della scuola.

Ho scritto `schema.sql` con la struttura del database e ho aggiornato il README. Ho provato lo schema su un PostgreSQL locale con le parti di Supabase simulate, non su Supabase vero. Il dominio sbagliato viene rifiutato, nessuno può darsi il ruolo di admin, si vota una sola volta e si può cambiare voto nei sondaggi. Uno studente non può modificare le idee altrui né creare eventi.

**Dominio**
- **.com:** conviene Cloudflare Registrar, che vende senza ricarico, a circa 10,44 dollari l'anno con lo stesso prezzo al rinnovo. Alternative con prezzi fissi sono Porkbun, a circa 11 dollari, e Spaceship, a circa 9-10. Diffida delle offerte da 1 centesimo o 1 dollaro il primo anno: i rinnovi salgono a oltre 20 dollari.
- **.it:** costa circa 6-12 dollari l'anno secondo i comparatori, ma il titolare deve essere maggiorenne e legato a un paese del SEE. Se siete minorenni, deve registrarlo un adulto: un docente, l'associazione o la scuola.
- **Sottodominio della scuola:** se la scuola ha un dominio, chiedi un sottodominio tipo `hub.tuascuola.edu.it`. Costa zero e dà più fiducia agli studenti.

**Hosting**
Il sito è statico e i dati stanno nel database, quindi un hosting tradizionale a pagamento non serve. Le due scelte gratuite migliori sono:
- **Cloudflare Pages:** banda illimitata sui file statici nel piano gratuito, 500 build al mese e fino a 100 domini personalizzati. Cloudflare sta spingendo i nuovi progetti verso i Workers, ma Pages resta supportato.
- **GitHub Pages:** domini personalizzati e HTTPS gratuiti, con un limite morbido di 100 GB al mese. Va bene per un progetto open source con repository pubblico.

Eviterei Netlify: il piano gratuito ha un tetto rigido e mette in pausa il sito quando finiscono i crediti.

**Implementare il database**
1. Metti i file su un repository GitHub, senza mai caricare chiavi segrete.
2. Collega il repository a Cloudflare Pages o GitHub Pages, poi aggiungi il dominio.
3. Crea un progetto Supabase in una regione europea e incolla `schema.sql` nell'SQL Editor.
4. In Authentication attiva la conferma via email e imposta l'indirizzo del sito. Configura anche un servizio SMTP per le email, perché quello incluso in Supabase in genere è pensato solo per i test.
5. Nel sito usa solo l'URL del progetto e la chiave pubblica. La chiave secret o `service_role` non deve mai comparire nel codice delle pagine.
6. Dopo che un rappresentante si è registrato, rendilo admin con `update public.profili set ruolo = 'admin' where id = '...'`.
7. Riscrivi `auth.js` con le chiamate a Supabase, e nella bacheca sostituisci i dati di esempio con letture e scritture sul database.

Le chiamate sono brevi:
```js
const db = supabase.createClient("https://XXXX.supabase.co", "CHIAVE_PUBBLICA");
await db.auth.signUp({ email, password, options: { data: { nome, cognome, classe } } });
await db.from("idee_v").select("*").order("voti", { ascending: false });
await db.from("voti_idee").insert({ idea_id });          // sostieni un'idea
await db.rpc("crea_sondaggio", { p_domanda, p_opzioni }); // sondaggio con 2-5 opzioni
```

**Costi e pausa del database:** tra dominio, hosting e Supabase spendi circa 10 euro l'anno, o zero con il sottodominio della scuola. Il piano gratuito di Supabase mette in pausa i progetti dopo 7 giorni di inattività e non ha backup. Con le vacanze estive succederebbe di sicuro. Un monitor gratuito che richiama il progetto ogni pochi minuti la evita, oppure passi al piano a pagamento da 25 dollari al mese.

**Struttura del progetto**
```
hub-studenti/
├─ index.html      accesso
├─ register.html   registrazione
├─ bacheca.html    portale (6 sezioni)
├─ auth.js         configurazione e account
├─ schema.sql      database
└─ README.md
```

**Tabelle del database**

| Area | Tabelle | Chi scrive |
|---|---|---|
| Utenti e impostazioni | `profili`, `impostazioni` | Il profilo si crea da solo alla registrazione; le impostazioni (soglia idee, commissione, dominio email) le cambiano solo gli admin |
| Bacheca | `eventi`, `partecipazioni`, `comunicazioni` | Solo gli admin; gli iscritti agli eventi si contano da soli |
| Idee | `idee`, `voti_idee` | Tutti; un solo sostegno per persona |
| Sondaggi | `sondaggi`, `sondaggi_opzioni`, `sondaggi_voti` | Tutti; si può cambiare voto |
| Appunti | `appunti`, `appunti_voti`, `commenti_appunti` + cartella foto | Tutti; ognuno carica solo nella propria cartella |
| Libri | `libri`, `richieste_libri` | Il venditore gestisce l'annuncio e le richieste |
| Moderazione | `segnalazioni` | Tutti segnalano, solo gli admin leggono |

Il sito legge i dati già contati dalle viste `idee_v`, `appunti_v`, `libri_v` e simili. Gli altri studenti vedono solo "Nome C.", il cognome completo resta privato. I prezzi dei libri sono in centesimi, la commissione dello schema è solo un calcolo e non muove denaro. La soglia per l'assemblea (30) si cambia con un `update`, senza toccare il codice.

Vuoi che colleghi ora `auth.js` e la bacheca a Supabase, così registrazione, voti e annunci diventano condivisi tra tutti gli studenti?

# Hub Studenti

Piattaforma web open source, gestita dagli studenti, per comunicazione, studio e attività a scuola.
Questa è una **bozza (prototipo)**: la grafica e le funzioni si vedono e si provano, ma non c'è ancora un server.

## File del progetto

| File | A cosa serve |
|---|---|
| `index.html` | Prima pagina del sito: accesso con email e password, con link per registrarsi. |
| `register.html` | Registrazione: nome, cognome, email scolastica, classe e password. |
| `auth.js` | Configurazione (dominio scuola, admin, lunghezza password) e gestione degli account. È l'unico file da riscrivere quando ci sarà il database. |
| `bacheca.html` | Il portale vero e proprio: una sola pagina con sei sezioni (vedi sotto). |
| `README.md` | Questo file. |

Ogni pagina HTML contiene struttura (HTML), grafica (`<style>`) e logica (`<script>`). `index.html` e `register.html` usano anche `auth.js`, quindi vanno tenuti nella stessa cartella. Non servono librerie da installare.

### Sezioni di `bacheca.html`

- **Bacheca**: prossimo evento, riquadri rapidi, elenco eventi con ricerca e filtri, comunicazioni dei rappresentanti, idee più votate.
- **Idee**: gli studenti propongono iniziative e le sostengono con un voto. Quando un'idea raggiunge la soglia (`SOGLIA_IDEE`) compare "Pronta per l'assemblea"; gli admin possono segnarla come "Portata in assemblea".
- **Appunti**: foto + spiegazione, voti positivi/negativi e commenti, come su Reddit. Filtro per materia e ordinamento.
- **Sondaggi**: ogni studente può crearne uno (da 2 a 5 opzioni) e votare; si può cambiare voto.
- **Libri**: annunci per regalare o vendere libri non più usati, con richiesta "Lo voglio". Sui prezzi si applica una piccola commissione (vedi sotto).
- **Profilo**: solo un esempio, senza funzioni. Raggiungibile cliccando sul nome in alto.

Nella barra inferiore (smartphone e iPad verticale) ci sono le cinque sezioni principali; su schermi grandi il menu sta in alto.

## Come provarlo

Aprire direttamente i file funziona, ma è meglio usare un piccolo server locale (il salvataggio dei dati tra una pagina e l'altra è più affidabile):

```bash
cd cartella-del-progetto
python3 -m http.server 8000
```

Poi visita `http://localhost:8000/`. Prima **registrati** con un'email che finisce con il dominio della scuola, poi accedi. Per provare i poteri da **admin**, registrati con una delle email in `LISTA_ADMIN` (in `auth.js`).

## Cosa modificare, e dove

**In `auth.js`** (oggetto `HUB` in cima al file):
- `DOMINIO_SCUOLA`: dominio delle email valide.
- `LISTA_ADMIN`: email degli amministratori.
- `PASSWORD_MIN`: lunghezza minima della password.
- `ANNI`: scelte del menu "Anno" nella registrazione.

**In `bacheca.html`** (sezione "1. IMPOSTAZIONI" del `<script>`):
- `SOGLIA_IDEE`: sostegni necessari perché un'idea vada in assemblea (ora 30).
- `COMMISSIONE_PERCENTUALE`: commissione sui libri a pagamento (ora 2%; `0` per toglierla).
- `MAX_OPZIONI_SONDAGGIO`: massimo di opzioni per sondaggio.
- `MATERIE`, `CLASSI`, `CONDIZIONI`, `CATEGORIE_EVENTI`: elenchi che compaiono nei menu e nei filtri.

**Grafica**: in cima a ogni `<style>` c'è il blocco `:root` con colori e font. Cambiando quei valori cambia tutto il sito (i tre file HTML hanno gli stessi valori: vanno cambiati in tutti e tre).

**Contenuti di esempio**: eventi, sondaggi, idee, appunti e libri demo stanno in `creaDatiIniziali()` in `bacheca.html`. Le "Comunicazioni dei rappresentanti" sono scritte a mano nell'HTML della sezione Bacheca.

## Dove sono salvati i dati (importante)

Per ora tutto è salvato **nel browser di chi usa la pagina** (`localStorage`), non su un server. Vale anche per gli account: la password non viene salvata in chiaro (solo la sua impronta), ma un account creato su un dispositivo non esiste sugli altri.
- ognuno vede solo i propri dati e i contenuti demo; i contenuti creati da uno studente non arrivano agli altri;
- i conteggi (voti, partecipanti, richieste) non sono condivisi;
- le foto degli appunti vengono ridotte e salvate nel browser (la memoria è limitata, circa 5 MB).

Per ripartire dai dati demo apri la console del browser (F12) e scrivi `resetDemo()`. Per far ripartire tutti dopo una modifica ai dati demo, cambia `CHIAVE_DB` (es. `"hubDB_v2"`).

## Cosa manca per la versione vera

1. **Server e database**: per condividere contenuti e voti tra studenti. Nel codice, i punti da sostituire sono `caricaDB()`/`salvaDB()` e le funzioni in `AZIONI` e `FORM`.
2. **Login sicuro**: ora chiunque può registrarsi scrivendo un'email con il dominio giusto senza dimostrare di possederla, e la lista admin è leggibile da chiunque. Servono la **verifica dell'email** (link di conferma), il controllo del dominio anche lato server, i ruoli nel database e la protezione della bacheca lato server. Per la password dimenticata serve un'email di recupero.
3. **Moderazione**: segnalazione dei contenuti, regole di pubblicazione e un modo per rimuovere abusi (oggi gli admin possono solo eliminare).
4. **Libri: contatto e pagamenti**: "Lo voglio" per ora registra solo la richiesta. Mancano messaggi tra studenti e un sistema di pagamento. La commissione oggi è solo un **calcolo mostrato a schermo**: nessun denaro passa dalla piattaforma.
5. **Foto**: con un server andranno caricate su uno spazio di archiviazione, non salvate nel browser.
6. **Privacy**: gli utenti sono in gran parte minorenni. Prima di raccogliere dati veri conviene concordare con la scuola informativa privacy, chi è responsabile dei dati e le regole d'uso.
7. **Notifiche** (nuovi eventi, richieste sui libri, idee arrivate in soglia) e sezione **Profilo** vera.

## Nota sulla commissione sui libri

Se la piattaforma trattiene davvero una percentuale su vendite tra studenti, si entra nel campo dei pagamenti, delle responsabilità e (per i minorenni) delle regole sui contratti e sul denaro. Prima di attivarla è consigliabile parlarne con la scuola e verificare cosa è consentito. Nel frattempo si può lasciare `COMMISSIONE_PERCENTUALE = 0` o usare solo i regali.

## Struttura interna di `bacheca.html` (per orientarsi)

Nel `<script>` di `bacheca.html` le sezioni sono numerate:

1. Impostazioni · 2. Funzioni di utilità (`esc()` protegge i testi degli utenti: usarla sempre) · 3. Utente · 4. Dati (`DB`) · 5. Commissione libri · 6. Disegno delle sezioni (`render...()`) · 7. Navigazione tra sezioni · 8. Azioni dei pulsanti (`AZIONI`) · 9. Moduli (`FORM`) · 10. Avvio.

Ogni pulsante ha un attributo `data-azione="nome"`; la funzione con lo stesso nome in `AZIONI` dice cosa succede. Per aggiungere una funzione: scrivi il pulsante nell'HTML generato da `render...()` e aggiungi la voce in `AZIONI`.

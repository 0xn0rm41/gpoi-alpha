STUDENT HUB — ANALISI E RICERCA DI MERCATO
Studio strategico e validazione della piattaforma digitale per la comunità studentesca dell'ISISS Valle Seriana.
Questo documento raccoglie la ricerca di mercato, i framework operativi e i processi metodologici utilizzati per analizzare i bisogni degli studenti, validare le funzionalità del progetto e pianificare lo sviluppo di Student Hub in modo basato sui dati reali della comunità scolastica.
INDICE
• Obiettivi della ricerca
• Framework operativi
• Sfide del contesto scolastico
• Il Processo di validazione
• Strumenti digitali
• Stato dell'analisi
OBIETTIVI DELLA RICERCA
La ricerca di mercato all'interno di Student Hub non segue logiche commerciali aziendali, ma punta a comprendere a fondo le dinamiche interne all'istituto per:
• Identificare i bisogni reali: comprendere quali strumenti (mercatino, appunti, eventi) mancano maggiormente agli studenti.
• Ridurre la frammentazione: studiare come sostituire i gruppi chat generalisti con moduli web strutturati.
• Validare l'interesse: testare le funzionalità prima di scriverne il codice, riducendo gli sforzi di sviluppo inutili.
• Garantire l'inclusione: mappare le barriere tecnologiche o generazionali all'interno delle diverse classi e indirizzi.
FRAMEWORK OPERATIVI
Il progetto si basa sui principali modelli accademici di analisi del comportamento utente, adattati alla vita scolastica dell'istituto:
• JTBD (Jobs to Be Done): non analizziamo solo l'utente, ma il "lavoro" che lo studente vuole portare a termine, ad esempio trovare il libro della classe terza al miglior prezzo possibile.
• SWOT Analysis: studio dei punti di forza interni come la community open source e delle minacce esterne come la resistenza al cambiamento o la privacy dei minori.
• Market Segmentation: suddivisione della scuola in target specifici come gli studenti del biennio, del triennio, i rappresentanti d'istituto e i docenti.
• Design Thinking: approccio iterativo basato sull'empatia con gli studenti e sulla prototipazione rapida delle interfacce grafiche.
Per approfondire la teoria e i modelli applicati, consulta i documenti dedicati nella cartella docs/analisi_mercato/.
SFIDE DEL CONTESTO SCOLASTICO
La ricerca e la raccolta dati all'interno dell'ISISS Valle Seriana presentano sfide metodologiche specifiche:
1. Bias del campione digitale: gli studenti più attivi online rispondono più facilmente ai sondaggi, rischiando di isolare le necessità di chi usa meno lo smartphone.
2. Privacy e protezione dei dati: la presenza di una vasta platea di studenti minorenni impone restrizioni severe nella raccolta di feedback e nel tracciamento analitico in piena conformità con il GDPR.
3. Velocità Vs Profondità: bilanciare la necessità di lanciare rapidamente i moduli software con l'accuratezza dei test di usabilità sul campo.
IL PROCESSO
Il ciclo di vita della piattaforma viene guidato da un processo strutturato in 5 fasi consecutive, che collegano la teoria iniziale al monitoraggio post-rilascio:
Discovery -> Validazione -> Sviluppo e Test -> Lancio -> Iterazione
Fase 1 — Discovery
• Obiettivo: capire se esiste il problema e quali frizioni vivono gli studenti nella quotidianità.
• Attività: interviste qualitative individuali, analisi delle community e dei gruppi di classe attuali, monitoraggio dei trend interni.
Fase 2 — Validazione
• Obiettivo: testare l'interesse verso una funzionalità prima di implementarla nel codice.
• Attività: sondaggi di concept testing tramite moduli interni e tecniche di Fake Door Test, per esempio misurando i clic su un finto pulsante del Marketplace per calcolarne la richiesta reale prima dello sviluppo.
Fase 3 — Sviluppo e Testing
• Obiettivo: validare l'esperienza d'uso sulla versione beta dell'applicazione.
• Attività: test di usabilità coordinati con piccoli gruppi di studenti (early adopters) e analisi comportamentale per identificare i punti di intoppo nelle schermate.
Fase 4 — Lancio e Monitoraggio
• Obiettivo: rilasciare la piattaforma all'istituto e misurarne l'adozione biologica.
• Attività: analisi del funnel di registrazione e monitoraggio dei feedback scritti o delle segnalazioni degli utenti.
Fase 5 — Iterazione e Scaling
• Obiettivo: migliorare continuamente Student Hub e valutare l'esportabilità del modello in altre scuole.
• Attività: prioritizzazione delle funzionalità nel backlog tecnico in base all'uso reale e studio della modularità per altre comunità scolastiche.
STRUMENTI DIGITALI
Ogni fase del processo di ricerca si appoggia a una suite selezionata di strumenti per la raccolta e l'analisi dei dati:
• Fase di Discovery: si usano Google Trends, analisi dei forum e interviste remote per misurare la domanda latente, i bisogni degli studenti e le parole chiave.
• Fase di Validazione: si usano Google Forms, Typeform e landing pages di test per misurare l'interesse reale, le intenzioni d'uso e i tassi di conversione.
• Fase di Testing: si usano Matomo o GA4 in modalità anonimizzata, Hotjar e usability test per misurare le performance tecniche, i blocchi di usabilità e i flussi di navigazione.
• Fase di Lancio: si usano sistemi di feedback integrati e i canali di comunicazione scolastici per misurare il sentiment degli utenti, il passaparola e i bug segnalati.
• Fase di Iterazione: si usano dashboard analitiche, SQL e strumenti di Project Management per misurare il tasso di ritorno (Retention), l'abbandono (Churn) e l'engagement globale.
STATO DELL'ANALISI
Status: Research e Validation Phase
La ricerca di mercato iniziale è in corso parallelamente alla definizione dei requisiti tecnici della Phase 1 del codice. I dati raccolti influenzeranno direttamente lo sviluppo dei moduli dell'architettura concettuale.
Student Hub — Analytics e Strategy
Data-driven development for our community.

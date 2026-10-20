
Analisi dei Framework Operativi per Student Hub

v1.0.0 — 20-10-2026
Per lo sviluppo di Student Hub, non è sufficiente scrivere codice: è fondamentale mappare i bisogni degli studenti dell'ISISS Valle Seriana e validare le funzionalità prima del rilascio. Di seguito sono riportati i framework operativi più utili per guidare la ricerca, il design e lo sviluppo del progetto.

Framework	Area di analisi	Applicazione in Student Hub
PESTEL	Macro-ambiente scolastico e legale	Analisi delle normative sulla privacy per i minorenni (GDPR), dell'infrastruttura tecnologica della scuola e dell'adozione dei dispositivi digitali tra gli studenti.
Design Thinking	UX/UI e Bisogni della Comunità	Focalizzato sull'empatia con gli studenti per capire come cercano gli appunti o quali difficoltà incontrano nello scambiare i libri usati.
Lean Startup	Validazione e Sviluppo Iterativo	Focalizzato sul rilascio di un MVP (Minimum Viable Product) (es. partendo dal solo modulo Materials) per misurare l'adozione prima di sviluppare le altre funzioni.
BCP 3.0	Validazione Rapida a Basso Costo	Ideale per il team di studenti sviluppatori (risorse limitate), utilizzando sondaggi interni e AI per accelerare lo sviluppo.

Design Thinking

Il Design Thinking è un approccio centrato sull'utente (in questo caso, lo studente). Aiuta il team a non dare per scontate le dinamiche scolastiche e si articola nelle sue 5 fasi classiche:
• Empathize (Empatia): Intervistare gli studenti delle diverse classi e indirizzi per capire come gestiscono oggi il passaggio di appunti e la compravendita dei libri (es. tramite caotiche chat di classe).
• Define (Definizione): Isolare i problemi principali (es. "Gli studenti non trovano i riassunti degli anni precedenti perché si perdono nella cronologia delle chat").
• Ideate (Ideazione): Progettare la struttura dei filtri (materia, classe, anno scolastico) della biblioteca digitale.
• Prototype (Prototipazione): Creare mockup o prototipi Figma a bassa fedeltà dell'interfaccia del Marketplace e dei Sondaggi.
• Test (Validazione): Far testare i prototipi a un piccolo gruppo di rappresentanti degli studenti prima di scrivere il codice.

Lean Startup

La metodologia Lean Startup serve a evitare di investire mesi di sviluppo in funzionalità che la comunità scolastica potrebbe non usare. Il cuore del framework applicato a Student Hub è il ciclo Build-Measure-Learn (Costruisci - Misura - Apprendi):
• Minimum Viable Product (MVP): Invece di lanciare la piattaforma con tutti e 5 i moduli attivi, la Phase 1 e 2 della Roadmap dovrebbero concentrarsi sul rilasciare unicamente la funzione Materials (la più urgente).
• Fake Door Test: Prima di programmare l'intero sistema di messaggistica interna per il Marketplace, inserire un semplice pulsante "Contatta il venditore su WhatsApp/Telegram" per verificare se gli utenti scambiano effettivamente i libri.
• Misurazione del Product-Market Fit (PMF): Utilizzare la metrica cardine del progetto: la percentuale di studenti dell'istituto che utilizza la piattaforma almeno una volta al mese. Se supera il 40%, la funzionalità è validata.

Business Concept Proofing 3.0 (BCP)

Questo framework è perfetto per Student Hub perché è pensato specificamente per piccoli team con risorse limitate (come un gruppo di studenti che sviluppa in modo indipendente e open source).
Caratteristiche distintive per il progetto:
• Validazione Digitale Interna: Utilizzo dei moduli interni di Sondaggi e Idee/Proposte per raccogliere feedback continui direttamente dalla base utenti.
• Sviluppo Agile e Open Source: Consente di allineare i cicli di validazione con il flusso delle Pull Request e delle Code Review descritto nel file README, assicurando che ogni nuova funzione risponda a un reale bisogno della scuola prima del merge nel branch principale.

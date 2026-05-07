# CC-Viewer

Un toolkit di Vibe Coding distillato dalla propria esperienza di sviluppo, costruito su Claude Code:

1. Aumentare il limite delle capacità: esegui /ultraPlan e /ultraReview localmente, così il codice del tuo progetto non deve mai essere completamente esposto al cloud di Claude;
2. Compatibilità multipiattaforma: consente la programmazione mobile (all'interno della LAN); la versione web si adatta a vari scenari, facile da incorporare in estensioni del browser e visualizzazioni divise del sistema operativo, e fornisce un installer nativo;
3. Logging completo: offre funzionalità complete di intercettazione e analisi del payload di Claude Code, ideale per logging, analisi dei problemi, apprendimento, ispirazione e reverse engineering;
4. Condivisione di apprendimento ed esperienza: sono stati accumulati numerosi materiali di studio ed esperienze di sviluppo (vedi le icone "?" in tutto il sistema);
5. Esperienza nativa preservata: estende solo le capacità di Claude Code, senza modifiche sostanziali al kernel, preservando l'esperienza nativa;
6. Supporta modelli di terze parti: compatibile con deepseek-v4-*, GLM 5.1, Kimi K2.6, con la capacità cc-switch incorporata per il passaggio a caldo tra strumenti di terze parti in qualsiasi momento.

[English](../README.md) | [简体中文](./README.zh.md) | [繁體中文](./README.zh-TW.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [Deutsch](./README.de.md) | [Español](./README.es.md) | [Français](./README.fr.md) | Italiano | [Dansk](./README.da.md) | [Polski](./README.pl.md) | [Русский](./README.ru.md) | [العربية](./README.ar.md) | [Norsk](./README.no.md) | [Português (Brasil)](./README.pt-BR.md) | [ไทย](./README.th.md) | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)

## Utilizzo

### Prerequisiti

- Assicurati di avere installato Node.js 22.0.0+; [Scarica e installa](https://nodejs.org)
- Assicurati di avere installato Claude Code; [Tutorial di installazione](https://github.com/anthropics/claude-code)

### Installa ccv

#### Installazione tramite npm

```bash
npm install -g cc-viewer --registry=https://registry.npmjs.org
```

#### Installazione tramite Homebrew (consigliato per macOS / Linux)

```bash
brew tap weiesky/cc-viewer
brew install cc-viewer
brew upgrade cc-viewer   # per gli aggiornamenti — NON usare npm install -g per le installazioni brew
```

### Avvio

ccv è un sostituto diretto per claude — tutti gli argomenti vengono passati a claude mentre viene avviato il Web Viewer.

```bash
ccv                    # == claude (interactive mode)
```

Il comando PIÙ utilizzato dall'autore è:
```
ccv -c --d             # == claude --continue --dangerously-skip-permissions
                       # ccv passa tutti i parametri di avvio di Claude Code — puoi combinarli come preferisci
```

Dopo l'avvio in modalità programmazione, si aprirà automaticamente una pagina web.

CC-Viewer viene anche distribuito come app desktop nativa: [Pagina di download](https://github.com/weiesky/cc-viewer/releases)


### Modalità Logger

Se preferisci ancora lo strumento nativo claude o l'estensione VS Code, usa questa modalità.

In questa modalità, l'avvio di `claude` avvierà automaticamente un processo di logging che registra i log delle richieste in ~/.claude/cc-viewer/*yourproject*/date.jsonl

Abilita la modalità logger:
```bash
ccv -logger
```

Quando la console non può stampare la porta specifica, la prima porta predefinita è 127.0.0.1:7008. Le istanze multiple utilizzano porte sequenziali come 7009, 7010.

Disinstalla la modalità logger:
```bash
ccv --uninstall
```

### Risoluzione dei problemi

Se riscontri problemi nell'avvio di cc-viewer, ecco l'approccio definitivo alla risoluzione dei problemi:

Passo 1: Apri Claude Code in qualsiasi directory.

Passo 2: Dai a Claude Code la seguente istruzione:

```
I have installed the cc-viewer npm package, but after running ccv it still doesn't work properly. Please check cc-viewer's cli.js and findcc.js, and adapt them to the local Claude Code deployment based on the specific environment. Keep the scope of changes as constrained as possible within findcc.js.
```

Lasciare che Claude Code diagnostichi il problema da solo è più efficace che chiedere a chiunque o leggere qualsiasi documentazione!

Dopo il completamento dell'istruzione sopra, `findcc.js` verrà aggiornato. Se il tuo progetto richiede frequentemente il deployment locale, o se il codice forkato spesso deve risolvere problemi di installazione, mantenere questo file ti consente di copiarlo semplicemente la prossima volta. In questa fase, molti progetti e aziende che utilizzano Claude Code non stanno eseguendo il deployment su Mac ma piuttosto su ambienti ospitati lato server, quindi l'autore ha separato `findcc.js` per rendere più facile tracciare gli aggiornamenti del codice sorgente di cc-viewer in futuro.


### Altri comandi

Vedere:

```bash
ccv -h
```

### Modalità silenziosa

Per impostazione predefinita, `ccv` viene eseguito in modalità silenziosa quando avvolge `claude`, mantenendo l'output del terminale pulito e coerente con l'esperienza nativa. Tutti i log vengono catturati in background e possono essere visualizzati su `http://localhost:7008`.

Una volta configurato, usa il comando `claude` normalmente. Visita `http://localhost:7008` per accedere all'interfaccia di monitoraggio.


## Funzionalità


### Modalità Programmazione

Dopo l'avvio con ccv, puoi vedere:

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/ab353a2b-f101-409d-a28c-6a4e41571ea2" />


Puoi visualizzare le differenze di codice direttamente dopo la modifica:

<img width="1500" height="728" alt="image" src="https://github.com/user-attachments/assets/2a4acdaa-fc5f-4dc0-9e5f-f3273f0849b2" />

Sebbene tu possa aprire file e codice manualmente, la codifica manuale non è consigliata — è codifica vecchio stile!

### Programmazione mobile

Puoi persino scansionare un codice QR per programmare dal tuo dispositivo mobile:

<img width="3018" height="1460" alt="image" src="https://github.com/user-attachments/assets/8debf48e-daec-420c-b37a-609f8b81cd20" />
<img width="1700" height="790" alt="image" src="https://github.com/user-attachments/assets/da3e519f-ff66-4cd2-81d1-f4e131215f6c" />

Soddisfa la tua immaginazione della programmazione mobile. C'è anche un meccanismo di plugin — se hai bisogno di personalizzare per le tue abitudini di codifica, resta sintonizzato per gli aggiornamenti degli hook dei plugin.


### Modalità Logger (Visualizza sessioni complete di Claude Code)

<img width="1500" height="768" alt="image" src="https://github.com/user-attachments/assets/a8a9f3f7-d876-4f6b-a64d-f323a05c4d21" />


- Cattura tutte le richieste API da Claude Code in tempo reale, garantendo testo grezzo — non log oscurati (questo è importante!!!)
- Identifica e etichetta automaticamente le richieste Main Agent e Sub Agent (sottotipi: Plan, Search, Bash)
- Le richieste MainAgent supportano Body Diff JSON, mostrando differenze compresse dalla richiesta MainAgent precedente (solo campi modificati/nuovi)
- Ogni richiesta mostra statistiche di utilizzo Token in linea (token input/output, creazione/lettura cache, tasso di hit)
- Compatibile con Claude Code Router (CCR) e altri scenari proxy — ricade sul pattern matching del percorso API

### Modalità Conversazione

Fai clic sul pulsante "Conversation Mode" nell'angolo in alto a destra per analizzare la cronologia completa delle conversazioni del Main Agent in un'interfaccia di chat:

<img width="1500" height="764" alt="image" src="https://github.com/user-attachments/assets/725b57c8-6128-4225-b157-7dba2738b1c6" />

- La visualizzazione Agent Team non è ancora supportata
- I messaggi dell'utente sono allineati a destra (bolle blu), le risposte del Main Agent sono allineate a sinistra (bolle scure)
- I blocchi `thinking` sono compressi per impostazione predefinita, renderizzati come Markdown — fai clic per espandere e visualizzare il processo di pensiero; è supportata la traduzione con un clic (la funzionalità è ancora instabile)
- I messaggi di selezione dell'utente (AskUserQuestion) vengono visualizzati in formato Q&A
- Sincronizzazione bidirezionale della modalità: il passaggio alla modalità conversazione scorre automaticamente alla conversazione corrispondente alla richiesta selezionata; il ritorno alla modalità raw scorre automaticamente alla richiesta selezionata
- Pannello delle impostazioni: alterna lo stato di compressione predefinito per i risultati degli strumenti e i blocchi thinking
- Navigazione mobile delle conversazioni: in modalità CLI mobile, tocca il pulsante "Conversation Browse" nella barra superiore per far scorrere una vista di conversazione in sola lettura per navigare nella cronologia completa delle conversazioni su mobile

### Gestione dei log

Tramite il menu a discesa CC-Viewer nell'angolo in alto a sinistra:

<img width="1500" height="760" alt="image" src="https://github.com/user-attachments/assets/33295e2b-f2e0-4968-a6f1-6f3d1404454e" />

**Compressione dei log**
Per quanto riguarda i log, l'autore desidera chiarire che le definizioni ufficiali di Anthropic non sono state modificate, garantendo l'integrità dei log. Tuttavia, poiché le singole voci di log del modello 1M Opus possono diventare estremamente grandi nelle fasi successive, grazie ad alcune ottimizzazioni dei log per MainAgent, si ottiene almeno una riduzione del 66% delle dimensioni senza gzip. Il metodo di parsing per questi log compressi può essere estratto dal repository corrente.

### Più funzionalità utili

<img width="1500" height="767" alt="image" src="https://github.com/user-attachments/assets/add558c5-9c4d-468a-ac6f-d8d64759fdbd" />

Puoi localizzare rapidamente i tuoi prompt utilizzando gli strumenti della barra laterale.

--- 

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/82b8eb67-82f5-41b1-89d6-341c95a047ed" />

L'interessante funzionalità KV-Cache-Text ti permette di vedere esattamente ciò che vede Claude.

---

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/54cdfa4e-677c-4aed-a5bb-5fd946600c46" />

Puoi caricare immagini e descrivere le tue esigenze — la comprensione delle immagini di Claude è incredibilmente potente. E come sai, puoi incollare immagini direttamente con Ctrl+V, e il tuo contenuto completo verrà visualizzato nella conversazione.

---

<img width="600" height="370" alt="image" src="https://github.com/user-attachments/assets/87d332ea-3e34-4957-b442-f9d070211fbf" />

Puoi personalizzare i plugin, gestire tutti i processi CC-Viewer, e CC-Viewer supporta il passaggio a caldo a API di terze parti (sì, puoi usare GLM, Kimi, MiniMax, Qwen, DeepSeek — sebbene l'autore li consideri tutti piuttosto deboli a questo punto).

---

<img width="1500" height="746" alt="image" src="https://github.com/user-attachments/assets/b1f60c7c-1438-4ecc-8c64-193d21ee3445" />

Altre funzionalità in attesa di essere scoperte... Ad esempio: il sistema supporta Agent Team e ha un Code Reviewer integrato. L'integrazione di Codex Code Reviewer arriverà presto (l'autore raccomanda vivamente di utilizzare Codex per rivedere il codice di Claude Code).

## Licenza

MIT

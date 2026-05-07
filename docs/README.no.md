# CC-Viewer

Et Vibe Coding-verktøysett destillert fra praktisk utviklingserfaring, bygget på toppen av Claude Code:

1. Hev kapasitetstaket — kjør /ultraPlan og /ultraReview lokalt, slik at prosjektkoden din aldri trenger å være fullt eksponert for Claudes sky;
2. Multi-enhet-tilpasning — kod fra mobile enheter over ditt lokale nettverk, web-versjonen tilpasser seg alle scenarier for innebygging i nettleserutvidelser eller delt skjerm i operativsystemet, og en innebygd installasjonspakke er også tilgjengelig;
3. Komplett revisjonsspor — full avskjæring og analyse av Claude Codes nyttelast, perfekt for logging, feilsøking, læring og reversing;
4. Kunnskapsdeling — leveres med akkumulerte studienotater og praktisk erfaring (se etter "?"-ikonene rundt om i appen);
5. Innebygd opplevelse bevart — utvider kun Claude Codes muligheter uten noen vesentlige endringer i kjernen, slik at den innebygde opplevelsen forblir intakt;
6. Tredjeparts modellstøtte — fungerer med deepseek-v4-*, GLM 5.1, Kimi K2.6, med innebygd cc-switch-funksjonalitet for hot-swapping av tredjepartsverktøy når som helst.

[English](../README.md) | [简体中文](./README.zh.md) | [繁體中文](./README.zh-TW.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [Deutsch](./README.de.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [Italiano](./README.it.md) | [Dansk](./README.da.md) | [Polski](./README.pl.md) | [Русский](./README.ru.md) | [العربية](./README.ar.md) | Norsk | [Português (Brasil)](./README.pt-BR.md) | [ไทย](./README.th.md) | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)

## Bruk

### Forutsetninger

- Sørg for at Node.js 22.0.0+ er installert; [last ned og installer](https://nodejs.org)
- Sørg for at Claude Code er installert; [installasjonsveiledning](https://github.com/anthropics/claude-code)

### Installer ccv

#### Installer via npm

```bash
npm install -g cc-viewer --registry=https://registry.npmjs.org
```

#### Installer via Homebrew (anbefales for macOS / Linux)

```bash
brew tap weiesky/cc-viewer
brew install cc-viewer
brew upgrade cc-viewer   # for oppdateringer — ikke bruk npm install -g for brew-installasjoner
```

### Oppstart

ccv er en direkte erstatter for claude — alle argumenter sendes videre til claude mens Web Viewer startes.

```bash
ccv                    # == claude (interactive mode)
```

Forfatterens MEST brukte kommando er:
```
ccv -c --d             # == claude --continue --dangerously-skip-permissions
                       # ccv sender videre alle Claude Code oppstartsargumenter — kombiner dem akkurat som du vil
```

Etter start i programmeringsmodus åpnes en nettside automatisk.

CC-Viewer leveres også som en innebygd skrivebordsapp: [Nedlastingsside](https://github.com/weiesky/cc-viewer/releases)


### Logger-modus

Hvis du fremdeles foretrekker det innebygde claude-verktøyet eller VS Code-utvidelsen, bruk denne modusen.

I denne modusen vil start av `claude` automatisk starte en loggeprosess som registrerer forespørselslogger til ~/.claude/cc-viewer/*yourproject*/date.jsonl

Aktiver logger-modus:
```bash
ccv -logger
```

Når konsollen ikke kan skrive ut den spesifikke porten, er standard første port 127.0.0.1:7008. Flere instanser bruker sekvensielle porter som 7009, 7010.

Avinstaller logger-modus:
```bash
ccv --uninstall
```

### Feilsøking

Hvis du støter på problemer med å starte cc-viewer, er her den ultimate feilsøkingstilnærmingen:

Steg 1: Åpne Claude Code i hvilken som helst mappe.

Steg 2: Gi Claude Code følgende instruksjon:

```
I have installed the cc-viewer npm package, but after running ccv it still doesn't work properly. Please check cc-viewer's cli.js and findcc.js, and adapt them to the local Claude Code deployment based on the specific environment. Keep the scope of changes as constrained as possible within findcc.js.
```

Å la Claude Code diagnostisere problemet selv er mer effektivt enn å spørre noen eller lese dokumentasjon!

Etter at instruksjonen ovenfor er fullført, vil `findcc.js` bli oppdatert. Hvis prosjektet ditt ofte krever lokal utrulling, eller hvis forket kode ofte trenger å løse installasjonsproblemer, lar det å beholde denne filen deg ganske enkelt kopiere den neste gang. På dette stadiet distribuerer mange prosjekter og selskaper som bruker Claude Code ikke på Mac, men snarere på serverside-vertsbaserte miljøer, så forfatteren har separert `findcc.js` for å gjøre det enklere å spore cc-viewer-kildekodeoppdateringer fremover.


### Andre kommandoer

Se:

```bash
ccv -h
```

### Stille modus

Som standard kjører `ccv` i stille modus når den pakker `claude`, og holder terminalutdataene rene og konsistente med den innebygde opplevelsen. Alle logger fanges opp i bakgrunnen og kan vises på `http://localhost:7008`.

Når konfigurert, bruk `claude`-kommandoen som vanlig. Besøk `http://localhost:7008` for å få tilgang til overvåkingsgrensesnittet.


## Funksjoner


### Programmeringsmodus

Etter start med ccv kan du se:

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/ab353a2b-f101-409d-a28c-6a4e41571ea2" />


Du kan vise kodediffs direkte etter redigering:

<img width="1500" height="728" alt="image" src="https://github.com/user-attachments/assets/2a4acdaa-fc5f-4dc0-9e5f-f3273f0849b2" />

Selv om du kan åpne filer og kode manuelt, anbefales ikke manuell koding — det er koding fra den gamle skolen!

### Mobilprogrammering

Du kan til og med skanne en QR-kode for å kode fra mobilenheten din:

<img width="3018" height="1460" alt="image" src="https://github.com/user-attachments/assets/8debf48e-daec-420c-b37a-609f8b81cd20" />
<img width="1700" height="790" alt="image" src="https://github.com/user-attachments/assets/da3e519f-ff66-4cd2-81d1-f4e131215f6c" />

Oppfyll fantasien din om mobilprogrammering. Det finnes også en plugin-mekanisme — hvis du trenger å tilpasse for kodevanene dine, følg med på oppdateringer av plugin-kroker.


### Logger-modus (vis komplette Claude Code-økter)

<img width="1500" height="768" alt="image" src="https://github.com/user-attachments/assets/a8a9f3f7-d876-4f6b-a64d-f323a05c4d21" />


- Fanger opp alle API-forespørsler fra Claude Code i sanntid, og sikrer rå tekst — ikke redigerte logger (dette er viktig!!!)
- Identifiserer og merker automatisk Main Agent- og Sub Agent-forespørsler (undertyper: Plan, Search, Bash)
- MainAgent-forespørsler støtter Body Diff JSON, og viser sammenklappede forskjeller fra den forrige MainAgent-forespørselen (kun endrede/nye felt)
- Hver forespørsel viser innlinje Token-bruksstatistikk (input/output-tokens, cache-opprettelse/lesing, treffrate)
- Kompatibel med Claude Code Router (CCR) og andre proxy-scenarier — faller tilbake til mønstermatching av API-sti

### Samtalemodus

Klikk på "Conversation Mode"-knappen øverst til høyre for å parse Main Agents komplette samtalehistorikk til et chatgrensesnitt:

<img width="1500" height="764" alt="image" src="https://github.com/user-attachments/assets/725b57c8-6128-4225-b157-7dba2738b1c6" />

- Agent Team-visning støttes ikke ennå
- Brukermeldinger er høyrejustert (blå bobler), Main Agent-svar er venstrejustert (mørke bobler)
- `thinking`-blokker er sammenklappet som standard, gjengitt som Markdown — klikk for å utvide og se tenkeprosessen; ett-klikks oversettelse støttes (funksjonen er fortsatt ustabil)
- Brukervalgmeldinger (AskUserQuestion) vises i Q&A-format
- Toveis modussynk: bytte til samtalemodus ruller automatisk til samtalen som tilsvarer den valgte forespørselen; bytte tilbake til rå modus ruller automatisk til den valgte forespørselen
- Innstillingspanel: veksle standard sammenklappingstilstand for verktøyresultater og thinking-blokker
- Mobilsamtalebrowsing: i mobil CLI-modus, trykk på "Conversation Browse"-knappen i topplinjen for å skyve ut en skrivebeskyttet samtalevisning for å bla gjennom den komplette samtalehistorikken på mobil

### Loggadministrasjon

Via CC-Viewer rullegardinmenyen øverst til venstre:

<img width="1500" height="760" alt="image" src="https://github.com/user-attachments/assets/33295e2b-f2e0-4968-a6f1-6f3d1404454e" />

**Loggkompresjon**
Når det gjelder logger, ønsker forfatteren å presisere at de offisielle Anthropic-definisjonene ikke er endret, noe som sikrer loggintegriteten. Men siden individuelle loggoppføringer fra 1M Opus-modellen kan bli ekstremt store i senere faser, takket være visse loggoptimaliseringer for MainAgent, oppnås minst 66% størrelsesreduksjon uten gzip. Parsingmetoden for disse komprimerte loggene kan hentes fra det nåværende repoet.

### Flere nyttige funksjoner

<img width="1500" height="767" alt="image" src="https://github.com/user-attachments/assets/add558c5-9c4d-468a-ac6f-d8d64759fdbd" />

Du kan raskt finne promptene dine ved hjelp av sidepanelets verktøy.

---

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/82b8eb67-82f5-41b1-89d6-341c95a047ed" />

Den interessante KV-Cache-Text-funksjonen lar deg se nøyaktig hva Claude ser.

---

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/54cdfa4e-677c-4aed-a5bb-5fd946600c46" />

Du kan laste opp bilder og beskrive behovene dine — Claudes bildeforståelse er utrolig kraftig. Og som du vet, kan du lime inn bilder direkte med Ctrl+V, og det komplette innholdet ditt vil vises i samtalen.

---

<img width="600" height="370" alt="image" src="https://github.com/user-attachments/assets/87d332ea-3e34-4957-b442-f9d070211fbf" />

Du kan tilpasse plugins, administrere alle CC-Viewer-prosesser, og CC-Viewer støtter hot-switching til tredjeparts API-er (ja, du kan bruke GLM, Kimi, MiniMax, Qwen, DeepSeek — selv om forfatteren anser dem alle som ganske svake på dette tidspunktet).

---

<img width="1500" height="746" alt="image" src="https://github.com/user-attachments/assets/b1f60c7c-1438-4ecc-8c64-193d21ee3445" />

Flere funksjoner venter på å bli oppdaget... For eksempel: systemet støtter Agent Team, og har en innebygd Code Reviewer. Codex Code Reviewer-integrasjon kommer snart (forfatteren anbefaler sterkt å bruke Codex til å vurdere Claude Codes kode).

## Lisens

MIT

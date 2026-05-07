# CC-Viewer

Zestaw narzędzi Vibe Coding wydestylowany z praktycznego doświadczenia w rozwoju oprogramowania, zbudowany na bazie Claude Code:

1. Wyższy pułap możliwości — uruchamiaj /ultraPlan i /ultraReview lokalnie, aby kod Twojego projektu nie musiał być w pełni eksponowany w chmurze Claude;
2. Adaptacja wieloplatformowa — umożliwia programowanie mobilne (w sieci lokalnej), wersja webowa dostosowuje się do różnych scenariuszy, łatwa do osadzenia w rozszerzeniach przeglądarki lub podzielonych widokach systemu operacyjnego, dostępny jest również natywny instalator;
3. Pełne zachowanie logów — kompletne przechwytywanie i analiza payloadu Claude Code, idealne do logowania, debugowania, nauki i inżynierii wstecznej;
4. Dzielenie się doświadczeniami — zgromadzono wiele materiałów edukacyjnych i doświadczenia w rozwoju (szukaj ikon „?" w całej aplikacji);
5. Zachowane natywne doświadczenie — jedynie rozszerza możliwości Claude Code bez istotnych modyfikacji jądra, zachowując natywne doświadczenie;
6. Wsparcie dla modeli zewnętrznych — kompatybilny z deepseek-v4-*, GLM 5.1, Kimi K2.6, wbudowana funkcjonalność cc-switch pozwala na bieżące przełączanie narzędzi zewnętrznych.

[English](../README.md) | [简体中文](./README.zh.md) | [繁體中文](./README.zh-TW.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [Deutsch](./README.de.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [Italiano](./README.it.md) | [Dansk](./README.da.md) | Polski | [Русский](./README.ru.md) | [العربية](./README.ar.md) | [Norsk](./README.no.md) | [Português (Brasil)](./README.pt-BR.md) | [ไทย](./README.th.md) | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)

## Użytkowanie

### Wymagania wstępne

- Upewnij się, że zainstalowany jest Node.js 22.0.0+; [Pobierz](https://nodejs.org)
- Upewnij się, że zainstalowany jest Claude Code; [Instrukcja instalacji](https://github.com/anthropics/claude-code)

### Instalacja ccv

#### Instalacja przez npm

```bash
npm install -g cc-viewer --registry=https://registry.npmjs.org
```

#### Instalacja przez Homebrew (zalecane dla macOS / Linux)

```bash
brew tap weiesky/cc-viewer
brew install cc-viewer
brew upgrade cc-viewer   # do aktualizacji — NIE używaj npm install -g dla instalacji brew
```

### Uruchomienie

ccv to bezpośredni zamiennik claude — wszystkie argumenty są przekazywane do claude podczas uruchamiania Web Viewer.

```bash
ccv                    # == claude (interactive mode)
```

NAJCZĘŚCIEJ używane polecenie autora to:
```
ccv -c --d             # == claude --continue --dangerously-skip-permissions
                       # ccv przekazuje wszystkie argumenty uruchomieniowe Claude Code — łącz je dowolnie
```

Po uruchomieniu w trybie programowania automatycznie otworzy się strona internetowa.

CC-Viewer jest również dostępny jako natywna aplikacja desktopowa: [Strona pobierania](https://github.com/weiesky/cc-viewer/releases)


### Tryb Logger

Jeśli nadal preferujesz natywne narzędzie claude lub rozszerzenie VS Code, użyj tego trybu.

W tym trybie uruchomienie `claude` automatycznie uruchomi proces logowania, który zapisuje logi żądań do ~/.claude/cc-viewer/*yourproject*/date.jsonl

Włącz tryb logger:
```bash
ccv -logger
```

Gdy konsola nie może wydrukować konkretnego portu, domyślnym pierwszym portem jest 127.0.0.1:7008. Wiele instancji używa kolejnych portów, takich jak 7009, 7010.

Odinstaluj tryb logger:
```bash
ccv --uninstall
```

### Rozwiązywanie problemów

Jeśli napotkasz problemy z uruchomieniem cc-viewer, oto ostateczne podejście do rozwiązywania problemów:

Krok 1: Otwórz Claude Code w dowolnym katalogu.

Krok 2: Przekaż Claude Code następującą instrukcję:

```
I have installed the cc-viewer npm package, but after running ccv it still doesn't work properly. Please check cc-viewer's cli.js and findcc.js, and adapt them to the local Claude Code deployment based on the specific environment. Keep the scope of changes as constrained as possible within findcc.js.
```

Pozwolenie Claude Code na samodzielną diagnozę problemu jest skuteczniejsze niż pytanie kogokolwiek lub czytanie jakiejkolwiek dokumentacji!

Po wykonaniu powyższej instrukcji `findcc.js` zostanie zaktualizowany. Jeśli Twój projekt często wymaga lokalnego wdrożenia lub jeśli rozwidlony kod często musi rozwiązywać problemy z instalacją, zachowanie tego pliku pozwoli Ci po prostu skopiować go następnym razem. Na tym etapie wiele projektów i firm korzystających z Claude Code nie wdraża go na komputerach Mac, ale raczej w hostowanych środowiskach po stronie serwera, dlatego autor wydzielił `findcc.js`, aby ułatwić śledzenie aktualizacji kodu źródłowego cc-viewer w przyszłości.


### Inne polecenia

Zobacz:

```bash
ccv -h
```

### Tryb cichy

Domyślnie `ccv` działa w trybie cichym podczas opakowywania `claude`, utrzymując wyjście terminala w czystości i spójne z natywnym doświadczeniem. Wszystkie logi są przechwytywane w tle i można je przeglądać pod adresem `http://localhost:7008`.

Po skonfigurowaniu używaj polecenia `claude` jak zwykle. Odwiedź `http://localhost:7008`, aby uzyskać dostęp do interfejsu monitorowania.


## Funkcje


### Tryb programowania

Po uruchomieniu za pomocą ccv możesz zobaczyć:

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/ab353a2b-f101-409d-a28c-6a4e41571ea2" />


Możesz przeglądać różnice w kodzie bezpośrednio po edycji:

<img width="1500" height="728" alt="image" src="https://github.com/user-attachments/assets/2a4acdaa-fc5f-4dc0-9e5f-f3273f0849b2" />

Chociaż możesz otwierać pliki i kod ręcznie, ręczne kodowanie nie jest zalecane — to staromodne kodowanie!

### Programowanie mobilne

Możesz nawet zeskanować kod QR, aby kodować z urządzenia mobilnego:

<img width="3018" height="1460" alt="image" src="https://github.com/user-attachments/assets/8debf48e-daec-420c-b37a-609f8b81cd20" />
<img width="1700" height="790" alt="image" src="https://github.com/user-attachments/assets/da3e519f-ff66-4cd2-81d1-f4e131215f6c" />

Spełnij swoją wyobraźnię dotyczącą programowania mobilnego. Istnieje również mechanizm wtyczek — jeśli chcesz dostosować go do swoich nawyków kodowania, czekaj na aktualizacje hooków wtyczek.


### Tryb Logger (zobacz kompletne sesje Claude Code)

<img width="1500" height="768" alt="image" src="https://github.com/user-attachments/assets/a8a9f3f7-d876-4f6b-a64d-f323a05c4d21" />


- Przechwytuje wszystkie żądania API z Claude Code w czasie rzeczywistym, zapewniając surowy tekst — nie zredagowane logi (to jest ważne!!!)
- Automatycznie identyfikuje i oznacza żądania Main Agent i Sub Agent (podtypy: Plan, Search, Bash)
- Żądania MainAgent obsługują Body Diff JSON, pokazując zwinięte różnice od poprzedniego żądania MainAgent (tylko zmienione/nowe pola)
- Każde żądanie wyświetla inline statystyki użycia Token (tokeny wejściowe/wyjściowe, tworzenie/odczyt pamięci podręcznej, współczynnik trafień)
- Kompatybilny z Claude Code Router (CCR) i innymi scenariuszami proxy — powraca do dopasowywania wzorców ścieżek API

### Tryb konwersacji

Kliknij przycisk „Tryb konwersacji" w prawym górnym rogu, aby przeanalizować pełną historię konwersacji Main Agent w interfejs czatu:

<img width="1500" height="764" alt="image" src="https://github.com/user-attachments/assets/725b57c8-6128-4225-b157-7dba2738b1c6" />

- Wyświetlanie Agent Team nie jest jeszcze obsługiwane
- Wiadomości użytkownika są wyrównane do prawej (niebieskie dymki), odpowiedzi Main Agent są wyrównane do lewej (ciemne dymki)
- Bloki `thinking` są domyślnie zwinięte, renderowane jako Markdown — kliknij, aby rozwinąć i zobaczyć proces myślenia; obsługiwane jest tłumaczenie jednym kliknięciem (funkcja jest nadal niestabilna)
- Wiadomości wyboru użytkownika (AskUserQuestion) są wyświetlane w formacie Q&A
- Dwukierunkowa synchronizacja trybów: przełączenie na tryb konwersacji automatycznie przewija do konwersacji odpowiadającej wybranemu żądaniu; przełączenie z powrotem na tryb surowy automatycznie przewija do wybranego żądania
- Panel ustawień: przełącz domyślny stan zwinięcia dla wyników narzędzi i bloków thinking
- Przeglądanie konwersacji mobilnej: w mobilnym trybie CLI dotknij przycisku „Przeglądanie konwersacji" na górnym pasku, aby wysunąć widok konwersacji tylko do odczytu do przeglądania pełnej historii konwersacji na urządzeniu mobilnym

### Zarządzanie logami

Za pomocą menu rozwijanego CC-Viewer w lewym górnym rogu:

<img width="1500" height="760" alt="image" src="https://github.com/user-attachments/assets/33295e2b-f2e0-4968-a6f1-6f3d1404454e" />

**Kompresja logów**
Jeśli chodzi o logi, autor chce wyjaśnić, że oficjalne definicje Anthropic nie zostały zmodyfikowane, co zapewnia integralność logów. Jednakże, ponieważ pojedyncze wpisy logów z modelu 1M Opus mogą stać się niezwykle duże na późniejszych etapach, dzięki pewnym optymalizacjom logów dla MainAgent osiągnięto co najmniej 66% redukcji rozmiaru bez gzip. Metodę analizy tych skompresowanych logów można wyodrębnić z bieżącego repozytorium.

### Więcej przydatnych funkcji

<img width="1500" height="767" alt="image" src="https://github.com/user-attachments/assets/add558c5-9c4d-468a-ac6f-d8d64759fdbd" />

Możesz szybko zlokalizować swoje prompty, używając narzędzi paska bocznego.

--- 

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/82b8eb67-82f5-41b1-89d6-341c95a047ed" />

Interesująca funkcja KV-Cache-Text pozwala zobaczyć dokładnie to, co widzi Claude.

---

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/54cdfa4e-677c-4aed-a5bb-5fd946600c46" />

Możesz przesyłać obrazy i opisywać swoje potrzeby — rozumienie obrazów przez Claude jest niesamowicie potężne. I jak wiesz, możesz wklejać obrazy bezpośrednio za pomocą Ctrl+V, a Twoja pełna zawartość zostanie wyświetlona w konwersacji.

---

<img width="600" height="370" alt="image" src="https://github.com/user-attachments/assets/87d332ea-3e34-4957-b442-f9d070211fbf" />

Możesz dostosowywać wtyczki, zarządzać wszystkimi procesami CC-Viewer, a CC-Viewer obsługuje gorące przełączanie na API innych firm (tak, możesz używać GLM, Kimi, MiniMax, Qwen, DeepSeek — chociaż autor uważa je wszystkie za dość słabe w tym momencie).

---

<img width="1500" height="746" alt="image" src="https://github.com/user-attachments/assets/b1f60c7c-1438-4ecc-8c64-193d21ee3445" />

Więcej funkcji czeka na odkrycie... Na przykład: system obsługuje Agent Team i ma wbudowany Code Reviewer. Integracja Codex Code Reviewer pojawi się wkrótce (autor gorąco zaleca używanie Codex do przeglądu kodu Claude Code).

## Licencja

MIT

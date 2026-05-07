# CC-Viewer

Um kit de ferramentas de Vibe Coding destilado de experiência prática de desenvolvimento, construído sobre o Claude Code:

1. Eleve o teto de capacidade — execute /ultraPlan e /ultraReview localmente, para que o código do seu projeto nunca precise ser totalmente exposto à nuvem do Claude;
2. Adaptação multi-dispositivo — programe a partir de dispositivos móveis pela sua rede local, a versão web se adapta a todos os cenários para incorporação em extensões de navegador ou visualizações divididas do SO, e um instalador nativo também é fornecido;
3. Trilha de auditoria completa — interceptação e análise completas do payload do Claude Code, perfeito para registro, depuração, aprendizado e engenharia reversa;
4. Compartilhamento de conhecimento — vem com notas de estudo acumuladas e experiência prática (procure os ícones "?" ao longo do aplicativo);
5. Experiência nativa preservada — apenas amplia as capacidades do Claude Code sem nenhuma alteração substancial em seu núcleo, mantendo a experiência nativa intacta;
6. Suporte a modelos de terceiros — funciona com deepseek-v4-*, GLM 5.1, Kimi K2.6, com capacidade cc-switch integrada para troca a quente de ferramentas de terceiros a qualquer momento.

[English](../README.md) | [简体中文](./README.zh.md) | [繁體中文](./README.zh-TW.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [Deutsch](./README.de.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [Italiano](./README.it.md) | [Dansk](./README.da.md) | [Polski](./README.pl.md) | [Русский](./README.ru.md) | [العربية](./README.ar.md) | [Norsk](./README.no.md) | Português (Brasil) | [ไทย](./README.th.md) | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)

## Uso

### Pré-requisitos

- Certifique-se de que o Node.js 22.0.0+ está instalado; [download e instalação](https://nodejs.org)
- Certifique-se de que o Claude Code está instalado; [guia de instalação](https://github.com/anthropics/claude-code)

### Instalar ccv

#### Instalação via npm

```bash
npm install -g cc-viewer --registry=https://registry.npmjs.org
```

#### Instalação via Homebrew (recomendado para macOS / Linux)

```bash
brew tap weiesky/cc-viewer
brew install cc-viewer
brew upgrade cc-viewer   # para atualizações — NÃO use npm install -g para instalações brew
```

### Inicialização

ccv é um substituto direto para claude — todos os argumentos são repassados para claude ao iniciar o Web Viewer.

```bash
ccv                    # == claude (interactive mode)
```

O comando MAIS usado pelo autor é:
```
ccv -c --d             # == claude --continue --dangerously-skip-permissions
                       # ccv repassa todos os argumentos de inicialização do Claude Code — combine-os como quiser
```

Após iniciar no modo de programação, uma página Web será aberta automaticamente.

O CC-Viewer também é fornecido como um aplicativo desktop nativo: [Página de download](https://github.com/weiesky/cc-viewer/releases)


### Modo Logger

Se você ainda prefere a ferramenta nativa claude ou a extensão do VS Code, use este modo.

Neste modo, iniciar `claude` automaticamente inicia um processo de registro que grava logs de requisições em ~/.claude/cc-viewer/*yourproject*/date.jsonl

Ativar o modo logger:
```bash
ccv -logger
```

Quando o console não pode imprimir a porta específica, a primeira porta padrão é 127.0.0.1:7008. Múltiplas instâncias usam portas sequenciais como 7009, 7010.

Desinstalar o modo logger:
```bash
ccv --uninstall
```

### Solução de problemas

Se você encontrar problemas ao iniciar o cc-viewer, aqui está a abordagem definitiva para solução de problemas:

Passo 1: Abra o Claude Code em qualquer diretório.

Passo 2: Dê ao Claude Code a seguinte instrução:

```
I have installed the cc-viewer npm package, but after running ccv it still doesn't work properly. Please check cc-viewer's cli.js and findcc.js, and adapt them to the local Claude Code deployment based on the specific environment. Keep the scope of changes as constrained as possible within findcc.js.
```

Deixar o Claude Code diagnosticar o problema por si mesmo é mais eficaz do que perguntar a alguém ou ler qualquer documentação!

Após concluir a instrução acima, `findcc.js` será atualizado. Se seu projeto frequentemente requer implantação local, ou se código bifurcado (forked) frequentemente precisa resolver problemas de instalação, manter esse arquivo permite que você simplesmente o copie na próxima vez. Neste momento, muitos projetos e empresas que usam Claude Code não estão implantando em Mac, mas sim em ambientes hospedados no servidor, então o autor separou `findcc.js` para facilitar o acompanhamento das atualizações do código-fonte do cc-viewer daqui para frente.


### Outros comandos

Veja:

```bash
ccv -h
```

### Modo Silencioso

Por padrão, `ccv` roda em modo silencioso ao envolver `claude`, mantendo a saída do terminal limpa e consistente com a experiência nativa. Todos os logs são capturados em segundo plano e podem ser visualizados em `http://localhost:7008`.

Uma vez configurado, use o comando `claude` normalmente. Visite `http://localhost:7008` para acessar a interface de monitoramento.


## Recursos


### Modo de Programação

Após iniciar com ccv, você pode ver:

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/ab353a2b-f101-409d-a28c-6a4e41571ea2" />


Você pode visualizar as diffs do código diretamente após a edição:

<img width="1500" height="728" alt="image" src="https://github.com/user-attachments/assets/2a4acdaa-fc5f-4dc0-9e5f-f3273f0849b2" />

Embora você possa abrir arquivos e código manualmente, a codificação manual não é recomendada — isso é codificação à moda antiga!

### Programação Móvel

Você pode até escanear um QR code para programar pelo seu dispositivo móvel:

<img width="3018" height="1460" alt="image" src="https://github.com/user-attachments/assets/8debf48e-daec-420c-b37a-609f8b81cd20" />
<img width="1700" height="790" alt="image" src="https://github.com/user-attachments/assets/da3e519f-ff66-4cd2-81d1-f4e131215f6c" />

Realize sua imaginação sobre programação móvel. Há também um mecanismo de plugins — se você precisa personalizar para seus hábitos de codificação, fique atento às atualizações dos plugin hooks.


### Modo Logger (Visualizar Sessões Completas do Claude Code)

<img width="1500" height="768" alt="image" src="https://github.com/user-attachments/assets/a8a9f3f7-d876-4f6b-a64d-f323a05c4d21" />


- Captura todas as requisições de API do Claude Code em tempo real, garantindo texto bruto — não logs redatados (isso é importante!!!)
- Identifica e rotula automaticamente requisições de Main Agent e Sub Agent (subtipos: Plan, Search, Bash)
- Requisições MainAgent suportam Body Diff JSON, mostrando diferenças recolhidas da requisição MainAgent anterior (apenas campos alterados/novos)
- Cada requisição exibe estatísticas de uso de Token inline (tokens de entrada/saída, criação/leitura de cache, taxa de acerto)
- Compatível com Claude Code Router (CCR) e outros cenários de proxy — faz fallback para correspondência de padrão do caminho da API

### Modo Conversa

Clique no botão "Conversation Mode" no canto superior direito para analisar o histórico completo de conversa do Main Agent em uma interface de chat:

<img width="1500" height="764" alt="image" src="https://github.com/user-attachments/assets/725b57c8-6128-4225-b157-7dba2738b1c6" />

- A exibição de Agent Team ainda não é suportada
- Mensagens de usuário são alinhadas à direita (balões azuis), respostas do Main Agent são alinhadas à esquerda (balões escuros)
- Blocos `thinking` são recolhidos por padrão, renderizados como Markdown — clique para expandir e ver o processo de raciocínio; tradução com um clique é suportada (o recurso ainda é instável)
- Mensagens de seleção do usuário (AskUserQuestion) são exibidas em formato Q&A
- Sincronização bidirecional de modo: alternar para o modo conversa rola automaticamente para a conversa correspondente à requisição selecionada; voltar para o modo bruto rola automaticamente para a requisição selecionada
- Painel de configurações: alterna o estado de recolhimento padrão para resultados de ferramentas e blocos thinking
- Navegação de conversa em dispositivos móveis: no modo CLI móvel, toque no botão "Conversation Browse" na barra superior para deslizar uma visualização de conversa somente leitura para navegar pelo histórico completo da conversa no celular

### Gerenciamento de Logs

Via menu suspenso do CC-Viewer no canto superior esquerdo:

<img width="1500" height="760" alt="image" src="https://github.com/user-attachments/assets/33295e2b-f2e0-4968-a6f1-6f3d1404454e" />

**Compressão de Logs**
Em relação aos logs, o autor deseja esclarecer que as definições oficiais da Anthropic não foram modificadas, garantindo a integridade dos logs. No entanto, como entradas de log individuais do modelo 1M Opus podem se tornar extremamente grandes em estágios posteriores, graças a certas otimizações de log para MainAgent, pelo menos 66% de redução de tamanho é alcançada sem gzip. O método de análise desses logs comprimidos pode ser extraído do repositório atual.

### Mais Recursos Úteis

<img width="1500" height="767" alt="image" src="https://github.com/user-attachments/assets/add558c5-9c4d-468a-ac6f-d8d64759fdbd" />

Você pode localizar rapidamente seus prompts usando as ferramentas da barra lateral.

---

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/82b8eb67-82f5-41b1-89d6-341c95a047ed" />

O interessante recurso KV-Cache-Text permite que você veja exatamente o que o Claude vê.

---

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/54cdfa4e-677c-4aed-a5bb-5fd946600c46" />

Você pode fazer upload de imagens e descrever suas necessidades — a compreensão de imagem do Claude é incrivelmente poderosa. E como você sabe, pode colar imagens diretamente com Ctrl+V, e seu conteúdo completo será exibido na conversa.

---

<img width="600" height="370" alt="image" src="https://github.com/user-attachments/assets/87d332ea-3e34-4957-b442-f9d070211fbf" />

Você pode personalizar plugins, gerenciar todos os processos do CC-Viewer, e o CC-Viewer suporta troca a quente para APIs de terceiros (sim, você pode usar GLM, Kimi, MiniMax, Qwen, DeepSeek — embora o autor considere todos eles bastante fracos neste momento).

---

<img width="1500" height="746" alt="image" src="https://github.com/user-attachments/assets/b1f60c7c-1438-4ecc-8c64-193d21ee3445" />

Mais recursos aguardam ser descobertos... Por exemplo: o sistema suporta Agent Team, e possui um Code Reviewer integrado. A integração com Codex Code Reviewer está chegando em breve (o autor recomenda fortemente usar Codex para revisar o código do Claude Code).

## Licença

MIT

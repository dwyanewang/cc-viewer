# CC-Viewer

Un kit d'outils Vibe Coding distillé de la propre expérience de développement, construit sur Claude Code :

1. Augmenter le plafond des capacités : exécutez /ultraPlan et /ultraReview localement, afin que le code de votre projet n'ait jamais à être entièrement exposé au cloud de Claude ;
2. Compatibilité multiplateforme : permet la programmation mobile (au sein du LAN) ; la version Web s'adapte à divers scénarios, facile à intégrer dans des extensions de navigateur et des vues partagées du système d'exploitation, et fournit un installeur natif ;
3. Journalisation complète : fournit des capacités complètes d'interception et d'analyse du payload de Claude Code, idéal pour la journalisation, l'analyse de problèmes, l'apprentissage, l'inspiration et la rétro-ingénierie ;
4. Partage d'apprentissage et d'expérience : de nombreux matériels d'étude et expériences de développement ont été accumulés (voir les icônes "?" partout dans le système) ;
5. Expérience native préservée : étend uniquement les capacités de Claude Code, sans modifications substantielles du noyau, préservant l'expérience native ;
6. Prend en charge les modèles tiers : compatible avec deepseek-v4-*, GLM 5.1, Kimi K2.6, avec la capacité cc-switch intégrée pour basculer à chaud entre les outils tiers à tout moment.

[English](../README.md) | [简体中文](./README.zh.md) | [繁體中文](./README.zh-TW.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [Deutsch](./README.de.md) | [Español](./README.es.md) | Français | [Italiano](./README.it.md) | [Dansk](./README.da.md) | [Polski](./README.pl.md) | [Русский](./README.ru.md) | [العربية](./README.ar.md) | [Norsk](./README.no.md) | [Português (Brasil)](./README.pt-BR.md) | [ไทย](./README.th.md) | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)

## Utilisation

### Prérequis

- Assurez-vous d'avoir installé Node.js 22.0.0+ ; [Télécharger et installer](https://nodejs.org)
- Assurez-vous d'avoir installé Claude Code ; [Tutoriel d'installation](https://github.com/anthropics/claude-code)

### Installer ccv

#### Installation via npm

```bash
npm install -g cc-viewer --registry=https://registry.npmjs.org
```

#### Installation via Homebrew (recommandé pour macOS / Linux)

```bash
brew tap weiesky/cc-viewer
brew install cc-viewer
brew upgrade cc-viewer   # pour les mises à jour — N'utilisez PAS npm install -g avec les installations brew
```

### Lancement

ccv est un remplacement direct pour claude — tous les arguments sont transmis à claude tout en lançant le Web Viewer.

```bash
ccv                    # == claude (interactive mode)
```

La commande LA PLUS utilisée par l'auteur est :
```
ccv -c --d             # == claude --continue --dangerously-skip-permissions
                       # ccv transmet tous les paramètres de lancement de Claude Code — vous pouvez les combiner comme bon vous semble
```

Après le lancement en mode programmation, une page Web s'ouvrira automatiquement.

CC-Viewer est également livré sous forme d'application de bureau native : [Page de téléchargement](https://github.com/weiesky/cc-viewer/releases)


### Mode Logger

Si vous préférez toujours l'outil natif claude ou l'extension VS Code, utilisez ce mode.

Dans ce mode, le lancement de `claude` démarrera automatiquement un processus de journalisation qui enregistre les journaux de requêtes dans ~/.claude/cc-viewer/*yourproject*/date.jsonl

Activer le mode logger :
```bash
ccv -logger
```

Lorsque la console ne peut pas imprimer le port spécifique, le premier port par défaut est 127.0.0.1:7008. Les instances multiples utilisent des ports séquentiels comme 7009, 7010.

Désinstaller le mode logger :
```bash
ccv --uninstall
```

### Dépannage

Si vous rencontrez des problèmes lors du démarrage de cc-viewer, voici l'approche de dépannage ultime :

Étape 1 : Ouvrez Claude Code dans n'importe quel répertoire.

Étape 2 : Donnez à Claude Code l'instruction suivante :

```
I have installed the cc-viewer npm package, but after running ccv it still doesn't work properly. Please check cc-viewer's cli.js and findcc.js, and adapt them to the local Claude Code deployment based on the specific environment. Keep the scope of changes as constrained as possible within findcc.js.
```

Laisser Claude Code diagnostiquer le problème lui-même est plus efficace que de demander à quiconque ou de lire toute documentation !

Une fois l'instruction ci-dessus terminée, `findcc.js` sera mis à jour. Si votre projet nécessite fréquemment un déploiement local, ou si le code forké doit souvent résoudre des problèmes d'installation, conserver ce fichier vous permet simplement de le copier la prochaine fois. À ce stade, de nombreux projets et entreprises utilisant Claude Code ne déploient pas sur Mac mais plutôt sur des environnements hébergés côté serveur, c'est pourquoi l'auteur a séparé `findcc.js` pour faciliter le suivi des mises à jour du code source de cc-viewer à l'avenir.


### Autres commandes

Voir :

```bash
ccv -h
```

### Mode silencieux

Par défaut, `ccv` s'exécute en mode silencieux lorsqu'il encapsule `claude`, gardant votre sortie de terminal propre et cohérente avec l'expérience native. Tous les journaux sont capturés en arrière-plan et peuvent être consultés à `http://localhost:7008`.

Une fois configuré, utilisez la commande `claude` normalement. Visitez `http://localhost:7008` pour accéder à l'interface de surveillance.


## Fonctionnalités


### Mode Programmation

Après le lancement avec ccv, vous pouvez voir :

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/ab353a2b-f101-409d-a28c-6a4e41571ea2" />


Vous pouvez visualiser les différences de code directement après l'édition :

<img width="1500" height="728" alt="image" src="https://github.com/user-attachments/assets/2a4acdaa-fc5f-4dc0-9e5f-f3273f0849b2" />

Bien que vous puissiez ouvrir des fichiers et du code manuellement, le codage manuel n'est pas recommandé — c'est du codage à l'ancienne !

### Programmation mobile

Vous pouvez même scanner un code QR pour coder depuis votre appareil mobile :

<img width="3018" height="1460" alt="image" src="https://github.com/user-attachments/assets/8debf48e-daec-420c-b37a-609f8b81cd20" />
<img width="1700" height="790" alt="image" src="https://github.com/user-attachments/assets/da3e519f-ff66-4cd2-81d1-f4e131215f6c" />

Réalisez votre imagination de la programmation mobile. Il existe également un mécanisme de plugin — si vous avez besoin de personnaliser pour vos habitudes de codage, restez à l'affût des mises à jour des hooks de plugin.


### Mode Logger (Visualiser les sessions complètes de Claude Code)

<img width="1500" height="768" alt="image" src="https://github.com/user-attachments/assets/a8a9f3f7-d876-4f6b-a64d-f323a05c4d21" />


- Capture toutes les requêtes API de Claude Code en temps réel, garantissant du texte brut — pas des journaux caviardés (c'est important !!!)
- Identifie et étiquette automatiquement les requêtes Main Agent et Sub Agent (sous-types : Plan, Search, Bash)
- Les requêtes MainAgent prennent en charge Body Diff JSON, montrant les différences repliées par rapport à la requête MainAgent précédente (uniquement les champs modifiés/nouveaux)
- Chaque requête affiche des statistiques d'utilisation des Tokens en ligne (tokens d'entrée/sortie, création/lecture de cache, taux de succès)
- Compatible avec Claude Code Router (CCR) et d'autres scénarios de proxy — revient à la correspondance de modèle de chemin API

### Mode Conversation

Cliquez sur le bouton "Conversation Mode" dans le coin supérieur droit pour analyser l'historique complet des conversations du Main Agent dans une interface de chat :

<img width="1500" height="764" alt="image" src="https://github.com/user-attachments/assets/725b57c8-6128-4225-b157-7dba2738b1c6" />

- L'affichage Agent Team n'est pas encore pris en charge
- Les messages de l'utilisateur sont alignés à droite (bulles bleues), les réponses du Main Agent sont alignées à gauche (bulles sombres)
- Les blocs `thinking` sont repliés par défaut, rendus en Markdown — cliquez pour développer et voir le processus de pensée ; la traduction en un clic est prise en charge (la fonctionnalité est encore instable)
- Les messages de sélection de l'utilisateur (AskUserQuestion) sont affichés au format Q&R
- Synchronisation bidirectionnelle des modes : le passage en mode conversation défile automatiquement vers la conversation correspondant à la requête sélectionnée ; le retour en mode brut défile automatiquement vers la requête sélectionnée
- Panneau de paramètres : basculez l'état de pliage par défaut pour les résultats d'outils et les blocs thinking
- Navigation mobile des conversations : en mode CLI mobile, appuyez sur le bouton "Conversation Browse" dans la barre supérieure pour faire glisser une vue de conversation en lecture seule pour parcourir l'historique complet des conversations sur mobile

### Gestion des journaux

Via le menu déroulant CC-Viewer dans le coin supérieur gauche :

<img width="1500" height="760" alt="image" src="https://github.com/user-attachments/assets/33295e2b-f2e0-4968-a6f1-6f3d1404454e" />

**Compression des journaux**
Concernant les journaux, l'auteur souhaite clarifier que les définitions officielles d'Anthropic n'ont pas été modifiées, garantissant l'intégrité des journaux. Cependant, comme les entrées de journal individuelles du modèle 1M Opus peuvent devenir extrêmement volumineuses dans les étapes ultérieures, grâce à certaines optimisations de journal pour MainAgent, une réduction de taille d'au moins 66 % est obtenue sans gzip. La méthode d'analyse pour ces journaux compressés peut être extraite du référentiel actuel.

### Plus de fonctionnalités utiles

<img width="1500" height="767" alt="image" src="https://github.com/user-attachments/assets/add558c5-9c4d-468a-ac6f-d8d64759fdbd" />

Vous pouvez localiser rapidement vos prompts à l'aide des outils de la barre latérale.

--- 

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/82b8eb67-82f5-41b1-89d6-341c95a047ed" />

La fonction intéressante KV-Cache-Text vous permet de voir exactement ce que Claude voit.

---

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/54cdfa4e-677c-4aed-a5bb-5fd946600c46" />

Vous pouvez télécharger des images et décrire vos besoins — la compréhension des images de Claude est incroyablement puissante. Et comme vous le savez, vous pouvez coller des images directement avec Ctrl+V, et votre contenu complet sera affiché dans la conversation.

---

<img width="600" height="370" alt="image" src="https://github.com/user-attachments/assets/87d332ea-3e34-4957-b442-f9d070211fbf" />

Vous pouvez personnaliser les plugins, gérer tous les processus CC-Viewer, et CC-Viewer prend en charge le basculement à chaud vers des APIs tierces (oui, vous pouvez utiliser GLM, Kimi, MiniMax, Qwen, DeepSeek — bien que l'auteur les considère tous comme assez faibles à ce stade).

---

<img width="1500" height="746" alt="image" src="https://github.com/user-attachments/assets/b1f60c7c-1438-4ecc-8c64-193d21ee3445" />

D'autres fonctionnalités attendent d'être découvertes... Par exemple : le système prend en charge Agent Team et dispose d'un Code Reviewer intégré. L'intégration de Codex Code Reviewer arrive bientôt (l'auteur recommande vivement d'utiliser Codex pour réviser le code de Claude Code).

## Licence

MIT

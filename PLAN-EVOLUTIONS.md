# Plan d’évolution recommandé — Portfolio Carrel

Audit du code présent le 24 octobre 2026. Ce document distingue les fonctions
effectivement présentes des éléments souhaités qui restent à construire. Les
exemples et compteurs fournis dans la demande ne sont pas considérés comme des
fonctions existantes sans confirmation dans le projet.

## Synthèse

Le socle multi-pages, l’administration protégée, les collections de carrière,
les filtres, l’édition de galerie, les réglages éditoriaux et les diagnostics
de services sont implémentés. Les points réellement ouverts sont maintenant
limités à la validation des parcours interactifs en session propriétaire, aux
contenus personnels à fournir, à la vérification SMTP réelle, à l’optimisation
de performance et à la traduction anglaise.

## Ce qui existe réellement

### Pages et navigation

| Élément demandé | État dans le projet | Décision recommandée |
| --- | --- | --- |
| Carrel / identité | Le nom et le rôle sont administrables dans le profil ; le logo textuel de l’en-tête renvoie à l’accueil. | Garder l’identité globale dans le profil et permettre un libellé/logo plus personnel ultérieurement. |
| Accueil | `/` existe et regroupe plusieurs sections : accueil, À propos, projets, compétences, IA si renseignée, réalisations et contact. | En faire une vitrine courte avec des extraits et des liens vers les pages détaillées. |
| À propos | Section `#apropos` sur l’accueil ; le texte utilise la biographie du profil. Pas de page `/a-propos`. | Garder une section sur l’accueil ; ne créer une page dédiée que si la biographie devient substantielle. |
| Compétences | `/competences` propose recherche et filtre de catégorie. | Garder les contrôles simples et accessibles ; ajuster seulement si le catalogue réel le justifie. |
| Parcours | `/parcours` distingue maintenant les groupes Formations & diplômes et Expériences & étapes de parcours ; les contenus historiques restent dans leur table. | Garder cette page comme vue de carrière groupée ; envisager un filtre par type si le volume le justifie. |
| Expériences | Les expériences restent dans `portfolio_journey`, avec un onglet admin séparé des formations. Aucune reclassification automatique des anciennes entrées n’est faite. | Continuer à administrer les expériences séparément et préserver leur sens historique. |
| Diplômes et formations | `portfolio_educations` fournit établissement, diplôme/niveau, lieu, dates, statut, description et visuel facultatif. Le profil conserve un champ résumé. | La migration additive 0004 et les migrations 0001–0008 ont été appliquées à la base configurée ; répéter uniquement pour une autre base cible. |
| Certifications | `portfolio_certifications`, son onglet admin et `/certifications` sont implémentés, avec émetteur, dates, identifiant, URL de vérification, compétences et badge facultatifs. | Publier uniquement des éléments réels ; vérifier migration et CRUD dans une session propriétaire. |
| Réalisations | `/realisations` existe et affiche des éléments génériques titre/description/date/icône. Ce n’est pas un gestionnaire de certifications. | Garder cette rubrique pour les accomplissements éditoriaux qui ne sont ni projet, ni diplôme, ni certification. |
| Projets | `/projets` et `/projets/:slug` existent ; la liste filtre par recherche, technologie, année et type, avec critères partageables dans l’URL et état vide. | Garder une taxonomie de types lisible et n’ajouter des catégories qu’avec du contenu réel. |
| Contact | Le formulaire partagé est disponible sur `/#contact` et `/contact` ; réglages facultatifs de rendez-vous, types de mission, confidentialité et anti-spam sont présents. | Ne pas tester un vrai envoi sans destinataire contrôlé et accord du propriétaire. |
| Thème | Un bouton clair/sombre mémorisé par cookie est disponible dans le menu ; le mode clair utilise `neon-workspace-light.png`. | Les préférences déjà choisies sont conservées ; le mode sombre reste la valeur initiale. |
| Animations | Apparition en cascade, barre de progression au scroll, cartes interactives Tilt/Spotlight, menu à liens séquencés et transitions de pages avec flou/perspective ; prise en charge de `prefers-reduced-motion`. | Les effets de la référence externe [Animation Kit](https://github.com/Jehudiel270/Animation-kit) sont adaptés au portfolio en CSS/DOM natifs, sans ajouter de dépendance. Le catalogue en ligne n’a pas pu être inspecté visuellement dans cet environnement. |

### Administration, données et compteurs

- Le dashboard montre désormais les projets publiés/en brouillon, compétences,
  technologies, outils IA, formations, étapes de parcours, certifications et
  messages nouveaux.
- Les projets ont déjà les notions de brouillon, publication et date de
  publication programmée. Il est donc possible de calculer des compteurs
  publiés/brouillons sans créer un deuxième système de statut.
- Les messages possèdent des états de traitement et d’archivage. Le dashboard
  compte les messages réellement nouveaux/non archivés et affiche la date du
  dernier changement de contenu consigné dans le journal admin.
- Le profil admin permet de gérer l’identité, la formation résumée, la
  biographie, l’image, les réseaux et la disponibilité. Plusieurs textes de
  l’accueil restent cependant codés dans la page et ne sont pas éditables
  séparément.
- L’administration propose des réglages limités de visibilité des pages,
  navigation, CV, prise de rendez-vous, types de mission et rétention des
  messages. Il n’y a pas de constructeur générique ni de palette libre.
- Cloudinary est utilisé par le téléversement des médias. La configuration
  SMTP sert au contact côté serveur ; un diagnostic privé indique l’état de
  la base, SMTP et Cloudinary sans exposer de secrets. Les secrets restent
  côté serveur.
- Les statistiques quotidiennes ne stockent ni IP ni cookie ; une page de
  confidentialité et une purge manuelle des messages sont disponibles.
- Le journal admin conserve les changements et n’autorise l’annulation que
  lorsqu’une modification plus récente ne rend pas la restauration risquée.
- Aucune intégration Lenis n’a été trouvée. La navigation utilise le
  défilement natif et le défilement fluide du navigateur.
- Le portfolio dispose maintenant d’animations discrètes à l’entrée des
  sections/cartes et d’un décalage léger entre éléments voisins, réduites si
  `prefers-reduced-motion` est activé. Le menu public et la navigation admin
  sur grand écran sont sticky. Les cartes sont
  vitrées et moins opaques ; le menu mobile et les transitions de page sont
  animés.

### IA, modèles et catalogue

Le projet a une page `/ia`, un onglet « IA & modèles » dans l’administration
et un catalogue Iconify étendu. Le catalogue mélange cependant plusieurs
notions : fournisseurs (OpenAI, Anthropic), applications (ChatGPT, Cursor),
outils/frameworks (LangChain, Ollama) et noms de modèles (GPT-4o, Claude
Sonnet, Qwen). Toutes ces entrées restent dans la table de technologies, désormais complétée
par un type IA, une relation facultative au fournisseur, un mode d’accès, une
description et un lien officiel.

Manus est déjà présent dans la sélection locale avec un rendu texte `MA`.
Mistral et plusieurs de ses produits sont également présents. Ce ne sont pas
des outils publiés automatiquement : ils ne paraissent sur le site que si le
propriétaire les ajoute dans « IA & modèles ». Le grand catalogue distant
recense des icônes Iconify, pas une base exhaustive, vérifiée et à jour des
modèles d’IA.

La structure des fiches IA est disponible dans le dashboard et sur `/ia`.
Les cas d’usage et la date de vérification sont administrables. La page
publique permet maintenant de chercher par nom, description ou cas d’usage,
et de filtrer par famille avec des critères conservés dans l’URL. Confirmer
avec le propriétaire les produits réellement utilisés avant publication ;
aucun outil n’est ajouté automatiquement.

Les versions de modèles évoluent vite. Il faut éviter de publier une longue
liste de noms seulement parce qu’ils existent dans le catalogue : l’administration
doit refléter les outils réellement utilisés et rendre claire la date de
vérification de la sélection.

## Fonctionnalités utiles à mettre en place

### P0 — Fiabiliser l’information et le parcours public

- [x] **Contact `/contact`** : créer une vraie page partageable avec SEO propre,
   formulaire et canaux de contact. L’accueil garde un appel à l’action. Une
   seule configuration doit alimenter les deux surfaces pour éviter les
   divergences.
- [x] **Sections et navigation** : permettre d’activer/désactiver les pages
   réellement prises en charge et refléter leur état dans l’en-tête. Ne pas
   afficher un lien vers une page vide ou désactivée. Conserver les sections
   « À propos » et « Contact » sur l’accueil comme raccourcis, pas comme
   substituts silencieux aux pages dédiées.
- [x] **Formation et expérience** : ajouter une gestion distincte dans le
   dashboard et les regrouper sur `/parcours`. Des filtres additionnels et
   une page expérience séparée restent inutiles tant que le contenu est court.
- [x] **Certifications et diplômes** : ne pas les ajouter comme simples
   réalisations. Les diplômes relèvent des formations ; les certifications ont
   leurs propres preuves et dates.

### P1 — Rendre les catalogues publics faciles à explorer

- [x] **Projets** : filtre par technologie/stack, année et type ; recherche par
   titre/description ; bouton « Effacer les filtres » ; état vide explicite.
   Synchroniser les critères dans la query string pour qu’une sélection soit
   partageable et survive au rechargement.
- [x] **Compétences** : filtre par catégorie et recherche sur le nom. Garder les
   groupes visibles quand la liste est courte ; ne pas ajouter des contrôles
   inutiles si le contenu tient sur un écran.
- [x] **IA** : filtres par famille et recherche sur le nom, la description ou
   les usages saisis, partageables dans l’URL. Pas de classement de capacités
   non vérifiées.
- [x] **Parcours et certifications** : collections séparées et pages dédiées ;
   filtres reportés tant que le nombre d’entrées ne les justifie pas.
- [x] **Accessibilité** : filtres utilisables au clavier, libellés explicites,
   annonces du nombre de résultats et préservation des préférences dans l’URL.

### P1 — Ajouter la gestion structurée des certifications et diplômes

**Fondations livrées :** les ressources séparées, onglets admin, migrations
additives jusqu’à 0008, affichage des formations sur `/parcours` et page
`/certifications` sont implémentés et vérifiés sur le serveur redémarré.
Les API authentifiées ont aussi été testées pour le CRUD, le réordonnancement,
la validation et l’exposition publique ; les lignes temporaires ont été
supprimées. Le SMTP réel reste à vérifier.

Recommandation : séparer les **modèles de données et les formulaires admin**,
mais offrir une expérience publique cohérente.

- **Formations/diplômes** : intitulé, établissement, niveau/diplôme, lieu,
  dates, statut (en cours/obtenu), description courte et visuel facultatif.
- **Certifications** : intitulé, organisme émetteur, date d’obtention,
  expiration facultative, identifiant et URL de vérification facultatifs,
  compétences associées et image/badge facultatif.
- **Parcours professionnel** : rôles, organisation, lieu, dates, description
  et résultats éventuels. Ce sont des expériences, pas des formations.
- **Admin** : sections distinctes « Formations », « Expériences » et
  « Certifications », avec ajout groupé/import uniquement après définition
  d’un format et d’une prévisualisation validés.
- **Public** : conserver `/parcours` pour la chronologie formations +
  expériences avec filtres, et créer `/certifications` pour les preuves
  vérifiables. Sur l’accueil, ne montrer que les éléments marquants.
- **Réalisations** : garder les accomplissements génériques (distinctions,
  lancements, contributions) sans y mélanger les diplômes ou certifications.

Cette séparation empêche de confondre « j’ai étudié à… », « j’ai travaillé
chez… » et « cet organisme m’a délivré cette certification ». Elle donne aussi
des champs et validations adaptés, sans imposer trois pages d’accueil.

### P1 — Clarifier et enrichir l’espace IA

La liste administrable structurée est livrée : taxonomie, relation fournisseur,
mode d’accès, description et URL officielle facultatifs, avec rendu public
groupé sur `/ia`. Les types sont :

| Type | Exemples de champs utiles |
| --- | --- |
| Fournisseur | Nom, logo officiel ou personnalisé, lien officiel |
| Modèle | Nom/version, fournisseur, date de vérification, accès API/local |
| Application/assistant | Nom, fournisseur éventuel, usage réel |
| Framework/outil | Nom, rôle, langages ou modèles reliés |

Chaque entrée publiée peut comporter type, fournisseur lié, logo, mode
d’accès, courte description, URL officielle, cas d’usage et date de
vérification. Iconify est une source d’icônes, pas une base de données de
modèles. Le propriétaire doit toujours confirmer les usages et outils réels.

Première sélection à examiner avec le propriétaire avant publication :
fournisseurs (OpenAI, Anthropic, Google, Mistral, DeepSeek, Qwen, Moonshot/Kimi,
xAI, Meta, Cohere, Microsoft, Hugging Face), assistants/outils (ChatGPT,
Claude, Gemini, Manus, GitHub Copilot, Cursor, Windsurf, Perplexity,
NotebookLM), génération (Midjourney, outils d’image/vidéo/audio réellement
utilisés), et modèles locaux ou API réellement testés. Ce sont des pistes à
confirmer, pas des déclarations d’usage.

### P1 — Galerie de projets plus visuelle

La galerie prend en charge l’aperçu miniature, le téléversement multiple avec
progression et erreurs par fichier, le remplacement d’image, le
réordonnancement par glisser-déposer/commandes accessibles et le choix d’une
couverture indépendante de l’ordre.

### P2 — Dashboard utile et réglages raisonnables

- [x] Afficher des compteurs vérifiables : projets publiés/brouillons,
  compétences, formations, étapes de parcours, certifications et messages
  nouveaux.
- [x] Afficher la date et le résumé de la dernière modification de contenu
  à partir du journal admin ; ne rien afficher de trompeur si le journal est vide.
- [x] Rendre visibles les raccourcis utiles : ajouter un projet, ouvrir l’aperçu,
  consulter les nouveaux messages.
- [x] Ajouter un état simple des dépendances Cloudinary/SMTP (disponible/non
  configuré/erreur), sans afficher clés, secrets, adresses privées ni détails
  d’authentification.
- [x] Créer des réglages éditoriaux limités : visibilité des pages et
  navigation, réglages de contact et de rétention. Les textes d’interface
  actuels de l’accueil ne sont pas tous gérés par le profil.
- Ne pas commencer par une palette entièrement personnalisable ; préserver le
  thème existant et proposer au besoin quelques thèmes testés.

## Évaluer les fonctions de l’écran fourni

| Fonction de la maquette | Évaluation pour ce projet |
| --- | --- |
| Données lues en direct dans Neon | C’est déjà le principe du contenu public/admin. Garder un statut de source compréhensible et afficher des erreurs réelles, pas un faux succès. |
| Compteurs du dashboard | Les compteurs projets publiés/brouillons, compétences, formations, étapes de parcours, certifications et messages nouveaux sont calculés depuis leurs collections. |
| Dernière modification | La vue d’ensemble affiche la date de la dernière opération de contenu journalisée et son résumé. |
| Palette / apparence | Un bouton thème clair/sombre est disponible, avec l’image claire fournie. Une palette libre n’est pas proposée. |
| Services Cloudinary et e-mail | Les intégrations et l’état de santé privé sont présents ; aucun secret n’est publié côté client. |
| Gérer les projets / aperçu privé | Gestion et aperçu privé de projet existent déjà ; améliorer les raccourcis du dashboard, sans reconstruire ces fonctions. |
| Réglages du site | Visibilité des pages, navigation, CV, rendez-vous, missions et rétention sont configurables. Pas de constructeur générique. |
| Défilement fluide Lenis | Non présent et non nécessaire : le scroll natif, les transitions légères et `prefers-reduced-motion` sont conservés. |
| Identité, accueil et À propos | Profil, bio, localisation et disponibilité sont gérés. Plusieurs slogans, descriptions et libellés visibles restent écrits dans la page ; les rendre éditables dans une vague ultérieure. |
| Réseaux sociaux | Déjà administrables, avec liste de plateformes et icônes affichées publiquement. |
| Globe d’accueil et repère géographique | Pas de configuration repérée. À traiter comme une option décorative facultative, après les fonctionnalités éditoriales et avec un mode sans animation. |
| Page Contact activable et champs configurables | La page dédiée et le formulaire partagé sont présents ; visibilité conditionnelle, anti-spam et réglages de rendez-vous sont disponibles. Un configurateur arbitraire de champs n’est pas prioritaire. |
| Modèles e-mail/WhatsApp paramétrables | Configuration SMTP et formulaire côté serveur existent ; un éditeur de modèles avancé et le préremplissage WhatsApp listé dans la maquette ne sont pas des fonctions actuellement identifiées. À ajouter seulement si le contact multi-canal est souhaité. |
| Conservation et purge des messages | La durée et la purge manuelle sont configurables ; la politique est expliquée dans `/confidentialite`. |
| Widget « contact rapide » | Pas trouvé. À différer : le formulaire dédié, la page de contact et les canaux réels répondent au besoin avec moins d’ambiguïté. Un widget ne doit jamais laisser croire à un chat en direct ou à une réponse IA. |
| Import CV | L’extraction PDF/DOCX avec aperçu existe déjà ; rien n’est publié automatiquement. La prochaine amélioration utile serait un transfert contrôlé des champs extraits vers des formulaires avec validation, pas une publication automatique. |

## Ordre de réalisation proposé

1. [x] Séparer et valider les collections formations, expériences et
   certifications.
2. [x] Structurer l’espace IA, ses fournisseurs, usages, modes d’accès et date
   de vérification ; le propriétaire confirme les outils réellement utilisés.
3. [x] Ajouter filtres de compétences et de projets, dont le type.
4. [x] Compléter le téléversement de galerie et la sélection indépendante de
   couverture ; seules les mesures de performance sur des médias réels restent
   à examiner.
5. [x] Ajouter réglages éditoriaux limités, visibilité de pages et état privé
   des services.
6. [ ] Étendre les tests automatisés aux parcours authentifiés, aux migrations
   et aux opérations admin sensibles avec une base dédiée.
7. [ ] Ajouter la version anglaise et optimiser les images sur des médias
   réels après collecte d’une référence de performance.

## Hors priorité pour le moment

- Lenis : conserver le défilement natif et les animations légères accessibles.
- Un widget de chat ou une réponse automatique par IA.
- Une importation automatique de tout le catalogue mondial des modèles.
- Un constructeur de pages entièrement libre ou un thème modifiable pixel par
  pixel.
- Des filtres sur chaque page, même lorsque le contenu est court.
- Une affirmation publique d’usage d’un modèle ou d’une certification avant
  confirmation et preuve par le propriétaire.

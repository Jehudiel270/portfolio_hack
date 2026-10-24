# État d’avancement — Portfolio Carrel

Mis à jour après l’ajout des réglages, statistiques et opérations admin. Ce document sépare les fonctions constatées dans
le projet, les changements réalisés pendant cette intervention et le travail
qui reste. Une fonction listée comme existante n’est pas nécessairement testée
avec une session propriétaire.

## Socle validé et vérifications récentes

- [x] Site Nuxt multi-pages : accueil, parcours, projets, détails projet,
  compétences, IA, réalisations, contact et certifications.
- [x] Administration protégée, API de contenu et stockage Neon ; médias de
  projets téléversés côté serveur vers Cloudinary.
- [x] Projets avec brouillon/publication programmée, étude de cas et galerie
  (ordre, légende, texte alternatif).
- [x] Catalogue Iconify pour les icônes officielles et choix explicite entre
  icône, image et texte personnalisé.
- [x] Import de CV PDF/DOCX en aperçu, sans publication ni enregistrement
  automatique.
- [x] Réseaux sociaux configurables et affichés avec les icônes disponibles.
- [x] Liens sociaux personnalisés avec icône et libellé.
- [x] Formulaire de contact SMTP sur l’accueil ; l’interface n’annonce pas de
  succès si l’envoi échoue.
- [x] Recherche et filtres partageables (technologie et année) sur les projets.
- [x] Filtre de projet par type et recherche/filtre public des compétences.
- [x] Recherche de fiches IA par nom, description et usage, filtre de famille
  partageable dans l’URL.
- [x] Formations/diplômes et certifications séparés des étapes de parcours,
  avec formulaires admin dédiés et champs adaptés.
- [x] `/parcours` affiche distinctement les formations et les expériences sans
  convertir les anciennes entrées ambiguës.
- [x] `/certifications` présente les attestations, les dates, les compétences
  associées, le badge facultatif et un lien de vérification.
- [x] Un aperçu des certifications publiées apparaît sur l’accueil.
- [x] Le dashboard compte formations, certifications et étapes de parcours.
- [x] Barre de défilement personnalisée déjà présente dans les styles globaux.
- [x] Bouton thème clair/sombre persistant et seconde image utilisée pour le
  thème clair.
- [x] Cartes de l’accueil plus transparentes, menu animé et transitions entre
  pages ; apparitions en cascade, barre de progression, cartes interactives
  Tilt/Spotlight et transition en perspective, avec prise en charge de
  `prefers-reduced-motion`.
- [x] `pnpm check`, `pnpm test` (6 tests) et `pnpm build` réussis après les
  changements récents de thème et d’animation.

## Réalisé dans cette intervention

- [x] Créer [PLAN-EVOLUTIONS.md](./PLAN-EVOLUTIONS.md), audit différenciant
  l’existant, les recommandations et l’ordre de réalisation.
- [x] Créer une page publique dédiée `/contact`, tout en conservant le contact
  sur l’accueil.
- [x] Mutualiser le formulaire entre les deux pages pour éviter des
  implémentations et réglages divergents.
- [x] Ajouter la recherche de projets et les filtres par technologie et année ;
  synchroniser les critères dans l’URL afin qu’ils soient partageables.
- [x] Ajouter le nombre de résultats et un état vide avec action de remise à
  zéro des filtres.
- [x] Ajouter un aperçu miniature des images dans l’éditeur de galerie existant.
- [x] Adapter les effets d’apparition, scroll progress, Tilt/Spotlight et
  transition en perspective de la référence Animation Kit aux pages publiques.
- [x] Respecter `prefers-reduced-motion` et garder le défilement natif ; ne pas
  introduire Lenis ni détourner les événements de scroll.
- [x] Rendre le menu public sticky et corriger le conteneur de débordement
  susceptible de limiter son comportement ; rendre la navigation admin sticky
  sur les grands écrans.
- [x] Ajouter des compteurs admin calculés à partir des données réelles :
  projets publiés/brouillons, compétences, technologies, IA et messages nouveaux.
- [x] Ajouter les compteurs administratifs formations, certifications et
  étapes de parcours.
- [x] Créer une ressource distincte pour formations/diplômes et une pour
  certifications, avec champs de validation, média facultatif et ordre.
- [x] Ajouter les formulaires admin, listes, réordonnancement et actions CRUD
  via les routes de contenu déjà protégées.
- [x] Ajouter `/certifications`, ses métadonnées SEO, ses badges, dates,
  identifiants et liens de vérification facultatifs.
- [x] Afficher les formations et expériences en groupes séparés sur
  `/parcours`, sans reclasser le contenu historique.
- [x] Ajouter un aperçu des certifications publiées à l’accueil.
- [x] Écrire le présent fichier de suivi.
- [x] `pnpm check` et `pnpm test` réussis après les derniers changements.
- [x] Ajouter des métriques contextuelles aux projets et des témoignages avec
  contrôle obligatoire de l’autorisation avant publication.
- [x] Ajouter aux fiches IA des usages et une date de vérification, sans
  préremplir un inventaire supposé réel.
- [x] Ajouter un lien de CV facultatif, des types de mission et une option de
  prise de rendez-vous.
- [x] Ajouter les réglages de visibilité/navigation, la confidentialité,
  l’anti-spam honeypot, la purge manuelle et les diagnostics de services.
- [x] Ajouter des statistiques agrégées sans identifiant visiteur et un
  journal admin avec annulation prudente.
- [x] Améliorer la galerie avec dépôt multiple, progression, erreurs
  individuelles, remplacement et réordonnancement.
- [x] Choisir une couverture parmi les médias de galerie sans modifier leur
  ordre.
- [x] Afficher la date et l’action de la dernière modification du contenu
  depuis le journal admin.

## À terminer ou à vérifier

### Vérification avant livraison

- [x] `pnpm check` réussi après l’ajout des pages, données et formulaires.
- [x] `pnpm build` réussi ; nouveau serveur de production redémarré sur le port
  3002.
- [x] Avant les derniers ajouts, routes `/`, `/contact`, `/projets`,
  `/competences`, `/parcours`, `/ia`, `/realisations`, `/admin` et
  `/api/health` répondaient HTTP 200.
- [x] Après les ajouts, `/certifications`, les autres pages publiques,
  `/admin` et `/api/health` répondent HTTP 200 sur le build de production.
- [x] L’API publique lit les nouvelles collections depuis la base après
  migration (`source=database`).
- [x] API de santé confirmée ; API privée de contenu sans session renvoie 401.
- [x] Dans Edge réel headless, à 1440 × 900, menu positionné sticky et toujours
  collé en haut après 1000 px de défilement.
- [x] Animations vues dans Edge : 2 éléments déjà visibles au chargement et 9
  après défilement ; le contenu au-dessus de la ligne de flottaison reste
  visible pendant l’hydratation.
- [x] Avec `prefers-reduced-motion: reduce`, défilement fluide désactivé et
  éléments en attente visibles sans animation.
- [x] À 390 px et 320 px, accueil et contact sans débordement horizontal ; le
  menu mobile affiche maintenant ses 8 liens sans débordement.
- [x] Dans Edge headless, `/certifications` vérifiée à 390 px avec 8 liens
  visibles dans le menu ; en-tête sticky vérifié à 1440 × 900 après scroll.
- [x] Recherche projet testée sur les données présentes : 3 cartes initiales,
  une carte pour « Line Laurence », état vide, effacement des filtres, et URL
  directe `?stack=Cloudinary` restituant une carte.
- [x] Styles calculés de la barre de défilement vérifiés : couleurs et taille
  standard, largeur WebKit 12 px et thumb dégradé.
- [x] Tester avec une session propriétaire la création, l’édition, la
  suppression et le réordonnancement des sept ressources via les API admin.
- [x] Ajouter recherche et filtre IA, puis tester la logique de filtrage par
  famille, nom et cas d’usage.
- [x] Ajouter des filtres dans l’URL de l’espace IA ; la page offre un état
  vide et un bouton de remise à zéro.
- [ ] Vérifier un véritable envoi SMTP avec une adresse destinataire maîtrisée.

### Modèle de contenu et administration

- [x] Créer une ressource de formations/diplômes structurée (intitulé,
  établissement, niveau, dates, statut, description et image facultative).
- [x] Distinguer formations et expériences dans l’admin et sur `/parcours`,
  sans reclasser automatiquement les anciennes données ambiguës.
- [x] Créer une ressource dédiée aux certifications (émetteur, obtention,
  expiration facultative, identifiant et URL de vérification).
- [x] Créer `/certifications`, ses métadonnées SEO et un aperçu de celles
  publiées sur l’accueil.
- [ ] Décider avec le propriétaire quelles certifications, formations et
  expériences réelles publier ; ne pas inventer de titres ou de preuves.
- [x] Ajouter au dashboard des compteurs formations, étapes de parcours et
  certifications.
- [x] `pnpm db:migrate` a appliqué les migrations jusqu’à 0005 sur la base
  configurée dans `.env`.
- [x] Vérifier les nouvelles routes après redémarrage du serveur de production.
- [x] Tester le CRUD authentifié, la validation et le tri des formations et
  certifications, puis vérifier leur visibilité dans l’API publique.

### IA et modèles

- [x] Distinguer fournisseurs, modèles, assistants/applications et
  frameworks/outils dans les données, l’administration et l’affichage public.
- [x] Relier un modèle à un fournisseur par identifiant de relation et préciser
  le mode d’accès (web, API, local, hybride ou non renseigné).
- [x] Ajouter une description et une URL officielle facultatives.
- [x] Appliquer la migration additive 0005 ; les neuf technologies existantes
  sont conservées et aucun outil IA n’a été ajouté ni publié automatiquement.
- [x] Vérifier la relation modèle/fournisseur, l’accès API et la suppression
  du fournisseur avec des lignes temporaires supprimées après le test.
- [x] Séparer le catalogue d’icônes Iconify des usages IA saisis par le
  propriétaire ; les icônes ne sont pas présentées comme une base de modèles.
- [ ] Confirmer avec le propriétaire quels outils et modèles il utilise avant
  de les publier. La base actuelle ne contient encore aucune entrée de
  catégorie IA ; le catalogue Iconify sert aux icônes, pas à valider l’usage.

### UX et réglages ultérieurs

- [x] Ajouter un type de projet et son filtre.
- [x] Ajouter la recherche et le filtre de compétences.
- [x] Ajouter le dépôt multiple, la progression, les erreurs par fichier,
  le remplacement et le réordonnancement de galerie.
- [x] Ajouter des réglages éditoriaux limités et la visibilité de pages.
- [x] Ajouter un état de santé SMTP/Cloudinary sans exposer de secrets.
- [x] Ajouter une durée de rétention configurable, une page de confidentialité
  et une purge manuelle des messages arrivés à échéance.
- [x] Ajouter le choix de couverture indépendant de l’ordre de galerie.
- [x] Décider de conserver le défilement natif, sans widget de chat, réponse
  IA automatique, constructeur générique ou palette libre.
- [ ] Vérifier visuellement dans Edge les thèmes clair/sombre, la transparence
  des cartes, le menu et les dernières animations ; l’autorisation de débogage
  du navigateur n’a pas été accordée dans cette session.
- [ ] Mesurer les performances d’images sur des contenus réels et ajouter les
  formats optimisés si les mesures le justifient.

## Résultat de validation de cette livraison

Après les derniers changements, `pnpm check`, `pnpm test` (6 tests) et
`pnpm build` réussissent. Les migrations additives 0001–0008 ont été appliquées
à la base configurée ; `/`, `/contact`, `/ia` et `/admin` répondent HTTP 200
sur `http://127.0.0.1:3002`, `/api/health` répond 200 et `/api/admin/settings`
sans session répond 401. L’asset client, les deux feuilles CSS et l’image
claire répondent 200 ; les CSS contiennent les styles standard/WebKit de la
barre, le thème clair et les nouvelles animations. La sélection du thème
clair a également été confirmée dans le HTML SSR. La validation visuelle dans
Edge reste à faire faute d’autorisation
de débogage du navigateur. Les parcours qui exigent une session propriétaire,
le test SMTP réel, les contenus personnels et la version anglaise restent à
confirmer ou fournir ; aucune donnée personnelle n’a été inventée.

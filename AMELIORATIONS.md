# Améliorations du portfolio

Suivi des demandes et recommandations. Les validations d’administration nécessitant une session propriétaire sont séparées des vérifications publiques.

## Priorité P0 — Présentation et navigation

- [x] Remplacer le site monopage par des pages publiques distinctes : accueil, parcours, projets, compétences, IA, réalisations, certifications et contact.
- [x] Ajouter une page de détail par projet avec étude de cas et galerie.
- [x] Corriger l’image de fond, préserver ses proportions et la maintenir derrière le contenu avec un cadrage adapté.
- [x] Retirer les voiles colorés, grilles et dégradés superposés au fond public et admin ; afficher directement l’image sombre ou claire sélectionnée, sans filtre de teinte ni assombrissement.
- [x] Utiliser des panneaux translucides qui laissent apparaître le fond tout en préservant la lisibilité.
- [x] Rendre l’en-tête mobile utilisable : le bouton du menu reste visible à 320 px et 390 px.
- [x] Vérifier dans Edge les vues desktop à 1440 × 900 et mobile à 390 × 844 ; aucune largeur de document supérieure au viewport.
- [ ] Vérifier visuellement dans Edge, après retrait des voiles, le fond public/admin en thèmes sombre et clair ; le build, les règles CSS et les images servies ont été vérifiés, mais pas le rendu navigateur de cette correction.
- [x] Ouvrir et refermer le menu mobile dans Edge ; les huit liens sont accessibles quand le menu est ouvert.
- [x] Conserver une barre de défilement visible et personnalisée, avec styles standard et WebKit ; styles calculés vérifiés dans Edge.
- [x] Ajouter des animations au scroll avec prise en charge de `prefers-reduced-motion`.
- [x] Ajouter à l’administration un labyrinthe généré et animé, un mode immersif pour masquer la console et une commande discrète pour la réafficher.
- [x] Conserver l’image de fond sous le labyrinthe, ajouter une lumière animée et proposer des réglages mémorisés pour afficher chaque couche et ajuster leur intensité ainsi que la vitesse du labyrinthe.
- [x] Accélérer l’administration en chargeant ses données initiales en parallèle, en actualisant uniquement la collection modifiée et en limitant les balayages DOM et le rendu du labyrinthe.
- [x] Afficher la console dès la validation de la session sans attendre toutes ses données, puis réduire les effets GPU coûteux et mettre en lots le rendu du labyrinthe pour limiter la charge continue.
- [x] Paginer les collections de l’administration afin de limiter le nombre de fiches montées dans le navigateur à 24 par page, même lorsque les données contiennent beaucoup d’éléments.
- [x] Présenter les projets admin en dossiers illustrés, en liste ou dans une silhouette de dossier à onglet relevé avec aperçu, et permettre le dépôt d’images ainsi que le réordonnancement par glisser-déposer.
- [x] Rendre le halo admin statique et sans couche GPU forcée afin d’éviter l’animation permanente coûteuse.
- [x] Permettre de régler séparément l’image, le halo fixe et le labyrinthe du fond public ; laisser le labyrinthe et le halo désactivés par défaut.
- [x] Afficher les états d’attente et de repli du catalogue, et conserver un choix local de technologies si le catalogue distant ne répond pas.
- [x] Adapter des effets de Motion Kit au portfolio : apparition en cascade plus ample, barre de progression liée au scroll, cartes avec inclinaison/reflet au pointeur et transition de page floue en perspective ; garder le tout léger et désactivable selon la préférence de mouvement réduit.
- [x] Animer l’ouverture/fermeture du menu responsive avec arrivée séquencée des liens.
- [x] Ajouter un bouton de thème clair/sombre mémorisé dans le navigateur ; utiliser l’image sombre pour le thème sombre et la seconde image claire pour le thème clair.
- [x] Réduire l’opacité des cartes de la page d’accueil pour laisser voir le fond à travers leur surface vitrée.
- [x] Rendre sticky le menu public et la navigation admin desktop.
- [x] Ajouter une page `/contact` en conservant le formulaire d’accueil.
- [x] Ajouter des filtres de projets partageables par technologie, année et type.
- [x] Ajouter recherche et filtre de catégorie sur les compétences et recherche/filtres de famille pour les fiches IA.

## Priorité P1 — Technologies, compétences et IA

- [x] Proposer un catalogue Iconify étendu (collections `logos`, `devicon`, `simple-icons`) avec recherche, familles et liste locale de secours.
- [x] Préremplir le nom et le logo lors du choix d’une technologie, tout en permettant la personnalisation.
- [x] Laisser choisir une icône officielle, un texte ou une URL personnalisée pour les compétences et technologies.
- [x] Afficher les icônes dans les cartes publiques, les compétences, les technologies et les stacks des projets.
- [x] Ajouter une section publique `/ia` et sa gestion dans l’administration ; les outils sélectionnés apparaissent sur le site public.
- [x] Vérifier le chargement d’un logo Iconify officiel dans Edge.
- [x] Élargir le catalogue IA avec des assistants, des outils et des familles de modèles ; ajouter Manus avec un fallback texte, faute de logo officiel Iconify vérifié.
- [x] Structurer l’administration et la page `/ia` par fournisseur, modèle, assistant/application et outil/framework ; relier les modèles à un fournisseur, avec mode d’accès, description et URL officielle facultatifs.

## Priorité P1 — Profil social

- [x] Proposer plus de 25 réseaux sociaux et plateformes avec leurs logos officiels Iconify.
- [x] Permettre d’ajouter plusieurs liens depuis le tableau de bord et d’afficher les icônes sur la page publique.
- [x] Préserver les anciennes valeurs GitHub et LinkedIn lors de la migration vers la liste de liens.

## Priorité P1 — Contenus et médias administrables

- [x] Compléter les études de cas avec rôle, contexte, responsabilités et résultats.
- [x] Ajouter un type de projet configurable et un filtre partageable dans l’URL.
- [x] Ajouter aux projets des métriques avec libellé, valeur, unité et contexte ; ne pas inventer de résultats.
- [x] Ajouter les témoignages en brouillon et empêcher leur publication sans autorisation confirmée.
- [x] Ajouter le lien de CV facultatif et les réglages de disponibilité, de prise de rendez-vous et de types de mission.
- [x] Ajouter les cas d’usage et la date de vérification aux fiches IA ; ne pas préremplir des usages non confirmés.
- [x] Ajouter des galeries de projet avec ordre, texte alternatif et légende.
- [x] Ajouter le dépôt multiple, la progression et les erreurs par fichier, le remplacement d’image et le réordonnancement accessible de la galerie.
- [x] Permettre de choisir une image de galerie comme couverture sans changer l’ordre des autres images.
- [x] Ajouter et modifier les images de parcours et de projets depuis l’administration.
- [x] Ajouter le téléversement de médias avec validation du format et de la taille.
- [x] Ajouter les brouillons, la publication différée et l’aperçu privé authentifié des projets.
- [x] Ajouter l’import CSV groupé avec prévisualisation, détection des doublons et erreurs par ligne.
- [x] Ajouter l’extraction en mémoire des CV PDF/DOCX, avec limites et aperçu avant toute saisie manuelle ; l’OCR n’est pas activé.
- [x] Ajouter le réordonnancement des projets, compétences, technologies, réalisations et étapes du parcours.
- [x] Ajouter des collections et onglets admin séparés pour formations/diplômes et certifications.
- [x] Distinguer les formations des expériences historiques sur `/parcours`, sans reclassification automatique.
- [x] Ajouter `/certifications`, un aperçu sur l’accueil, les compteurs admin et les champs facultatifs de preuve.
- [x] Ajouter recherche, statuts de traitement et archivage des messages, distincts du statut d’envoi SMTP.
- [x] Ajouter la page de confidentialité, le honeypot contact et la purge manuelle selon la durée de rétention configurée.
- [x] Ajouter des liens sociaux personnalisés avec libellé et icône, en plus des réseaux reconnus.
- [x] Ajouter des réglages éditoriaux de visibilité des pages et de navigation, sans créer de constructeur de site généraliste.
- [x] Ajouter l’état privé des services, les statistiques agrégées par jour/page et un journal admin avec annulation prudente.
- [x] Afficher une dernière modification basée sur le journal réel, sans afficher un horodatage d’exemple.

## Vérifications réalisées

- [x] `pnpm check`, `pnpm test` (6 tests) et `pnpm build` réussis après les derniers changements d’animations et de thème.
- [x] Migrations additives 0001–0008 appliquées à la base configurée ; aucune donnée personnelle, certification, métrique, citation ou usage IA n’a été inventé.
- [x] Après redémarrage du build de production sur `http://127.0.0.1:3002`, `/`, `/contact`, `/ia` et `/admin` répondent HTTP 200 ; `/api/health` répond HTTP 200 et `/api/admin/settings` sans session répond HTTP 401.
- [x] La page servie contient le titre attendu ; l’asset client, les deux feuilles CSS et l’image claire répondent HTTP 200. Les feuilles servies contiennent les styles de scrollbar standard et WebKit.
- [x] Ajouter les sélecteurs des deux thèmes, l’image de fond claire, les transitions de navigation et les styles vitrés des cartes dans les ressources servies.
- [x] API du catalogue confirmée avec 6 547 entrées lors de la dernière vérification ; un logo Iconify a été chargé dans Edge.
- [x] Edge : pages de compétences à 1440 × 900 et 390 × 844, menu mobile fonctionnel, aucun débordement horizontal à 320 px, 390 px ou 1440 px.
- [ ] Revalider visuellement dans Edge le thème clair/sombre, la transparence des cartes, le menu et les nouvelles animations ; l’autorisation de débogage du navigateur n’a pas été accordée dans cette session.
- [x] Styles des deux thèmes, opacité des cartes et scrollbar vérifiés dans la feuille CSS servie ; le rendu calculé et l’apparence dans Edge restent à confirmer.
- [x] Routes d’administration testées sans session : elles refusent l’accès (401).

## À vérifier avec une session propriétaire

- [x] Tester via session propriétaire/CSRF les API de liste, création, édition, suppression, ordre, validation et rendu public pour toutes les collections ; supprimer les données temporaires après contrôle.
- [ ] Rejouer en session propriétaire les parcours interactifs de brouillon, publication programmée, aperçu privé, import CSV, CV, galerie, réglages, purge et annulation ; la session propriétaire n’est pas disponible pour cette vérification.
- [ ] Tester l’extraction d’un document DOCX fourni par le propriétaire ; l’extraction PDF a été vérifiée avec un document de test.
- [x] Build de production réussi ; serveur de production redémarré et vérifié sur le port 3002.
- [x] `pnpm db:migrate` a appliqué les migrations additives 0001–0008 à la base `.env`.
- [x] Vérifier les routes après redémarrage du serveur de production.
- [x] Tester le CRUD des API authentifiées et l’accès aux contenus publics.
- [ ] Tester l’envoi SMTP réel avec une adresse destinataire maîtrisée.

## Pistes d’évolution proposées

### Priorité P1 — Contenu et confiance

- [x] Ajouter les champs de métriques de projets avec unité et contexte ; les chiffres réels doivent venir du propriétaire.
- [x] Ajouter les témoignages avec attribution et garde d’autorisation avant publication.
- [x] Ajouter le lien facultatif du CV et les réglages de disponibilité, rendez-vous et types de mission.
- [x] Structurer fournisseur, modèle, usage déclaré et mode d’accès IA ; la confirmation des outils réellement utilisés reste au propriétaire.

### Priorité P2 — Découverte et interaction

- [x] Filtrer et rechercher les projets par stack et année avec critères partageables dans l’URL.
- [x] Ajouter un type de projet configurable et son filtre partageable.
- [ ] Ajouter une version anglaise complète après validation des textes et du périmètre de traduction.
- [x] Ajouter une page de contact, des réglages de prise de rendez-vous et une protection anti-spam par honeypot.
- [x] Ajouter des liens sociaux personnalisés avec une icône au choix.

### Priorité P3 — Qualité et exploitation

- [ ] Mesurer les performances sur les véritables contenus et définir une politique d’optimisation d’images adaptée aux URL locales et médias Cloudinary.
- [x] Ajouter des statistiques de visites agrégées par jour et page, sans cookie ni IP, et un tableau de bord d’activité.
- [x] Ajouter le journal d’activité admin et l’annulation des changements récents lorsqu’aucune modification plus récente ne rend la restauration dangereuse.
- [ ] Étendre les tests automatisés aux API authentifiées, migrations et parcours admin avec une base de test isolée.
- [x] Distinguer fournisseurs, modèles, assistants/applications et frameworks/outils IA avec relation fournisseur et modes d’accès administrables.

Les images différées et la gestion existante des formats sont en place, mais
l’optimisation systématique en formats modernes et une mesure de performance
de référence restent à faire. La version anglaise et les essais interactifs
nécessitant une session propriétaire ne sont pas considérés comme terminés.

Le projet externe [Animation Kit](https://github.com/Jehudiel270/Animation-kit)
est la référence des effets adaptés ici : apparition au scroll, indicateur de
progression, cartes Tilt/Spotlight et transitions en perspective. Les exemples
du dépôt ont été consultés ; le catalogue en ligne ne s’est pas rendu dans cet
environnement. La version du portfolio est adaptée à Nuxt et à son thème, sans
ajouter GSAP, Motion ou une autre dépendance d’animation.

## Notes

- Le catalogue dépend d’Iconify pour les logos distants ; une liste locale permet de conserver la sélection si le catalogue distant est indisponible.
- Les outils IA ne sont pas ajoutés automatiquement : le propriétaire choisit ceux qui doivent être publiés.
- L’extraction CV ne publie et ne sauvegarde rien automatiquement ; les PDF scannés ne passent pas par OCR.
- Les routes d’administration demeurent protégées par session et jeton CSRF. Les essais de création/modification doivent être effectués avec une session propriétaire, sans exposer les identifiants.

# TODO — Portfolio Carrel DOSSO

## Portfolio public responsive
- [x] « Crée une maquette complète de tout le site avec ça comme base » : portfolio Full Stack complet, net et fondé sur le visuel cyberpunk partagé et la première image fournie en fond (asset statique inclus dans le site).
- [x] « Design sombre et futuriste, fond noir, néons cyan et violet, panneaux transparents, bordures lumineuses et typographie monospace. »
- [x] Design professionnel, immersif, original, responsive et lisible, avec très peu de 3D, interface web réaliste, hiérarchie visuelle claire et expérience fluide; rendus vérifiés sur desktop et mobile.
- [x] Inclure navigation façon terminal; accueil et présentation; projets récents; technologies; compétences; parcours/réalisations; contact.
- [x] Ajouter glitch discret, animations subtiles, curseur clignotant et icônes modernes; respecter `prefers-reduced-motion`.
- [x] Réaliser le site complet en Nuxt 3/Nitro/TypeScript.

## Administration propriétaire
- [x] Ne pas afficher l’accès admin dans la navigation publique; authentifier le propriétaire et protéger également chaque API d’administration côté serveur.
- [x] Depuis le tableau de bord, pouvoir ajouter/éditer/supprimer parcours, projets, réalisations et autres contenus importants.
- [x] Rendre les technologies et compétences éditables depuis l’administration.
- [x] Permettre d’ajouter et modifier une image de profil depuis le tableau de bord.
- [x] Gérer les réglages du profil et du contact; consulter les messages reçus.
- [x] Utiliser `ADMIN_EMAIL`, `ADMIN_PASSWORD` (bootstrap uniquement) et `NUXT_SESSION_PASSWORD`; mot de passe hashé en base, secrets absents du navigateur; retirer le mot de passe bootstrap de `.env` après création.

## Stockage, médias, contact et configuration
- [x] Persister le contenu du portfolio dans Neon PostgreSQL avec schéma additif; bootstrap effectué sans supprimer ni remplacer les données existantes.
- [x] Utiliser Cloudinary pour les médias administrés (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`), téléversement traité côté serveur.
- [x] Configurer le formulaire de contact par SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`) avec `CONTACT_FALLBACK_TO`; annoncer honnêtement les erreurs et ne pas simuler de succès.
- [x] Configurer `NUXT_PUBLIC_SITE_URL` et conserver les valeurs privées côté serveur. Les credentials sont dans `.env` local ignoré par Git; les valeurs partagées dans la conversation sont à renouveler avant publication publique.

## Métadonnées et livraison
- [x] Déclarer `GET /manus-routes.json` avec `/`, `/admin` et leurs titres.
- [x] Vérifier le type-check Nuxt, les routes HTTP, l’API portfolio, la protection sans session et le rendu desktop/mobile.
- [x] Exécuter le build de production après avoir libéré le verrou du serveur de développement.
- [x] Maintenir l’administration protégée par authentification réelle; aucun identifiant fictif n’est affiché.

## Backlog prioritaire à finaliser
- [x] Rendre l’état des données visible : distinguer le contenu en base, la démonstration et une base indisponible.
- [x] Ajouter un parcours détaillé avec dates, descriptions et visuels optionnels.
- [x] Compléter les études de cas avec rôle, contexte, responsabilités, résultats, galerie d’images, textes alternatifs, légendes et ordre.
- [x] Faire des cards plus transparentes et des blocs moins “opaque” : arrière-plan plus doux et profondeur subtile.
- [x] Corriger le fond d’écran pour le laisser derrière toute la page, avec luminosité contrôlée et cadrage sans déformation.
- [x] Rendre les compétences et technologies plus expressives avec icônes, badges, catégories, niveaux et labels plus lisibles côté dashboard et public.
- [x] Proposer une recherche dans le catalogue officiel Iconify, préremplir le nom et le logo dans le dashboard et autoriser la personnalisation de l’icône.
- [x] Afficher des icônes de technologies dans la liste publique, les stacks projet, les compétences et la gestion des technologies dans le dashboard.
- [x] Ajouter des images réelles et des visuels éditables depuis le dashboard pour les projets, galeries et étapes de parcours, avec fallback.
- [x] Téléverser une image de projet depuis le dashboard vers Cloudinary avec validation de format et limite de taille.
- [x] Ajouter des pages dédiées aux projets et relier les cartes à leurs études de cas.
- [x] Ajouter une section dédiée aux réalisations et l’intégrer à la navigation.
- [x] Élargir la section IA avec des fournisseurs, assistants, outils de création et modèles (dont Manus, GPT, Claude, Gemini, Grok, Qwen et Kimi).
- [x] Ajouter les métadonnées SEO et descriptions aux nouvelles routes publiques et aux détails projet.
- [x] Tester via les API d’administration authentifiées : session propriétaire et CSRF, liste, création, édition, suppression, réordonnancement, validation HTTP 400 et visibilité publique pour projets, parcours, formations, certifications, réalisations, compétences et technologies. Les fiches temporaires de test ont été supprimées.
- [x] Structurer les entrées IA en fournisseurs, modèles, assistants et outils/frameworks ; relier un fournisseur, préciser le mode d’accès, une description et un lien officiel facultatifs. Migration additive 0005 appliquée ; aucun contenu historique n’a été modifié.
- [x] Créer des pages de détail projet accessibles depuis les cartes, avec métadonnées SEO, image, stack et liens de démonstration/dépôt.
- [x] Sortir les contenus du parcours, des projets, des compétences et des réalisations vers des pages accessibles par navigation dédiée.
- [x] Afficher clairement si le site présente les données connectées ou un aperçu local de démonstration.
- [x] Importer un CV PDF/DOCX avec extraction en mémoire, limites, aperçu et validation manuelle ; l’OCR est explicitement indisponible.
- [x] Ajouter brouillon/publié, publication programmée et aperçu privé authentifié pour les projets.
- [x] Structurer les études de cas : rôle, contexte, responsabilités et résultats.
- [x] Ajouter la galerie multi-images de projet, l’ordre, le texte alternatif et la légende.
- [x] Organiser la boîte de réception avec recherche, archivage et statut de traitement distinct du statut SMTP.
- [x] Ajouter un réordonnancement accessible des projets, compétences, technologies, réalisations et étapes de parcours.
- [x] Enrichir l’ajout groupé de compétences par CSV : prévisualisation, doublons et validation par ligne.
- [x] Ajouter des collections complètes de logos langages/frameworks/outils et une section IA configurable dans le public et l’administration.
- [x] Ajouter des compétences en lot depuis le dashboard avec validation et rapport d’erreurs par ligne.
- [x] Personnaliser la barre de défilement en cohérence avec le thème, sans masquer le défilement natif.
- [x] Corriger et vérifier la visibilité et l’ouverture du menu de navigation à 320 px et 390 px.
- [x] Gérer plusieurs profils sociaux depuis le dashboard et afficher leurs logos officiels dans le portfolio public.
- [x] Ajouter thème clair/sombre avec l’image claire fournie, cartes d’accueil plus transparentes, menu animé et transitions de page ; adapter d’Animation Kit une barre de progression au scroll, des apparitions en cascade, des cartes Tilt/Spotlight et des transitions en perspective.
- [x] Compléter la galerie par une couverture indépendante, filtrer l’espace IA et afficher la dernière modification réelle dans le dashboard.

## Notes de conception pour la suite
- Le vrai noyau est en place : admin, API, base, rendu HTML et design cyberpunk.
- Les migrations additives 0001–0008 sont appliquées à la base configurée. `pnpm check`, `pnpm test` (6 tests), `pnpm build` et les vérifications HTTP sur le port 3002 sont les validations de cette livraison.
- Les parcours CRUD de base ont été vérifiés lors d’essais précédents ; les parcours nouvellement ajoutés (réglages, statistiques, purge, galerie améliorée, journal et annulation) restent à rejouer en session propriétaire.
- L’envoi SMTP réel reste à tester avec une adresse destinataire maîtrisée. Aucun message n’a été envoyé pendant cette intervention.
- Les vrais outils IA, diplômes, expériences, certifications, métriques, CV et témoignages autorisés restent à renseigner par le propriétaire ; aucun contenu personnel n’a été inventé.
- La version anglaise, l’optimisation des images sur des données réelles et les tests automatisés des API authentifiées restent des chantiers non terminés.
- L’objectif est d’aller d’un portfolio fonctionnel à un portfolio “premium” : plus de lisibilité, plus de profondeur, plus de cohérence entre dashboard et public.
- L’audit de l’existant, les décisions recommandées et le backlog priorisé sont détaillés dans [PLAN-EVOLUTIONS.md](./PLAN-EVOLUTIONS.md).
- L’état des fonctions validées et les vérifications et fonctionnalités encore attendues sont suivis dans [ETAT-AVANCEMENT.md](./ETAT-AVANCEMENT.md).

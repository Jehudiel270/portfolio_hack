# Carrelfolio — Portfolio Full Stack

Portfolio Nuxt 3 responsive, avec un espace d’administration propriétaire, persistance PostgreSQL Neon, médias Cloudinary et formulaire de contact SMTP.

## Démarrage local

1. Installer les dépendances avec `pnpm install`.
2. Copier `.env.example` vers `.env` et y renseigner les valeurs nécessaires. Ne jamais committer `.env`.
3. Initialiser le schéma et le premier compte avec `pnpm admin:create`; cette commande n’écrase pas un administrateur déjà existant et amorce les contenus de démonstration uniquement une première fois.
4. Démarrer avec `pnpm dev` puis ouvrir `http://localhost:3000/` ou `http://localhost:3000/admin`. Si le port 3000 est occupé, Nuxt choisit un autre port et l’indique dans la sortie (par exemple `http://localhost:3002`).

La commande de développement est compatible avec PowerShell et les shells Unix. Pour fixer le port, utilise `pnpm dev --port 3002`. Sur le même ordinateur, ouvre `http://localhost:<port>` dans Edge ou un autre navigateur ; `0.0.0.0` est l’adresse d’écoute du serveur, pas une adresse de navigation. Pour ouvrir le site depuis un autre appareil du réseau local, utilise l’adresse IP locale de cet ordinateur et autorise Node.js sur le réseau privé Windows si le pare-feu le demande.

Les secrets ne sont jamais envoyés au navigateur. `ADMIN_EMAIL` et `ADMIN_PASSWORD` ne servent qu’au script d’initialisation (`ADMIN_PASSWORD` doit contenir au moins 8 caractères); retirer `ADMIN_PASSWORD` après son exécution. Le cookie de session est HTTP-only, Secure et SameSite=None pour les aperçus HTTPS intégrés.

Le formulaire de contact n’annonce une réussite que lorsque le message a été accepté par SMTP. Si le serveur, la base ou le stockage ne sont pas configurés, l’interface indique clairement l’indisponibilité au lieu de simuler une action réussie.

## Contenus et administration

- Les projets possèdent une page publique dédiée à `/projets/<slug>` avec leur description, leurs technologies, leur visuel et leurs liens externes.
- Les pages `/parcours`, `/projets`, `/competences`, `/ia`, `/realisations`, `/certifications` et `/contact` donnent accès directement à chaque partie du portfolio, en plus de la page d’accueil.
- Les formations/diplômes et certifications ont des collections et onglets admin dédiés. `/parcours` les distingue des expériences historiques ; `/certifications` présente dates, badge, compétences et lien de vérification facultatifs.
- La page publique `/projets` permet de rechercher les projets et de les filtrer par technologie et année. Les critères sont conservés dans l’URL et peuvent être partagés.
- Le formulaire de contact est partagé entre l’accueil et `/contact`, afin de conserver le même comportement d’envoi.
- Le menu principal comporte huit pages publiques, dont les pages dédiées `/contact` et `/certifications`.
- Le portfolio utilise des animations d’apparition légères pour les sections et cartes, respecte `prefers-reduced-motion` et garde sa navigation sticky. Le défilement natif reste actif.
- Dans l’onglet **Technologies**, les collections Iconify `logos`, `devicon` et `simple-icons` proposent plusieurs milliers de langages, frameworks, outils et marques. Recherche par nom puis filtre par famille ; l’icône est prévisualisée avant enregistrement.
- Les compétences individuelles ont le même choix explicite entre logo officiel, texte personnalisé (`text:Py`) et URL d’image. L’icône sélectionnée est persistée et réutilisée dans les affichages publics.
- L’onglet privé **IA & modèles** sert à ajouter et administrer les outils réellement utilisés. Les éléments classés **IA** apparaissent dans la page `/ia` et dans la section dédiée de l’accueil ; rien n’est ajouté automatiquement au portfolio.
- Dans **Profil & image**, ajoute plusieurs réseaux sociaux depuis une liste de plateformes connues. Les icônes officielles correspondantes apparaissent automatiquement à côté des liens dans les deux blocs de contact publics. L’ancien GitHub/LinkedIn est conservé et repris automatiquement.
- Dans l’onglet **Compétences** de l’administration, colle une compétence par ligne au format `nom, catégorie, niveau`. La catégorie et le niveau sont facultatifs (valeurs par défaut : `Full Stack`, `75`). Chaque ligne est validée et les échecs partiels sont signalés.
- L’import CSV des compétences accepte `nom,categorie,niveau,icone`, présente une prévisualisation, signale erreurs et doublons, puis n’importe que les lignes choisies.
- Dans l’éditeur d’un projet, définis rôle, contexte, responsabilités, résultats, galerie (images avec texte alternatif/légende/réordonnancement), brouillon ou publication programmée. L’aperçu privé nécessite une session propriétaire.
- Les images de projet et de parcours, ainsi que les captures de galerie, acceptent JPEG, PNG ou WebP de 8 Mo maximum et sont téléversées vers Cloudinary.
- L’onglet **Importer un CV** extrait du texte PDF (30 pages maximum) et DOCX (8 Mo maximum) en mémoire. Aucun fichier n’est stocké ; la sortie est une prévisualisation manuelle, pas une création ou publication automatique. Les PDF scannés nécessitent un OCR, qui n’est pas activé.
- La boîte de réception permet de rechercher, changer le statut de traitement et archiver les messages ; le statut SMTP reste affiché séparément.
- Les flèches dans les listes admin réordonnent les éléments dans une transaction atomique.
- Le badge en haut du portfolio distingue les données persistées, l’aperçu de démonstration et l’indisponibilité de la base.

## Mise à jour de la base existante

`pnpm db:migrate` applique les scripts SQL additifs et réexécutables de `drizzle/`, dont `0004_education_certifications.sql` et `0005_ai_catalog_metadata.sql`, sans supprimer les contenus existants. Le script de création d’administrateur les applique également avant son contrôle de compte.

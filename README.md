# Carrelfolio — Portfolio Full Stack

Portfolio Nuxt 3 responsive, avec un espace d’administration propriétaire, persistance PostgreSQL Neon, médias Cloudinary et formulaire de contact SMTP.

## Démarrage local

1. Installer les dépendances avec `pnpm install`.
2. Copier `.env.example` vers `.env` et y renseigner les valeurs nécessaires. Ne jamais committer `.env`.
3. Initialiser le schéma et le premier compte avec `pnpm admin:create`; cette commande n’écrase pas un administrateur déjà existant et amorce les contenus de démonstration uniquement une première fois.
4. Démarrer avec `pnpm dev` puis ouvrir `http://localhost:3000/` ou `http://localhost:3000/admin`. Si le port 3000 est occupé, Nuxt choisit un autre port et l’indique dans la sortie (par exemple `http://localhost:3002`).

La commande de développement est compatible avec PowerShell et les shells Unix. Pour fixer le port, utilise `pnpm dev --port 3002`. Sur le même ordinateur, ouvre `http://localhost:<port>` dans Edge ou un autre navigateur ; `0.0.0.0` est l’adresse d’écoute du serveur, pas une adresse de navigation. Pour ouvrir le site depuis un autre appareil du réseau local, utilise l’adresse IP locale de cet ordinateur et autorise Node.js sur le réseau privé Windows si le pare-feu le demande.

Les secrets ne sont jamais envoyés au navigateur. `ADMIN_EMAIL` et `ADMIN_PASSWORD` ne servent qu’au script d’initialisation (`ADMIN_PASSWORD` doit contenir au moins 8 caractères); retirer `ADMIN_PASSWORD` après son exécution. Le cookie de session est HTTP-only, Secure, limité à l’hôte admin et SameSite=Lax.

En développement local, `NUXT_APP_ROLE=all` active les pages publiques et admin. La première connexion admin avec le mot de passe existant impose l’inscription d’une application d’authentification TOTP. Saisis la clé dans une application compatible, confirme avec son code, puis conserve les codes de secours dans un gestionnaire de mots de passe.

Le seul super-administrateur est `dossoucarrel@gmail.com`. Après migration, il peut ouvrir **Comptes & permissions** dans le tableau de bord pour créer des administrateurs, leur attribuer des droits précis par section et action, ou utiliser **Tout accorder / Tout retirer** pour l’ensemble des permissions ou une section donnée. Il peut aussi désactiver un compte, changer son mot de passe ou réinitialiser sa 2FA. Les comptes créés n’ont aucun droit par défaut et doivent inscrire leur propre TOTP à la première connexion. Les mots de passe sont hachés avec bcrypt ; les permissions sont contrôlées par les API, pas seulement par l’interface.

## Déployer séparément le site public et l’administration sur Vercel

Le même dépôt sert deux projets Vercel, chacun avec un rôle défini **avant son build**. Le build public ne contient pas les pages admin et bloque `/admin` ainsi que `/api/admin/*`. Le build admin ne contient pas les pages publiques, redirige `/` vers `/admin` et refuse toute autre route. Les API admin exigent toujours une session TOTP vérifiée.

1. Avant la première mise en production avec cette version, mets à jour la base Neon depuis le dépôt local. Confirme que `DATABASE_URL` pointe vers la base de production voulue et que le compte `dossoucarrel@gmail.com` existe, puis lance `pnpm db:migrate`. La migration `0010_admin_permissions.sql` ajoute les rôles et les permissions sans effacer les comptes ou le contenu et promeut cette adresse au rôle super-admin. Ne relance pas `pnpm admin:create` : ton compte existant est conservé.
2. Dans Vercel, importe le même dépôt GitHub comme **deux projets**. Pour les deux, garde la racine du projet à `./`, le preset Nuxt et le build `pnpm build`.
3. Dans le projet **public**, configure `NUXT_APP_ROLE=public`, l’URL du site public (`NUXT_PUBLIC_SITE_URL`), `DATABASE_URL` et les variables de production nécessaires aux fonctionnalités publiques (SMTP pour le formulaire de contact). Associe à ce projet le domaine public habituel.
4. Dans le projet **admin**, configure `NUXT_APP_ROLE=admin`, `DATABASE_URL`, `NUXT_PUBLIC_SITE_URL` avec le domaine public, `NUXT_SESSION_PASSWORD` (la clé secrète existante d’au moins 32 caractères) et les autres variables nécessaires aux fonctions d’administration, notamment Cloudinary. Pour activer l’assistant de brouillon, ajoute également `GEMINI_API_KEY` uniquement aux variables serveur du projet admin. Le modèle par défaut est `gemini-3.6-flash`; `GEMINI_MODEL` peut le remplacer. La clé n’est jamais renvoyée au navigateur. Chaque demande envoie à Google Gemini uniquement les champs éditoriaux choisis dans la fiche après confirmation; les métriques, preuves, témoignages et paramètres ne sont pas transmis. Gemini propose un brouillon à relire : il ne sauvegarde ni ne publie rien automatiquement. Les quotas et conditions d’accès dépendent du projet Google AI Studio. Associe un sous-domaine dédié, par exemple `admin.ton-domaine.com`, à ce projet.
5. Dans le projet Vercel admin, active **Deployment Protection → All Deployments → Vercel Authentication**. Cela ajoute une barrière Vercel aux aperçus et au domaine admin ; connecte-toi avec le compte Vercel autorisé, puis avec le mot de passe admin et le code TOTP. Garde le domaine public uniquement sur le projet public.
6. Déploie les deux projets. Vérifie que `https://ton-domaine.com/admin` renvoie une 404, que `https://admin.ton-domaine.com/` ouvre la connexion admin, et qu’une API admin sans session répond 401. À la première connexion admin, inscris ton authenticator et enregistre les codes de secours affichés une seule fois.

Les variables Vercel sont propres à chaque projet et doivent être définies pour les environnements **Production, Preview et Development** selon le besoin. La valeur `NUXT_APP_ROLE` est utilisée au build comme à l’exécution : redéploie après l’avoir modifiée. N’ajoute pas de domaine de cookie : la session reste liée à l’hôte admin et ne passe pas au site public.

En cas de perte de l’application d’authentification et des codes de secours, la personne ayant accès à la base peut supprimer l’inscription MFA depuis un poste de confiance : définis `ADMIN_MFA_RESET_EMAIL` et `ADMIN_MFA_RESET_CONFIRM` avec la même adresse admin dans l’environnement local, puis lance `pnpm admin:mfa-reset`. La prochaine connexion par mot de passe imposera une nouvelle inscription TOTP.

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
- L’onglet privé **IA & modèles** sert à ajouter et administrer les outils réellement utilisés. Les « Usages vérifiés » décrivent des tâches concrètes réellement testées; ils s’affichent sur `/ia` et alimentent la recherche (12 maximum, 60 caractères chacun). Les éléments classés **IA** apparaissent dans la page `/ia` et dans la section dédiée de l’accueil ; rien n’est ajouté automatiquement au portfolio.
- Les **Réglages du site** sont regroupés par sections repliables. Le décor des icônes flottantes permet de régler la superposition, le nombre, l’opacité, la vitesse, les tailles et durées min./max., l’intervalle d’apparition, la rotation et l’amplitude du flottement. En mouvement réduit, elles restent visibles sans animation.
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

`pnpm db:migrate` applique les scripts SQL additifs et réexécutables de `drizzle/`, dont `0004_education_certifications.sql`, `0005_ai_catalog_metadata.sql` et `0011_project_metrics_and_layout.sql` (métriques et options d’affichage des projets), sans supprimer les contenus existants. Le script de création d’administrateur les applique également avant son contrôle de compte.

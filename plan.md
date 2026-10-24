# Plan — Carrel DOSSO, portfolio cyberpunk administrable

## But et périmètre
Le portfolio Full Stack Nuxt est livré en pages distinctes, avec espace admin protégé et contenu administrable. Le thème sombre cyberpunk conserve l’image `public/images/neon-worksapce.png`; un bouton de thème clair utilise la seconde image `public/images/neon-workspace-light.png`. Les cartes d’accueil sont vitrées et laissent davantage apparaître le fond.

## Architecture et fonctionnement
- Application Nuxt 3/Nitro, Vue et TypeScript; serveur de développement par défaut sur 3000, build de production local vérifié sur 3002, API côté serveur.
- PostgreSQL Neon externe avec `DATABASE_URL`, Drizzle/Postgres et schéma SQL additif pour administrateur, profil, projets, parcours, réalisations, compétences, technologies et messages.
- Connexion propriétaire par e-mail/mot de passe; hash bcrypt en base, jeton de session signé HMAC et cookie HttpOnly/Secure/SameSite=None compatible avec Preview HTTPS. Chaque endpoint d’administration protège lui-même l’accès; les réponses admin sont `no-store`.
- Script `admin:create` amorce les tables, l’administrateur et des données de démonstration sans remplacer un compte existant; le mot de passe n’est nécessaire qu’à ce bootstrap et doit être retiré après celui-ci.
- Cloudinary reçoit les images du profil côté serveur; les identifiants d’API n’atteignent jamais le navigateur.
- Le formulaire valide côté serveur, conserve les messages en base et utilise SMTP/STARTTLS selon les options. Une erreur d’envoi est annoncée honnêtement, sans faux succès.
- Si une intégration n’est pas disponible, l’interface garde le contenu d’aperçu et indique les erreurs sans révéler de secrets ou de traces. Les diagnostics admin ne divulguent pas les credentials.
- Les pages publiques comprennent l’accueil, le parcours, projets/détails, compétences, IA, réalisations, certifications, contact et confidentialité.
- Les filtres projets, compétences et IA fournissent recherche, état vide et filtres partageables quand pertinents.
- Les options de galerie incluent le téléversement multiple, la progression, les erreurs par fichier, le remplacement, le réordonnancement et une couverture indépendante.
- Les témoignages publiés exigent une autorisation confirmée ; métriques, diplômes, CV et usages IA attendent des informations réelles du propriétaire.

## Structure réelle du projet
- `app.vue`, `pages/`, `components/`: rendu SSR du portfolio, accès admin, navigation, panneaux, cartes et icônes.
- `composables/usePortfolioData.ts`: types et données d’aperçu.
- `public/portfolio.css`, `public/portfolio-enhancements.css`: système visuel, responsive, thèmes sombre/clair, animations, scrollbar, focus et préférence de mouvement réduit.
- `server/api/`: santé, lecture publique, contact, session admin, CRUD, profil, messages et téléversement.
- `server/middleware/admin-no-store.ts`, `server/utils/`: cache privé, sessions, schémas/validation, persistance Neon.
- `scripts/admin-create.ts`, `drizzle/0001_portfolio.sql`: bootstrap et tables additives.
- `public/images/neon-worksapce.png`, `public/images/neon-workspace-light.png`: fonds sombre et clair livrés avec le site; `public/manus-routes.json`: routes déclarées.

## Design
- **Mouvement**: Cyberpunk Terminal, station de travail nocturne inspirée des fenêtres d’IDE et du visual novel.
- **Principes**: informations scannables; panneaux de terminal structurés; lisibilité avant décor; mobile soigné.
- **Couleurs**: deux thèmes sélectionnables ; encre/noir bleuté, cyan électrique et violet en sombre, fond pâle et accents bleu/cyan en clair.
- **Mise en page**: barre terminal compacte; rail d’informations et contenu en fenêtres sur grand écran; sections empilées et navigation repliable sur téléphone.
- **Signatures**: barres de fenêtre et points d’état; accent cyan-violet; curseur clignotant et grille discrète.
- **Interactions**: navigation sticky avec menu mobile animé, actions explicites, CRUD et préférences de thème persistantes.
- **Animation**: apparition en cascade, barre de progression liée au scroll, cartes Tilt/Spotlight interactives, transitions de pages en flou/perspective et menu séquencé; prise en charge de `prefers-reduced-motion`. Les effets de [Animation Kit](https://github.com/Jehudiel270/Animation-kit) sont adaptés au portfolio en CSS/DOM natifs.
- **Typographie**: DM Mono pour navigation/microcopie, Space Grotesk pour les textes de lecture; hiérarchie contrastée.
- **Essence**: portfolio d’un développeur Full Stack étudiant à HECM au Bénin, mis en scène comme un poste de travail nocturne — précis, curieux, audacieux.
- **Voix**: directe, chaleureuse et orientée création. « Salut, moi c’est Carrel. Je transforme les idées en produits utiles. »; « Un projet en tête ? On ouvre un canal. »
- **Wordmark**: `carrel@dev:~$` avec symbole terminal et curseur carré.
- **Couleur signature**: cyan électrique.

## Contenu initial et configuration
Les données de départ éditables reprennent les informations non secrètes visibles dans la référence. Le bootstrap Neon a été exécuté avec insertions idempotentes; l’API publique lit le profil et les contenus persistés. Le fichier `.env` de l’environnement local est ignoré par Git; le mot de passe d’amorçage a été retiré après la création du compte. Aucun secret n’est commité.

## État de livraison et éléments à fournir
Le build, le type-check, les six tests ciblés et les routes HTTP sont vérifiés sur le serveur local `http://127.0.0.1:3002`. La validation visuelle de la dernière mise à jour demande l’autorisation de débogage du navigateur local.

Restent dépendants du propriétaire : tester l’envoi SMTP vers un destinataire contrôlé ; fournir/valider les vrais diplômes, expériences, certifications, outils IA, métriques et témoignages autorisés ; fournir un document DOCX de test et une session admin pour rejouer les parcours interactifs. La version anglaise et l’optimisation des images nécessitent un périmètre/texte de traduction et une mesure de performance sur des médias représentatifs. Aucun contenu ni envoi de courriel n’est inventé ou simulé.

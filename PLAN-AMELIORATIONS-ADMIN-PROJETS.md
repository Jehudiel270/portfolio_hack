# Plan — confort d’administration et personnalisation des projets

## Objectif

Rendre l’ajout et la mise à jour des projets fiables, compréhensibles et adaptés aux petits écrans, puis enrichir l’administration avec des outils facultatifs de présentation, de suivi et de notification. Préserver les contenus déjà enregistrés et ne pas remplacer les composants ou comportements existants sans migration compatible.

## Périmètre et décisions

- Travailler dans le clone Git `D:\portfolio\carrelfolio-git`, branche `main`, et non dans l’autre copie locale divergente.
- Contrôler chaque écriture de projet de bout en bout : éditeur → validation → API → schéma SQL → affichage public.
- Garder les listes de technologies d’un projet indépendantes des slots globaux : un projet conserve une copie explicite de ses choix au moment de leur ajout. Modifier ultérieurement un slot ne modifie pas les projets déjà enregistrés.
- Limiter les listes enregistrées à trois slots maximum, renommables et éditables depuis l’administration.
- Désactiver par défaut les icônes flottantes de fond. Leur activation, densité, mouvement, opacité et ensemble d’icônes sont réglables; proposer les technologies/IA enregistrées et des icônes de développement générales.
- Ajouter un éditeur riche uniquement aux champs où la mise en forme apporte une réelle valeur. Le garder désactivable globalement et par emplacement, conserver les textes et saisies bruts existants, et rendre seulement un format explicitement pris en charge.
- Utiliser les données analytiques actuellement disponibles pour les graphiques et signaler les nouveaux messages depuis le tableau de bord avec une fréquence de vérification raisonnable, sans son ni permission de notification navigateur imposés.
- Ne pas modifier le design de l’introduction cinématique, sauf dépendance technique découverte.

## Étapes

1. **Diagnostic et plan** — confirmer le dépôt, sa branche, le remote et l’état des données avant toute modification.
2. **Projets et métriques** — corriger la persistance de `metrics`; remplacer la saisie JSON brute par une interface guidée avec champs facultatifs, explications discrètes, modèles sélectionnables et toujours éditables; conserver la compatibilité des données déjà présentes.
3. **Technologies et slots** — ajouter recherche et sélection des technologies enregistrées au projet; créer jusqu’à trois slots administrables avec nom et technologies; copier les choix du slot dans le projet sans liaison dynamique future.
4. **Éditeur de projet** — expliquer brièvement les champs spécifiques, améliorer la prévisualisation et placer les actions dans une zone cohérente en bas de la modale; renommer l’action « Prévisualiser »; vérifier la modale sur mobile et desktop sans modifier son contenu par débordement.
5. **Fiches publiques** — permettre une personnalisation contrôlée de la présentation des projets et intégrer les icônes flottantes réutilisables comme fond global facultatif et désactivé par défaut, avec liste d’icônes extensible dans l’admin.
6. **Texte riche** — examiner et adapter les composants fournis; ajouter l’édition riche sur les champs descriptifs sélectionnés avec assainissement et repli sûr en texte brut; prévoir un réglage global et des choix par champ.
7. **Tableau de bord** — afficher des graphiques lisibles pour les métriques réellement collectées, avec états sans données; mettre en évidence les messages récents/non lus et rafraîchir prudemment.
8. **Validation, documentation et push** — tests unitaires/API et migrations, typecheck, build et vérifications responsive/public/admin; revue du diff; re-fetch de `origin/main`; commit conventionnel avec le trailer requis; push fast-forward seulement et vérification que `origin/main` contient le commit. Ne jamais forcer ni écraser l’historique distant.

## Critères de validation

- Un projet peut être créé puis rouvert avec ses métriques, technologies, galerie et contenus inchangés.
- Les entrées facultatives vides n’empêchent pas la sauvegarde; une donnée invalide reçoit un message exploitable.
- Les slots ont au plus trois entrées configurables; les projets enregistrés restent identiques lorsque les slots changent.
- Les commandes de prévisualisation et de sauvegarde restent accessibles sans recouvrir ni comprimer le formulaire sur mobile.
- Les icônes flottantes ne s’affichent pas par défaut; les options de l’administration se reflètent côté public après sauvegarde.
- Les contenus préexistants restent affichés correctement; aucune chaîne HTML non assainie n’est exécutée.
- Les graphiques distinguent absence de données et valeur nulle; les notifications ne créent pas de requêtes continues en arrière-plan.
- Les tests, le typecheck et le build passent. Le push est confirmé par comparaison d’ancêtres SHA après fetch; aucun force-push.

## État

- [x] Plan rédigé avant les changements fonctionnels.
- [x] Diagnostic confirmé dans le clone Git et revue des composants fournis.
- [x] Implémentation, migration SQL et tests dédiés au texte riche.
- [x] Vérification du build public/admin et du rendu public + écran de connexion admin sur mobile (390 px) et desktop (1440 px).
- [x] Commit et push fast-forward vérifiés sur `main`.

> La migration `0011` a été appliquée à la base Neon déjà configurée dans l’environnement local, puis les deux colonnes ont été relues et confirmées. Le champ « Usages vérifiés » IA a aussi été clarifié : il est visible sur `/ia` et sert à la recherche, avec validation des 12 usages maximum et des 60 caractères par usage. La session admin authentifiée n’a pas été ouverte ici.

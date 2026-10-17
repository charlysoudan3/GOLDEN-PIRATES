# PRD — GOLDEN PIRATES, Portail de Recrutement (Royaume 1023 — Call of Dragons)

## Problème initial (verbatim utilisateur)
« Crée moi un recrutement digne de pirate je veux en site internet cela me permet au joueur qui souhaite nous rejoindre en fin saison 2 de postuler facilement c'est pour mon alliance GOLDEN PIRATES dans le royaume 1023 dans call of dragon tu me réorganise et tu fais le nécessaire pour que sa fonctionne sur ordinateur et tablette et iOS et smartphone de toutes marques et bien d'autres appareils existants »
Choix confirmés : thème « jamais vu » 100% pirates et impressionnant ; formulaire complet (pseudo, puissance, troupes, activité, expérience, message) ; espaces utilisateur et administrateur séparés ; puissance minimum affichée. Contexte : PRÉ-KVK, saison 1 terminée, saison 2 démarre bientôt, recrutement officiel uniquement en FIN de saison 2 (règle Call of Dragons).

## Personas
- **La Recrue** : joueur de CoD du royaume 1023 (ou migrant), veut postuler facilement depuis mobile et suivre son dossier.
- **Le Capitaine / Officier** (admin) : veut consulter, filtrer, accepter/refuser et annoter les candidatures.
- **Le Curieux** : veut comprendre l'alliance, ses valeurs et le calendrier des saisons.

## Architecture
- **Frontend** : React (CRA) + Tailwind + framer-motion + Lenis. Routes : `/` (vitrine + formulaire), `/suivi` (espace recrue), `/admin` (espace conseil). Design « Dark Naval Opus » : encre profonde (#06090E), or vieilli (#D4AF37), rouge sang, Pirata One / Cinzel Decorative / IM Fell English / JetBrains Mono, grain overlay, boussole 3D.
- **Backend** : FastAPI + Motor (MongoDB `test_database`). JWT HS256 (cookies httpOnly, samesite none, secure) + bcrypt ; anti-brute-force (5 essais → 15 min) ; collection `users` (admin seedé), `applications` (index unique tracking_code), `login_attempts`.
- **API** : POST /api/applications · GET /api/applications/track/{code} · POST /api/admin/login · GET /api/auth/me · POST /api/auth/logout · GET /api/admin/applications · GET /api/admin/stats · PATCH/DELETE /api/admin/applications/{id}.

## Réalisations
- 2026-10-17 : V1 complète — hero cinétique (révélation masquée ligne par ligne + parallaxe + boussole 3D inclinable), marquee éditorial lent, manifeste, Code des Pirates (5 articles, puissance min. 100M affichée), récit des saisons (S1 terminée → PRÉ-KVK en cours → fin de saison 2 = recrutement), processus 4 étapes, formulaire de candidature avec code de suivi GP-1023-XXXX (modale parchemin + copie), espace recrue /suivi, espace conseil /admin (login JWT, stats, filtres, recherche, accepter/refuser/brûler, note du Conseil), footer monumental, favicon SVG boussole.
- 2026-10-17 : Correction hero mobile — barre « Dérouler la carte » passée dans le flux normal sur mobile et parallaxe du contenu inversée (monte au lieu de descendre) : plus aucun chevauchement au scroll.
- 2026-10-17 : Bilingue FR/EN complet — contexte React (lib/i18n.jsx) avec dictionnaire intégral des deux langues, sélecteur FR|EN stratégique (barre de nav desktop, contrôles mobiles, menu mobile plein écran), choix mémorisé en localStorage, langue appliquée à <html lang>, dates localisées (fr-FR / en-GB), statuts et toasts traduits, toutes les pages couvertes (accueil, /suivi, /admin).
- 2026-10-17 : Header refait et épuré — logo désormais sur une seule ligne (plus de repli à la ligne), barre mobile réduite à logo + FR/EN + menu (POSTULER et SUIVRE déplacés dans le menu plein écran en grands boutons), nav desktop allégée (SUIVI raccourci, Espace Conseil via menu/footer). Vérifié sans débordement sur 1440 / 768 / 390 en FR et EN.
- 2026-10-17 : Nav refaite de zéro — « Quartier du Capitaine » : menu plein écran cinématographique identique sur tous les écrans, déclenché par un bouton MENU boussole qui tourne. Structure stratégique en deux camps : NAVIGATION (I. L'alliance, II. Le Code, III. Le Récit, IV. Processus — chiffres romains, crâne au survol, soulignement or) et LES ESPACES (POSTULER en or, SUIVRE MA CANDIDATURE, Espace Conseil discret). Décor : crâne fantôme géant, boussole rose des vents en rotation lente, grille de carte marine, brume animée, ligne de corde tressée sous la barre et en séparation, bandeau inférieur « GOLDEN PIRATES — ROYAUME 1023 ». Barre allégée : logo + FR/EN + POSTULER + MENU (desktop) / logo + FR/EN + MENU (mobile). Fermeture par X rotatif ou touche Échap, verrouillage du scroll, menu défilant en paysage mobile. Vérifié 1440/768/390 + paysage, FR/EN, navigation croisée depuis /suivi et /admin.

## Backlog priorisé
- **P0** : ajuster la puissance minimum (constante MIN_POWER dans PirateCode.jsx et ApplyForm.jsx — actuellement 100M, à confirmer par l'alliance).
- **P1** : lien/invitation Discord officiel de l'alliance sur le site ; export CSV des candidatures.
- **P2** : notification (email/Discord) à chaque nouvelle candidature ; ouverture/fermeture automatique du recrutement par date.

## Tâches suivantes
1. Confirmer la puissance minimum réelle et l'ajuster partout (2 constantes).
2. Ajouter le lien Discord officiel dans le footer + section processus.
3. Déployer (le premier Deploy copie la base de prévisualisation ; ensuite saisissez le contenu réel sur le site en ligne).

# Gestion de projet - API

API REST de gestion de projets : authentification JWT, projets, tâches, statuts,
participants et affectation. Développée dans le cadre du test technique pour le poste
de mentor Informatique & Cybersécurité (Ynov Lille).

Dépôt client associé : https://github.com/nathangerardeaux/gestion-projet-client

## Stack technique

- Node.js 24, Express 5, TypeScript
- MySQL 8.4 (conteneur Docker)
- Authentification : JWT + bcrypt
- Validation manuelle des entrées

## Prérequis

- [Node.js](https://nodejs.org) >= 24
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (démarré)
- Git

## Installation

```bash
git clone https://github.com/nathangerardeaux/gestion-projet-api.git
cd gestion-projet-api
copy .env.example .env   # macOS/Linux : cp .env.example .env
```

Éditer `.env` : renseigner `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD` et `JWT_SECRET`.
Générer le secret JWT avec :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Puis :

```bash
docker compose up -d   # démarre MySQL ; attendre l'état "healthy" (docker compose ps)
npm install
npm run dev            # API disponible sur http://localhost:3000
```

## Comptes de démonstration

| Email            | Mot de passe |
| ---------------- | ------------ |
| demo@exemple.fr  | Demo1234!    |
| alice@exemple.fr | Demo1234!    |
| bob@exemple.fr   | Demo1234!    |

## Endpoints

Toutes les routes sont préfixées par `/api` et exigent un en-tête
`Authorization: Bearer <token>`, sauf le login.

| Méthode | Route                       | Description                            |
| ------- | --------------------------- | -------------------------------------- |
| POST    | /auth/login                 | Connexion, renvoie un jeton JWT        |
| GET     | /auth/me                    | Utilisateur courant                    |
| GET     | /projects                   | Mes projets (propriétaire/participant) |
| POST    | /projects                   | Créer un projet                        |
| GET     | /projects/:id               | Détail d'un projet                     |
| PUT     | /projects/:id               | Modifier (propriétaire)                |
| DELETE  | /projects/:id               | Supprimer (propriétaire)               |
| GET     | /projects/:id/participants  | Participants (propriétaire inclus)     |
| POST    | /projects/:id/participants  | Ajouter un participant par email       |
| GET     | /projects/:id/tasks?status= | Tâches, filtre optionnel par statut    |
| POST    | /projects/:id/tasks         | Créer une tâche                        |
| PUT     | /tasks/:id                  | Modifier une tâche                     |
| PATCH   | /tasks/:id/status           | Changer le statut                      |
| PATCH   | /tasks/:id/assignee         | Affecter ({ "userId": id ou null })    |
| DELETE  | /tasks/:id                  | Supprimer une tâche                    |

## Structure du projet

```
src/
├── index.ts        # point d'entrée : démarre le serveur
├── app.ts          # assemblage Express (middlewares + routes)
├── config/db.ts    # pool de connexions MySQL
├── middlewares/    # auth (JWT), gestion centralisée des erreurs
├── services/       # règles de droits (membre / propriétaire)
├── controllers/    # logique métier
└── routes/         # déclaration des URL
```

## Commandes utiles

| Commande                 | Effet                                         |
| ------------------------ | --------------------------------------------- |
| `npm run dev`            | serveur de développement (rechargement auto)  |
| `npm run build`          | compilation TypeScript vers `dist/`           |
| `npm start`              | exécute la version compilée                   |
| `docker compose down -v` | réinitialise complètement la base de données  |

## Sécurité (points clés)

- Mots de passe hachés avec **bcrypt** (jamais stockés en clair).
- Sessions par **JWT** signé et expirable (24 h).
- **Requêtes SQL paramétrées** partout (protection contre l'injection SQL).
- Contrôle d'accès systématique propriétaire/participant (protection contre les IDOR).
- Validation des entrées côté serveur ; secrets hors du dépôt (`.env`).
- Connexion MySQL via un utilisateur applicatif dédié (moindre privilège).

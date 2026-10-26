# Task API — complete hands-on

Express + MySQL (Aiven) + MVC. One finished project.

```
complete-task-api/
├── .env.example
├── .gitignore
├── package.json
├── server.js
├── test-db.js
├── database/
│   └── schema.sql
└── src/
    ├── db.js
    ├── routes/
    │   └── taskRoutes.js
    ├── controllers/
    │   └── taskController.js
    └── models/
        └── taskModel.js
```

## Setup

1. Create your own Aiven service user (Users → Create service user, `caching_sha2_password`).
2. Copy `.env.example` to `.env` and put **your** username and password.
3. In MySQL Workbench (host/port/SSL from `.env.example`, **your** user), run `database/schema.sql`.
4. Install and start:

```bash
cd complete-task-api
npm install
npm run test:db
npm start
```

Open http://localhost:3000

## Endpoints

| Method | URL | Body | Status |
|--------|-----|------|--------|
| GET | `/` | | 200 |
| GET | `/tasks` | | 200 |
| POST | `/tasks` | `{ "title": "Learn Express" }` | 201 |
| GET | `/tasks/:id` | | 200 / 404 |
| PUT | `/tasks/:id` | `{ "title": "...", "completed": true }` | 200 / 404 |
| PATCH | `/tasks/:id` | `{ "completed": true }` | 200 / 404 |
| DELETE | `/tasks/:id` | | 204 / 404 |
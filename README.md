# SharedPalette Backend

REST API for SharedPalette, a commission art marketplace. Built with Node.js, Express, and PostgreSQL. Deployed to AWS Elastic Beanstalk.

This is the backend half of the project. For the full project overview, architecture, C4 diagrams, and deployment story, see the [frontend repo README](https://github.com/YMONGUCHI/sharedpalette).

## Live API

- **Production URL**: http://sharedpalette-env.eba-23gtgcbe.us-west-1.elasticbeanstalk.com
- **Frontend**: https://d1mpjs6zvo988o.cloudfront.net
- **Frontend repo**: [github.com/YMONGUCHI/sharedpalette](https://github.com/YMONGUCHI/sharedpalette)

## Tech Stack

- Node.js with Express
- PostgreSQL via the `pg` library (connection pooled)
- `cors` for cross-origin requests
- `dotenv` for environment variable management
- `bcrypt` for password hashing
- `jsonwebtoken` for JWT-based authentication
- `nodemon` for development auto-reload

## Project Structure

~~~
sharedpalette-backend/
├── index.js              (Express server, all routes including auth)
├── Procfile              (Elastic Beanstalk start command)
├── .env                  (gitignored, holds DB credentials for local dev)
├── .gitignore
└── package.json
~~~

## Getting Started Locally

### Prerequisites

- Node.js 18 or higher
- npm
- PostgreSQL 16 or higher (running locally)

### Setup

~~~bash
git clone https://github.com/YMONGUCHI/sharedpalette-backend.git
cd sharedpalette-backend
npm install
~~~

Create a `.env` file in the project root with your local PostgreSQL credentials:

~~~
DB_USER=postgres
DB_HOST=localhost
DB_NAME=sharedpalette
DB_PASSWORD=your_local_password
DB_PORT=5432
JWT_SECRET=any_random_string_for_local_dev
~~~

### Database

Connect to PostgreSQL via psql and create the database:

~~~sql
CREATE DATABASE sharedpalette;
~~~

Connect to the new database and run the schema (full SQL in the frontend README's Database Schema section).

### Run

~~~bash
npm run dev       # auto-reloading dev server (uses nodemon)
~~~

or

~~~bash
npm start         # plain start (production-style)
~~~

The API will be available at `http://localhost:3001`.

## API Endpoints

All endpoints return JSON. POST and PUT requests expect JSON bodies with `Content-Type: application/json`.

### Listings

- `GET /listings`
- `GET /listings/:id`
- `POST /listings`
- `PUT /listings/:id`
- `DELETE /listings/:id`

### Users

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

### Orders

- `GET /orders`
- `GET /orders/:id`
- `POST /orders`
- `PUT /orders/:id`
- `DELETE /orders/:id`

### Messages

- `GET /messages`
- `GET /messages/:id`
- `POST /messages`
- `PUT /messages/:id`
- `DELETE /messages/:id`

### Authentication

- `POST /signup` creates a new user with hashed password, returns JWT token
- `POST /login` verifies credentials, returns JWT token
- `GET /me` returns the logged-in user's info (requires `Authorization: Bearer <token>` header)

### Response patterns

- GET endpoints return status 200 and either an array of rows or a single row object
- POST endpoints return status 201 and the newly created row
- PUT and DELETE endpoints return status 200 and either the updated/deleted row or status 404 if the id is not found
- All endpoints return status 500 with an error message if a database query fails

## Deployment

Deployed to AWS Elastic Beanstalk in the N. California (us-west-1) region. The database lives on a separate AWS RDS PostgreSQL instance in the same region.

Required prep before deployment:

1. `Procfile` at the project root with `web: node index.js`
2. `index.js` reads port from `process.env.PORT` for EB compatibility
3. SSL config added to the Postgres connection pool (RDS requires SSL)
4. Environment variables (`DB_USER`, `DB_HOST`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `JWT_SECRET`) set as EB environment properties, not in code

For the full deployment walkthrough including all the challenges hit along the way, see the [frontend repo README](https://github.com/YMONGUCHI/sharedpalette).
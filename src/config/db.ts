import mysql from 'mysql2/promise';
import 'dotenv/config';

// Pool de connexions : on garde quelques connexions ouvertes et on les reutilise,
// au lieu d'en ouvrir/fermer une a chaque requete HTTP (plus rapide et plus stable).
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

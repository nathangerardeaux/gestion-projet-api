-- Comptes de demonstration. Mot de passe commun (en clair, car factice) : Demo1234!
-- Le hash bcrypt ci-dessous a ete genere avec bcrypt.hash('Demo1234!', 10).
INSERT INTO users (email, password_hash, name) VALUES
  ('demo@exemple.fr',  '$2b$10$8QFuEVGec6AUX4mHPj4.1OQQPaHIlMJqLsrCChNt3Q8PPxmlIC0hu', 'Utilisateur Demo'),
  ('alice@exemple.fr', '$2b$10$8QFuEVGec6AUX4mHPj4.1OQQPaHIlMJqLsrCChNt3Q8PPxmlIC0hu', 'Alice Martin'),
  ('bob@exemple.fr',   '$2b$10$8QFuEVGec6AUX4mHPj4.1OQQPaHIlMJqLsrCChNt3Q8PPxmlIC0hu', 'Bob Durand');

-- Un projet de demonstration appartenant a demo (id 1), avec alice (id 2) comme participante.
INSERT INTO projects (title, description, owner_id) VALUES
  ('Refonte du site vitrine', 'Projet de demonstration pour le test technique.', 1);

INSERT INTO project_members (project_id, user_id) VALUES (1, 2);

-- Quelques taches d'exemple dans ce projet.
INSERT INTO tasks (project_id, title, description, status, assignee_id) VALUES
  (1, 'Preparer la base de donnees', 'Modeliser et creer le schema.', 'done', 1),
  (1, 'Maquetter les ecrans', 'Login, liste des projets, detail.', 'in_progress', 2),
  (1, 'Rediger la documentation', 'README et documentation technique.', 'todo', NULL);

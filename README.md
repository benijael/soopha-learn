# SooPHA Learn — Guide de déploiement

## Résumé de l'architecture

```
soopha-learn.com  (Netlify/Vercel)
       │
       └── Supabase (auth + base de données)
              ├── Auth (email + Google)
              ├── Table: profiles
              ├── Table: qcm_results
              └── Table: course_completions
```

---

## Étape 1 — Créer le projet Supabase

1. Va sur **supabase.com** → Sign in → **New Project**
2. Nom : `soopha-learn`
3. Région : **West EU (Ireland)** — la plus proche de l'Afrique
4. Mot de passe BDD : génère-en un fort, sauvegarde-le
5. Attends ~2 minutes que le projet se crée

---

## Étape 2 — Configurer la base de données

1. Dans ton projet Supabase → **SQL Editor** → **New Query**
2. Colle tout le contenu du fichier `supabase-setup.sql`
3. Clique **Run**
4. Tu dois voir "Success" — si erreur, relis le message

---

## Étape 3 — Récupérer tes clés API

1. Supabase → **Settings** → **API**
2. Note :
   - **Project URL** : `https://xxxxxxxx.supabase.co`
   - **anon public key** : `eyJhbGci...`

---

## Étape 4 — Configurer le fichier js/config.js

Ouvre `js/config.js` et remplace :

```javascript
const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...ton-anon-key...';
```

---

## Étape 5 — Activer Google OAuth (optionnel mais recommandé)

1. Supabase → **Authentication** → **Providers** → **Google**
2. Active le toggle
3. Va sur **console.cloud.google.com** → Créer un projet → OAuth 2.0
4. Colle le Client ID et Secret dans Supabase
5. Dans les URLs autorisées, ajoute :
   - `https://xxxxxxxx.supabase.co/auth/v1/callback`
   - `https://soopha-learn.com`

---

## Étape 6 — Configurer les URLs de redirection

Supabase → **Authentication** → **URL Configuration** :
- **Site URL** : `https://soopha-learn.com`
- **Redirect URLs** :
  ```
  https://soopha-learn.com/pages/dashboard.html
  https://soopha-learn.com/pages/login.html
  ```

Pour les tests locaux, ajoute aussi :
```
http://localhost:3000
http://127.0.0.1:5500
```

---

## Étape 7 — Déployer sur Netlify

1. Va sur **netlify.com** → **Add new site** → **Deploy manually**
2. Glisse le dossier `soopha-learn-v2/` sur la page
3. Netlify te donne une URL temporaire genre `amazing-name.netlify.app`
4. **Site settings** → **Custom domain** → entre `soopha-learn.com`
5. Dans IONOS → DNS → ajoute :
   ```
   Type : CNAME
   Hôte : www
   Valeur: amazing-name.netlify.app
   
   Type : A
   Hôte : @
   Valeur: 75.2.60.5 (Netlify Load Balancer)
   ```

---

## Étape 8 — Ajouter un cours

Pour ajouter J2 et J3, crée `pages/j2.html` et `pages/j3.html` en suivant 
le modèle de `cours/j1.html` (dans l'archive soopha-learn.zip).

Le modèle utilise `saveQcmProgress()` et `completeCourse()` depuis `js/auth.js`.

---

## Structure des fichiers

```
soopha-learn-v2/
├── index.html              → Landing page publique
├── css/
│   └── global.css          → Design system complet
├── js/
│   ├── config.js           → ⚠️ À REMPLIR avec tes clés Supabase
│   └── auth.js             → Fonctions auth et BDD
├── pages/
│   ├── login.html          → Connexion
│   ├── register.html       → Inscription
│   └── dashboard.html      → Tableau de bord utilisateur
└── supabase-setup.sql      → Script SQL à exécuter une seule fois
```

---

## Tester en local

```bash
# Option 1 — Python (si installé)
python3 -m http.server 3000
# Ouvre http://localhost:3000

# Option 2 — VS Code Live Server extension
# Clic droit sur index.html → Open with Live Server
```

---

## Ajouter la V2 (crédits CTF)

Quand tu seras prêt pour la V2 (crédits Formation → hints CTF) :
1. Ajoute une table `credits` dans Supabase
2. `completeCourse()` dans `auth.js` crédite automatiquement
3. CTFd appelle l'API Supabase pour vérifier les crédits

---

## Support

Béni-Jaël — toute la logique est dans `js/auth.js`.
Chaque fonction est commentée. Tu peux tout modifier sans toucher à la BDD.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('../db');

// === MULTER CONFIGURATION ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// === MIDDLEWARE AUTHENTIFICATION ===
function requireAuth(req, res, next) {
  if (!req.session.user || !req.session.user.id) {
    return res.redirect('/');
  }
  next();
}



// === ROUTE LOGIN ===
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM utilisateurs WHERE email = ?';

  db.query(sql, [email], (err, results) => {
    if (err) return res.render('login', { error: 'Erreur serveur' });
    if (results.length === 0) return res.render('login', { error: 'Utilisateur non trouvé' });

    const user = results[0];
    bcrypt.compare(password, user.mot_de_passe, (err, result) => {
      if (err) return res.render('login', { error: 'Erreur serveur' });
      if (!result) return res.render('login', { error: 'Mot de passe incorrect' });

      req.session.user = {
        id: user.id,
        email: user.email,
        nom: user.nom,
        role: user.role
      };
      res.redirect('/admin');
    });
  });
});
router.get('/new-password', (req, res) => {
  if (!req.session.resetUserId) return res.redirect('/login');
  res.render('new_password');
});

router.post('/new-password', async (req, res) => {
  const { password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const userId = req.session.resetUserId;

  await db.query('UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?', [hashed, userId]);
  req.session.resetUserId = null;

  res.send('Mot de passe mis à jour avec succès. <a href="/login">Se connecter</a>');
});

router.get('/reset-password', (req, res) => {
  res.render('reset_password'); // vue à créer
});


// === DASHBOARD ADMIN ===
router.get('/admin', requireAuth, (req, res) => {
  const utilisateurId = req.session.user.id;

  const getUser = 'SELECT * FROM utilisateurs WHERE id = ?';
  const getCategories = 'SELECT * FROM categories';
  const getChants = `SELECT chants.*, categories.nom AS categorie_nom 
                     FROM chants 
                     LEFT JOIN categories ON chants.categorie_id = categories.id 
                     LIMIT 10`;
  const getFavoris = 'SELECT * FROM favoris';

  db.query(getUser, [utilisateurId], (err, userResults) => {
    if (err || userResults.length === 0) return res.send("Erreur utilisateur");
    const utilisateur = userResults[0];

    db.query(getCategories, (err, categoriesResults) => {
      if (err) return res.send("Erreur catégories");

      db.query(getChants, (err, chantsResults) => {
        if (err) return res.send("Erreur chants");

        db.query(getFavoris, (err, favorisResults) => {
          if (err) return res.send("Erreur favoris");

          res.render('admin', {
            utilisateur,
            categories: categoriesResults,
            chants: chantsResults,
            favoris: favorisResults,
          });
        });
      });
    });
  });
});

// === AJOUT CATÉGORIE ===
router.post('/categories', upload.single('photo'), requireAuth, (req, res) => {
  const { nom, description } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = 'INSERT INTO categories (nom, description, photo) VALUES (?, ?, ?)';
  db.query(sql, [nom, description, photo], (err) => {
    if (err) {
      console.error('Erreur ajout catégorie :', err);
      return res.status(500).send('Erreur serveur');
    }
    res.redirect('/admin');
  });
});

// === FORMULAIRE ÉDITION CATÉGORIE ===
router.get('/categories/:id/edit', requireAuth, (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM categories WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).send('Catégorie non trouvée');
    res.render('edit_categorie', { categorie: results[0] });
  });
});

// === MISE À JOUR CATÉGORIE ===
router.post('/categories/:id/update', upload.single('photo'), requireAuth, (req, res) => {
  const id = req.params.id;
  const { nom, description } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = photo
    ? 'UPDATE categories SET nom = ?, description = ?, photo = ? WHERE id = ?'
    : 'UPDATE categories SET nom = ?, description = ? WHERE id = ?';

  const params = photo ? [nom, description, photo, id] : [nom, description, id];

  db.query(sql, params, (err) => {
    if (err) {
      console.error('Erreur mise à jour catégorie :', err);
      return res.status(500).send('Erreur serveur');
    }
    res.redirect('/admin');
  });
});
// FORMULAIRE POUR AJOUTER UNE CATÉGORIE
router.get('/categories/new', requireAuth, (req, res) => {
  res.render('add_categorie');
});

// === AJOUT CHANT ===
router.post('/chants', upload.single('image'), requireAuth, (req, res) => {
  const { titre, paroles, compositeur, langue, categorie_id, numero_page } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = `
    INSERT INTO chants 
    (titre, paroles, compositeur, langue, categorie_id, numero_page, image, date_ajout) 
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;

  db.query(sql, [titre, paroles, compositeur, langue, categorie_id, numero_page, image], (err) => {
    if (err) {
      console.error('Erreur ajout chant :', err);
      return res.status(500).send('Erreur serveur');
    }
    res.redirect('/admin');
  });
});
router.get('/chants/new', (req, res) => {
  res.render('add_chant', { categories }); // Assure-toi de passer les catégories si ton formulaire en a besoin
});
router.get('/chants/new', (req, res) => {
  res.render('add_categorie', { categories }); // Assure-toi de passer les catégories si ton formulaire en a besoin
});


// FORMULAIRE POUR AJOUTER UN CHANT
router.get('/admin/chants/new', requireAuth, (req, res) => {
  db.query('SELECT * FROM categories', (err, categories) => {
    if (err) return res.status(500).send('Erreur chargement catégories');
    res.render('add_chant', { categories });
    console.log(categories)
  });
});


// === FORMULAIRE ÉDITION CHANT ===
router.get('/admin/chants/:id/edit', requireAuth, (req, res) => {
  const id = req.params.id;

  db.query('SELECT * FROM chants WHERE id = ?', [id], (err, chantResults) => {
    if (err || chantResults.length === 0) return res.status(404).send('Chant non trouvé');

    db.query('SELECT * FROM categories', (err, categoriesResults) => {
      if (err) return res.status(500).send('Erreur chargement catégories');

      res.render('edit_chant', {
        chant: chantResults[0],
        categories: categoriesResults
      });
    });
  });
});

// === MISE À JOUR CHANT ===
router.post('/admin/chants/:id/update', upload.single('image'), requireAuth, (req, res) => {
  const id = req.params.id;
  const { titre, paroles, compositeur, langue, categorie_id, numero_page } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = image
    ? `UPDATE chants SET titre = ?, paroles = ?, compositeur = ?, langue = ?, categorie_id = ?, numero_page = ?, image = ? WHERE id = ?`
    : `UPDATE chants SET titre = ?, paroles = ?, compositeur = ?, langue = ?, categorie_id = ?, numero_page = ? WHERE id = ?`;

  const params = image
    ? [titre, paroles, compositeur, langue, categorie_id, numero_page, image, id]
    : [titre, paroles, compositeur, langue, categorie_id, numero_page, id];

  db.query(sql, params, (err) => {
    if (err) {
      console.error('Erreur mise à jour chant :', err);
      return res.status(500).send('Erreur serveur');
    }
    res.redirect('/admin');
  });
});

// === SUPPRESSION CHANT ===
router.post('/chants/:id/delete', requireAuth, (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM chants WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Erreur suppression chant :', err);
      return res.status(500).send('Erreur serveur');
    }
    res.redirect('/admin');
  });
});
// Deconnexion 
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Erreur déconnexion :', err);
      return res.redirect('/admin');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});




module.exports = router;

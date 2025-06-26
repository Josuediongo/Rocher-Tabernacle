const bcrypt = require('bcrypt');

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




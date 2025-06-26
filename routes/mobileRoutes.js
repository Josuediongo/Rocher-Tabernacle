router.get('/mobile', (req, res) => {
  db.query('SELECT * FROM categorie', (err, results) => {
    if (err) return res.status(500).send('Erreur DB');
    res.render('mobile', { categories: results });
  });
});
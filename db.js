const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'receuil de chants'
});

db.connect(err => {
  if (err) {
    console.error('Erreur de connexion DB :', err);
  } else {
    console.log('Connexion DB réussie');
  }
});

module.exports = db;



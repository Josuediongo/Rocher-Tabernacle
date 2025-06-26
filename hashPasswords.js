const bcrypt = require('bcrypt');
const db = require('./db'); // adapte si ton fichier db est ailleurs

const saltRounds = 10;

// Récupère tous les utilisateurs
db.query('SELECT id, mot_de_passe FROM utilisateurs', async (err, users) => {
  if (err) {
    console.error('❌ Erreur récupération utilisateurs :', err);
    return;
  }

  for (const user of users) {
    const id = user.id;
    const motDePasse = user.mot_de_passe;

    // Ignore déjà hashé
    if (motDePasse.startsWith('$2b$')) {
      console.log(`✅ Utilisateur ${id} : déjà hashé`);
      continue;
    }

    try {
      const hash = await bcrypt.hash(motDePasse, saltRounds);

      db.query(
        'UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?',
        [hash, id],
        (err2) => {
          if (err2) {
            console.error(`❌ Erreur mise à jour utilisateur ${id} :`, err2);
          } else {
            console.log(`🔒 Utilisateur ${id} : mot de passe hashé`);
          }
        }
      );
    } catch (err3) {
      console.error(`❌ Erreur hashage utilisateur ${id} :`, err3);
    }
  }
});
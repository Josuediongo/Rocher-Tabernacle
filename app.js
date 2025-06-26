const express = require('express');
const session = require('express-session');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');
const path = require('path');


const app = express();

app.use(express.static(__dirname + '/public'));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(session({
  secret: 'eglise',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 2
  }
}));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', (req, res) => {
  res.render('login', { error: null });
});

app.use('/', adminRoutes);

app.use((req, res) => {
  res.status(404).send('Page non trouvée');
});

module.exports = app;
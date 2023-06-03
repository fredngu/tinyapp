const express = require("express");
const {getUserByEmail, generateRandomString, urlsForUser} = require('./helpers');
const cookieSession = require("cookie-session");
// const methodOverride = require('method-override')
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {
};

const users = {
};

// Enable usage of ejs (embedded javascript) -> render
// EJS removes one object item - so we use TemplateVars to bring it back
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));

// app.use(methodOverride('_method'));

// Homepage ('/')
app.get("/", (req, res) => {
  res.redirect('/login')
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// URL Main Page
app.get("/urls", (req, res) => {
  let user_id = req.session.user_id;
  if (!users[user_id]) {
    res.status(403).end(`<html><body>Status 403: Login to view urls</body></html>\n`);
  } else {
    let userURLS = urlsForUser(user_id, urlDatabase);
    const templateVars = { user: users, urls: userURLS, user_id };
    res.render("urls_index", templateVars);
  }
});

// URL Shortening Page
app.get("/urls/new", (req, res) => {
  let user_id = req.session.user_id;
  const templateVars = { user: users, user_id };
  if (!templateVars.user[user_id]) {
    res.redirect('/login');
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/register", (req, res) => {
  let user_id = req.session.user_id;
  if (users[user_id]) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: users, user_id };
    res.render("urls_register", templateVars);
  }
});

app.get("/login", (req, res) => {
  let user_id = req.session.user_id;
  if (users[user_id]) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: users, user_id };
    res.render("urls_login", templateVars);
  }
});

// URL Page for the Short URLS
app.get("/urls/:id", (req, res) => {
  let user_id = req.session.user_id;
  let userInput = req.params.id;
  let user_URLS = urlsForUser(user_id, urlDatabase);
  if (!user_id) {
    res.status(403).end(`<html><body>Status 403: User must be logged in to see URL</body></html>\n`)
  } else if (!urlDatabase[userInput]) {
    res.status(404).end(`<html><body>Status 404: URL not found</body></html>\n`)
  } else if (!user_URLS[userInput]) {
    res.status(403).end(`<html><body>Status 403: Only user can access this URL</body></html>\n`)
  } else {
    const templateVars = { user: users, id: req.params.id, longURL: urlDatabase[userInput]["longURL"], user_id };
    res.render("urls_show", templateVars);
  }
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email) {
    res.redirect('/register');
  } else {
    if (getUserByEmail(email, users)) {
      res.status(400).end(`<html><body>Status 400: Username already exists</body></html>\n`)
    } else if (email === "" || password === "") {
      res.status(400).end(`<html><body>Status 400: Username/Password is blank</body></html>\n`)
    } else {
      const hashedPassword = bcrypt.hashSync(password, 10);
      let newRandomUserID = generateRandomString();
      users[newRandomUserID] = {
        id: newRandomUserID,
        email,
        password: hashedPassword
        };
      req.session.user_id = newRandomUserID;
      res.redirect('/urls');
    }
  }
});

app.post("/login", (req, res) => {
  const loginEmail = req.body.email;
  const loginPassword = req.body.password;

  let loginUser = getUserByEmail(loginEmail, users)

  if (!loginEmail) {
    res.redirect('/login');
  } else if (loginUser === undefined) {
    res.status(403).end(`<html><body>Status 403: Username not found</body></html>\n`)
  } else {
    if (!bcrypt.compareSync(loginPassword, loginUser["password"])) {
      req.session.user_id = loginUser;
      res.redirect('/urls');
    } else {
      res.status(403).end(`<html><body>Status 403: Password incorrect</body></html>\n`)
    }
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// Makes a new short url for submitted long url and redirects to urls/:id
app.post("/urls", (req, res) => {
  let user_id = req.session.user_id;
  if (!user_id) {
    res.status(403).end(`<html><body>Status 403: Must login to shorten URLs</body></html>\n`)
  } else {
    console.log(req.body); // Log the POST request body to the console
    let newShortURL = generateRandomString();
    urlDatabase[newShortURL] = { longURL: req.body.longURL, userID: user_id };
    res.redirect(`/urls/${newShortURL}`);
  }
});

app.post("/urls/:id", (req, res) => {
  let userInput = req.params.id;        //shortURL
  let user_id = req.session.user_id; //Cookie for user_id
  let user_URLS = urlsForUser(user_id, urlDatabase); //URLs belonging to the user_id

  if (!urlDatabase[userInput]) {
    res.status(404).end(`Status 404: URL does not exist`)
  } else if (!user_id) {
    res.status(403).end(`Status 403: User is not logged in`)
  } else if (!user_URLS[userInput]) {
    res.status(403).end(`Status 403: User does not own URL`)
  } else {
    res.redirect(`/urls/${userInput}`);
  }
});

app.post("/urls/:id/edit", (req, res) => {
  const userInput = req.params.id;
  urlDatabase[userInput]["longURL"] = req.body.longURL;
  res.redirect(`/urls`);
});

app.post("/urls/:id/delete", (req, res) => {
  let userInput = req.params.id;
  let user_id = req.session.user_id;
  let user_URLS = urlsForUser(user_id, urlDatabase);

  if (!urlDatabase[userInput]) {
    res.status(404).end(`Status 404: URL does not exist`)
  } else if (!user_id) {
    res.status(403).end(`Status 403: User is not logged in`)
  } else if (!user_URLS[userInput]) {
    res.status(403).end(`Status 403: User does not own URL`)
  } else {
    delete urlDatabase[userInput];
    res.redirect('/urls');
  }
});

// Send to the long url using the short url via /u/:id
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]["longURL"];
  res.redirect(longURL);
});


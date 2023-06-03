const express = require("express");
const {getUserByEmail, generateRandomString, urlsForUser} = require('./helpers');
const cookieSession = require("cookie-session"); //Encrypt cookies
// const methodOverride = require('method-override')
const bcrypt = require("bcryptjs"); //Hash passwords
const app = express();
const PORT = 8080; // default port 8080

// All urls will go here
const urlDatabase = {
};

// All user information will go here
const users = {
};

// Enable usage of ejs (embedded javascript) -> render
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Homepage ('/')
app.get("/", (req, res) => {
  const userID = req.session.userID;
  if (userID) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// URL Main Page
app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  const userURLS = urlsForUser(userID, urlDatabase);
  const templateVars = { user: users, urls: userURLS, userID };
  res.render("urls_index", templateVars);
});

// URL Shortening Page
app.get("/urls/new", (req, res) => {
  const userID = req.session.userID;
  const templateVars = { user: users, userID };
  if (!templateVars.user[userID]) {
    res.redirect('/login');
  } else {
    res.render("urls_new", templateVars);
  }
});

// URL Page for the Short URLS
app.get("/urls/:id", (req, res) => {
  const userID = req.session.userID;
  const shortURL = req.params.id;
  const userURLS = urlsForUser(userID, urlDatabase);
  //Error checks
  if (!users[userID] || !userURLS[shortURL]) {
    res.status(403).end(`<html><body>Status 403: User must be logged in to see URL</body></html>\n`);
  } else if (!urlDatabase[shortURL]) {
    res.status(404).end(`<html><body>Status 404: URL not found</body></html>\n`);
  } else {
    //Creates page for short urls
    const templateVars = { user: users, id: req.params.id, longURL: urlDatabase[shortURL]["longURL"], userID };
    res.render("urls_show", templateVars);
  }
});

// Send to the long url using the short url via /u/:id
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(404).end(`<html><body>Status 404: URL not found</body></html>\n`);
  } else {
    const longURL = urlDatabase[req.params.id]["longURL"];
    res.redirect(longURL);
  }
});

// Makes a new short url for submitted long url and redirects to urls/:id
app.post("/urls", (req, res) => {
  const userID = req.session.userID;
  if (!userID) {
    res.status(403).end(`<html><body>Status 403: Must login to shorten URLs</body></html>\n`);
  } else {
    // Generate short url
    const newShortURL = generateRandomString();
    urlDatabase[newShortURL] = { longURL: req.body.longURL, userID };
    res.redirect(`/urls/${newShortURL}`);
  }
});

// Open short url information page
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id; //shortURL
  const userID = req.session.userID; //Cookie for userID
  const userURLS = urlsForUser(userID, urlDatabase); //URLs belonging to the userID

  // Prevent users from accessing sites without login
  if (!urlDatabase[shortURL]) {
    res.status(404).end(`Status 404: URL does not exist`);
  } else if (!userID) {
    res.status(403).end(`Status 403: User is not logged in`);
  } else if (!userURLS[shortURL]) {
    res.status(403).end(`Status 403: User does not own URL`);
  } else {
    res.redirect(`/urls/${shortURL}`);
  }
});

// Change longUrl attached to shortUrl
app.post("/urls/:id/edit", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL]["longURL"] = req.body.longURL;
  res.redirect(`/urls`);
});

// Delete short urls from url database
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  const userID = req.session.userID;
  const userURLS = urlsForUser(userID, urlDatabase);

  // Prevent users from deleting short urls without login
  if (!urlDatabase[shortURL]) {
    res.status(404).end(`Status 404: URL does not exist`);
  } else if (!userID) {
    res.status(403).end(`Status 403: User is not logged in`);
  } else if (!userURLS[shortURL]) {
    res.status(403).end(`Status 403: User does not own URL`);
  } else {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  }
});

// Login Page
app.get("/login", (req, res) => {
  const userID = req.session.userID;
  const templateVars = { user: users, userID };
  res.render("urls_login", templateVars);
});

// Registration Page
app.get("/register", (req, res) => {
  const userID = req.session.userID;
  if (users[userID]) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: users, userID };
    res.render("urls_register", templateVars);
  }
});

// Login
app.post("/login", (req, res) => {
  const loginEmail = req.body.email;
  const loginPassword = req.body.password;
  const loginUser = getUserByEmail(loginEmail, users); //Returns userID for email

  // User and Password checks
  if (!loginEmail) {
    res.redirect('/login');
  } else if (loginUser === undefined) {
    res.status(403).end(`<html><body>Status 403: Username not found</body></html>\n`);
  } else if (!bcrypt.compareSync(loginPassword, users[loginUser]['password'])) {
    res.status(403).end(`<html><body>Status 403: Password incorrect</body></html>\n`);
  } else {
    req.session.userID = loginUser;
    res.redirect('/urls');
  }
});

// Register - Add new account to users object
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email) {
    //If no email is written, refresh page
    res.redirect('/register');
  } else {
    //Error catching
    if (getUserByEmail(email, users)) {
      res.status(400).end(`<html><body>Status 400: Username already exists</body></html>\n`);
    } else if (!email || !password) {
      res.status(400).end(`<html><body>Status 400: Username/Password is blank</body></html>\n`);
    } else {
      //Create new user account
      const hashedPassword = bcrypt.hashSync(password, 10);
      const newRandomUserID = generateRandomString();
      users[newRandomUserID] = {
        id: newRandomUserID,
        email,
        password: hashedPassword
      };
      req.session.userID = newRandomUserID;
      res.redirect('/urls');
    }
  }
});

// Log out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// Catchall
app.get("*", (req, res) => {
  const userID = req.session.userID;
  if (users[userID]) {
    res.redirect('/urls');
    return;
  }
  res.redirect('/login');
});
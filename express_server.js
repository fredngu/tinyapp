const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const generateRandomString = function() {
  return Math.random().toString(20).substring(2, 8);
};

const getUserByEmail = function(email, userObj) {
  for (const keys of Object.keys(userObj)) {
    if (userObj[keys].email === email) {
      return userObj;
    }
  }
  return null;
};

// Enable usage of ejs (embedded javascript) -> render
// EJS removes one object item - so we use TemplateVars to bring it back
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Homepage ('/')
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// URL Main Page
app.get("/urls", (req, res) => {
  const templateVars = { user: users, urls: urlDatabase, user_id: req.cookies["user_id"] };
  res.render("urls_index", templateVars);
});

// URL Shortening Page
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users, user_id: req.cookies["user_id"] };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users, user_id: req.cookies["user_id"] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users, user_id: req.cookies["user_id"] };
  res.render("urls_login", templateVars);
});

// URL Page for the Short URLS
app.get("/urls/:id", (req, res) => {
  const templateVars = { user: users, id: req.params.id, longURL: urlDatabase[req.params.id], user_id: req.cookies["user_id"] };
  res.render("urls_show", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email) {
    res.redirect('/register');
  } else {
    if (getUserByEmail(email, users) !== null) {
      res.status(400).end('Status 400: Username already exists');
    } else if (email === "" || password === "") {
      res.status(400).end('Status 400: Username/Password is blank');
    }
    let newRandomUserID = generateRandomString();
    users[newRandomUserID] = {
      id: newRandomUserID,
      email,
      password
    };
    res.cookie('user_id', newRandomUserID);
    res.redirect('/urls');
  }
});

app.post("/login", (req, res) => {
  const loginEmail = req.body.email;
  const loginPassword = req.body.password;

  if (!loginEmail) {
    res.redirect('/login');
  } else {
    if (getUserByEmail(loginEmail, users) === null) {
      res.status(403).end('Status 403: Username not found');
    } else {
      for (const keys of Object.keys(users)) {
        if (users[keys]["email"] === loginEmail) {
          if (users[keys]["password"] === loginPassword) {
            let user_id = keys;
            res.cookie('user_id', user_id);
            res.redirect('/urls');
          } else {
            res.status(403).end('Status 403: Password incorrect');
          }
        }
      }  
    }
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

// Makes a new short url for submitted long url and redirects to urls/:id
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/${newShortURL}`);
});

app.post("/urls/:id", (req, res) => {
  const userInput = req.params.id;
  res.redirect(`/urls/${userInput}`);
});

app.post("/urls/:id/edit", (req, res) => {
  const userInput = req.params.id;
  urlDatabase[userInput] = req.body.longURL;
  res.redirect(`/urls`);
});

app.post("/urls/:id/delete", (req, res) => {
  const userInput = req.params.id;
  delete urlDatabase[userInput];
  res.redirect('/urls');
});

// Send to the long url using the short url via /u/:id
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

const cookieParser = require("cookie-parser");
const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

const generateRandomString = function() {
  return Math.random().toString(20).substring(2, 8);
};

const getUserByEmail = function(email, userObj) {
  for (const keys of Object.keys(userObj)) {
    if (userObj[keys].email === email) {
      return userObj[keys];
    }
  }
  return null;
};

const urlsForUser = function(id) {
  let urls = {};
  for (const keys of Object.keys(urlDatabase)) {
    if (urlDatabase[keys]["userID"] === id) {
      urls[keys] = urlDatabase[keys]; 
    }
  }
  return urls;
} 

// Enable usage of ejs (embedded javascript) -> render
// EJS removes one object item - so we use TemplateVars to bring it back
app.set("view engine", "ejs");

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  // userRandomID: {
  //   id: "userRandomID",
  //   email: "user@example.com",
  //   password: "purple-monkey-dinosaur",
  // },
  // user2RandomID: {
  //   id: "user2RandomID",
  //   email: "user2@example.com",
  //   password: "dishwasher-funk",
  // },
  // aJ48lW: {
  //   id: "aJ48lW",
  //   email: "user3@fastemail.com",
  //   password: "abc123"
  // }
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
  let user_id = req.cookies["user_id"];
  if (!user_id) {
    res.status(403).end(`<html><body>Status 403: Login to view urls</body></html>\n`);
  } else {
    let userURLS = urlsForUser(user_id);
    const templateVars = { user: users, urls: userURLS, user_id };
    res.render("urls_index", templateVars);
  }
});

// URL Shortening Page
app.get("/urls/new", (req, res) => {
  let user_id = req.cookies["user_id"];
  if (!user_id) {
    res.redirect('/login');
  } else {
    const templateVars = { user: users, user_id };
    res.render("urls_new", templateVars);
  }
});

app.get("/register", (req, res) => {
  let user_id = req.cookies["user_id"];
  if (user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: users, user_id };
    res.render("urls_register", templateVars);
  }
});

app.get("/login", (req, res) => {
  let user_id = req.cookies["user_id"];
  if (user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: users, user_id };
    res.render("urls_login", templateVars);
  }
});

// URL Page for the Short URLS
app.get("/urls/:id", (req, res) => {
  let user_id = req.cookies["user_id"];
  let userInput = req.params.id;
  let user_URLS = urlsForUser(user_id);
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
    if (getUserByEmail(email, users) !== null) {
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
      res.cookie('user_id', newRandomUserID);
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
  } else if (loginUser === null) {
    res.status(403).end(`<html><body>Status 403: Username not found</body></html>\n`)
  } else {
    if (!bcrypt.compareSync(loginPassword, loginUser["password"])) {
      res.cookie('user_id', loginUser.id);
      res.redirect('/urls');
    } else {
      res.status(403).end(`<html><body>Status 403: Password incorrect</body></html>\n`)
    }
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

// Makes a new short url for submitted long url and redirects to urls/:id
app.post("/urls", (req, res) => {
  let user_id = req.cookies['user_id']
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
  let user_id = req.cookies["user_id"]; //Cookie for user_id
  let user_URLS = urlsForUser(user_id); //URLs belonging to the user_id

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
  let user_id = req.cookies["user_id"];
  let user_URLS = urlsForUser(user_id);

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

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

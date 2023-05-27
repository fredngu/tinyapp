const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

function generateRandomString() {
  return Math.random().toString(20).substring(2, 8);
};

// Enable usage of ejs (embedded javascript) -> render
// EJS removes one object item - so we use TemplateVars to bring it back
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true }));

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
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// URL Shortening Page
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// URL Page for the Short URLS
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render("urls_show", templateVars);
});

// Makes a new short url for submitted long url and redirects to urls/:id
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`/urls/${randomString}`);
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

const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

function generateRandomString() {
  let randomString = Math.random().toString(36).substr(2, 6);
  return randomString;
}

app.get("/u/:shortURL", (req, res) => {
  if(!urlDatabase[req.params.shortURL]){
    res.status(404).redirect("https://http.cat/404");
  }else {
    let longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
  }
});

app.get("/", (req, res) => {
  let templateVars = { username: req.cookies["username"] };
  res.render("urls_index", templateVars);
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = { username: req.cookies["username"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.post("/login", (req, res) => {
  if(!req.body.username){
    continue();
  }else{
    res.cookie('username', req.body.username);
    res.redirect("/urls");
  }
});

app.post("/urls", (req, res) => {
  let getshortURL = generateRandomString();
  urlDatabase[getshortURL] = req.body.longURL;
  res.redirect(`urls/${getshortURL}`);
});

app.post("/logout", (req,res) => {
  res.clearCookie('username');
  res.redirect("/");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { username: req.cookies["username"], shortURL: req.params.id, urls: urlDatabase};
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/delete", (req,res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req,res) => {
  urlDatabase[req.params.id]=req.body.longURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




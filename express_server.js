const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");


app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

function generateRandomString() {
  let randomString = Math.random().toString(36).substr(2, 6);
  return randomString;
}

function checkEmail(email, password) {

  for (let key in users){
    if(users[key]["email"] === email && users[key].password === password) {
      return key;
    }
  }
  return false;
}

function checkifExistingEmail(email) {

  for (let key in users){
    if(users[key][email] === email) {
      return true;
    }
  }
  return false;
}

app.post("/register", (req, res) => {
  let getUserID = generateRandomString();

  if(req.body.email && req.body.password){
    if(checkifExistingEmail(req.body.email) === false){

      let newUser =
      {
      id: getUserID,
      email: req.body.email,
      password: req.body.password };

      users[getUserID] = newUser;

      res.cookie('user_id', getUserID);
      res.redirect('/');
    }
  }else{
    res.status(400).render('400');
  }
});

app.post("/login", (req, res) => {

  if(req.cookies["user_id"]){
    res.redirect('/');
  }else{
    const foundUser = checkEmail(req.body.email, req.body.password);
    if(foundUser === false){
      res.status(403).render('403');
    }else {
      res.cookie('user_id', foundUser);
      res.redirect('/');
    }
  }
});

app.get("/u/:shortURL", (req, res) => {
  if(!urlDatabase[req.params.shortURL]){
    res.status(404).redirect("https://http.cat/404");
  }else {
    let longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
  }
});

app.get("/", (req, res) => {
  let templateVars = { user: req.cookies["user_id"], urls: urlDatabase  };
  res.render("urls_index", templateVars);
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = { user: req.cookies["user_id"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = { user: req.cookies["user_id"] };
  res.render("login", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { user: req.cookies["user_id"] };
  res.render("register", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: req.cookies["user_id"] };
  res.render("urls_new", templateVars);
});


app.post("/urls", (req, res) => {
  let getshortURL = generateRandomString();
  urlDatabase[getshortURL] = req.body.longURL;
  res.redirect(`urls/${getshortURL}`);
});

app.post("/logout", (req,res) => {
  res.clearCookie('user_id');
  res.redirect("/");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { user: req.cookies["user_id"], shortURL: req.params.id, urls: urlDatabase};
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/delete", (req,res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req,res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




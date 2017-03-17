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

  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: 'userRandomID'
  },

  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: 'user2RandomID'
  }

};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "2"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "1@example.com",
    password: "1"
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

function urlsForUser(id){
  let userURLs = {};
  for( let prop in urlDatabase) {
    if(urlDatabase[prop].userID === id){
      userURLs[prop] = urlDatabase[prop];
    }
  }
  return userURLs;
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

app.get("/", (req, res) => {
   let templateVars = { user: req.cookies["user_id"],
                         urls: urlsForUser(req.cookies["user_id"])};
   if(req.cookies["user_id"]){
    res.redirect("/urls");
}else{
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  let templateVars = { user: req.cookies["user_id"],
                         urls: urlsForUser(req.cookies["user_id"])};
   if(req.cookies["user_id"]){
    res.status(200);
    res.render("urls_index", templateVars);
  }else{
    res.status(401).render('401');
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: req.cookies["user_id"] };
  if(req.cookies["user_id"]){
    res.status(200);
    res.render("urls_new", templateVars);
  }else{
    res.status(401).render('401');
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { user: req.cookies["user_id"], shortURL: req.params.id, urls: urlDatabase};
  if(urlDatabase[req.params.id].userID === req.cookies["user_id"]){
    res.status(200);
    res.render("urls_show", templateVars);
  }else{
    res.render("login");
  }
});

app.get("/u/:shortURL", (req, res) => {
  if(!urlDatabase[req.params.shortURL]){
    res.status(404).render('404');
  }else {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

app.post("/urls", (req, res) => {
  let getshortURL = generateRandomString();
  let userID = req.cookies["user_id"];
  let record = {
    userID: userID,
    longURL: req.body.longURL
  };
  urlDatabase[getshortURL] = record;
  res.redirect(`urls/${getshortURL}`);
});

app.post("/urls/:id", (req,res) => {
  if(urlDatabase[req.params.id].userID === req.cookies["user_id"]){
    urlDatabase[req.params.id] = req.body.longURL;
    res.redirect("/urls");
  }else{
    res.render("login", templateVars);
  }
});


app.get("/login", (req, res) => {
  let templateVars = { user: req.cookies["user_id"] };
  res.render("login", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { user: req.cookies["user_id"] };
  res.render("register", templateVars);
});





app.post("/logout", (req,res) => {
  res.clearCookie('user_id');
  res.redirect("/");
});


app.post("/urls/:id/delete", (req,res) => {
  let templateVars = { user: req.cookies["user_id"]};
  //console.log(urlDatabase[req.params.id].userID);
  //console.log(req.cookies["user_id"]);
  if(urlDatabase[req.params.id].userID === req.cookies["user_id"]){
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }else{
    res.render("login", templateVars);
  }
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




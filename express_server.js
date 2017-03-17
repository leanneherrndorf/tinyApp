const express = require("express");
const app = express();
//const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');


app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
//app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  secret: "fluffybunny",
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(bodyParser.urlencoded({
  extended: true
}));
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
    password: bcrypt.hashSync("2", 10)
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "1@example.com",
    password: bcrypt.hashSync("1", 10)
  }
}

function generateRandomString() {
  let randomString = Math.random().toString(36).substr(2, 6);
  return randomString;
}

function checkEmail(email, password) {

  for (let key in users){
    if(users[key]["email"] === email && bcrypt.compareSync(password, users[key].password)) {
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

//Redirects to urls page if user logged in or login page if user not logged in yet
app.get("/", (req, res) => {
  if(req.session.user_id){
    res.redirect("/urls");
  }else{
    res.redirect("/login");
  }
});

//If user not yet logged in, returns a 401 response
//If user logged in, returns a 200 response, a page with header and table of created urls
app.get("/urls", (req, res) => {
   if(req.session.user_id){
    let templateVars = { user: req.session.user_id,
                       useremail: users[req.session.user_id].email,
                         urls: urlsForUser(req.session.user_id)};
    res.status(200);
    res.render("urls_index", templateVars);
  }else{
    res.status(401).render('401');
  }
});

app.get("/urls/new", (req, res) => {

  if(req.session.user_id){
    let templateVars = { user: req.session.user_id,
                     useremail: users[req.session.user_id].email,
                     urls: urlsForUser(req.session.user_id)};
    res.status(200);
    res.render("urls_new", templateVars);
  }else{
    res.status(401).render('401');
  }
});

app.get("/urls/:id", (req, res) => {
  if(!urlDatabase[req.params.id]){
    res.status(404).render('404');
  }
  if(!req.session.user_id){
    res.status(401).render('401');
  }
  if(req.session.user_id != urlDatabase[req.params.id].userID){
    res.status(403).render('403');
  }else {
   let templateVars = { user: req.session.user_id,
                      useremail: users[req.session.user_id].email,
                      shortURL: req.params.id,
                      urls: urlDatabase};

  res.status(200);
  res.render("urls_show", templateVars);
  }
});

app.get("/u/:id", (req, res) => {
  if(!urlDatabase[req.params.id]){
    res.status(404).render('404');
  }else {
    let longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  }
});

app.post("/urls", (req, res) => {

  if(req.session.user_id){
    let getshortURL = generateRandomString();
    let userID = req.session.user_id;
    let record = {
      userID: userID,
      longURL: req.body.longURL
    };
    urlDatabase[getshortURL] = record;
    res.redirect(`urls/${getshortURL}`);
  }else {
    res.status(401).render('401');
  }
});

app.post("/urls/:id", (req,res) => {
  if(!urlDatabase[req.params.id]) {
    res.status(404).render('404');
  }
  if(!req.session.user_id) {
    res.status(401).render('401');
  }
  if(req.session.user_id != urlDatabase[req.params.id].userID){
    res.status(403).render('403');
  }
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls/:id");

  // if(urlDatabase[req.params.id].userID === req.session.user_id){
  //   urlDatabase[req.params.id] = req.body.longURL;
  //   res.redirect("/urls");
  // }else{
  //   res.render("login", templateVars);
  // }
});

app.get("/login", (req, res) => {
    if(req.session.user_id){
    res.redirect('/');
  }else {
    res.status(200);
    let templateVars = { user: req.session.user_id };
    res.render("login", templateVars);
  }
});

app.get("/register", (req, res) => {
  if(req.session.user_id){
    res.redirect('/');
  }else{
    res.status(200);
    let templateVars = { user: req.session.user_id };
    res.render("register", templateVars);
  }
});

app.post("/register", (req, res) => {
  let getUserID = generateRandomString();

  if(req.body.email && req.body.password){
    if(checkifExistingEmail(req.body.email) === false){

      let newUser =
      {
        id: getUserID,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password , 10)
      };

      users[getUserID] = newUser;
      console.log(users);
      req.session.user_id = getUserID;
      res.redirect('/');
    }
  }else{
    res.status(400).render('400');
  }
});

app.post("/login", (req, res) => {

  if(req.session.user_id){
    res.redirect('/');
  }else{
    const foundUser = checkEmail(req.body.email, req.body.password);
    if(foundUser === false){
      res.status(403).render('403');
    }else {
      req.session.user_id = foundUser;
      res.redirect('/');
    }
  }
});

app.post("/logout", (req,res) => {
  delete req.session.user_id;
  res.redirect('/');
});


app.post("/urls/:id/delete", (req,res) => {
  let templateVars = { user: req.session.user_id};
  //console.log(urlDatabase[req.params.id].userID);
  //console.log(req.cookies["user_id"]);
  if(urlDatabase[req.params.id].userID === req.session.user_id){
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }else{
    res.render("login", templateVars);
  }
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




//Leanne Herrndorf
//Project 1: TinyApp

//This app is designed to allow users to shorten long URLs. Users can register,
//log into their account, create and modify new tiny URLs and use and share these
//links outside of the app.
//Listening on port 3000.

const express = require("express");
const app = express();
const cookieSession = require('cookie-session');
const PORT = process.env.PORT || 3000;
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  secret: "fluffybunny",
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000
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
};

//Generate a random 6 digit alphanumeric sequence to use as the small URL
function generateRandomString() {
  let randomString = Math.random().toString(36).substr(2, 6);
  return randomString;
}

//For users logging in, used as authentication that both the email and password match existing fields
function checkEmail(email, password) {

  for (let key in users){
    if(users[key]["email"] === email && bcrypt.compareSync(password, users[key].password)) {
      return key;
    }
  }
  return false;
}

//For users registering, check if the email has been already registered or not
function checkifExistingEmail(email) {

  for (let key in users){
    if(users[key][email] === email) {
      return true;
    }
  }
  return false;
}

//Fetches the URLs for that specific user
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
    let templateVars = {
      user: req.session.user_id,
      useremail: users[req.session.user_id].email,
      urls: urlsForUser(req.session.user_id)};
    res.status(200);
    res.render("urls_index", templateVars);
  }else{
    res.status(401).render('401');
  }
});

//If user logged in, return a form to generate a new short URL
//If not, sends an error message and link to log back in
app.get("/urls/new", (req, res) => {
  if(req.session.user_id){
    let templateVars = {
      user: req.session.user_id,
      useremail: users[req.session.user_id].email,
      urls: urlsForUser(req.session.user_id)};
    res.status(200);
    res.render("urls_new", templateVars);
  }else{
    res.status(401).render('401');
  }
});


//if url doesn't exist, user not logged in, or user does not match owner of URL send relevant error message
//Else a page that shows the shortened URL, the long URL
app.get("/urls/:id", (req, res) => {
  if(!urlDatabase[req.params.id]){
    res.status(404).render('404');
  }
  if(!req.session.user_id){
    res.status(401).render('401');
  }
  if(req.session.user_id !== urlDatabase[req.params.id].userID){
    res.status(403).render('403');
  }else {
    let templateVars = {
      user: req.session.user_id,
      useremail: users[req.session.user_id].email,
      shortURL: req.params.id,
      urls: urlDatabase};
    res.status(200);
    res.render("urls_show", templateVars);
  }
});


//If exists, redirect to corresponding long URL, else return a 404 response
app.get("/u/:id", (req, res) => {
  if(!urlDatabase[req.params.id]){
    res.status(404).render('404');
  }else {
    let longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  }
});

//If logged in, generate short URL, save link to user, redirect to urls/:id
//If not, return a 401 response
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


//if url doesn't exist, user not logged in, or user does not match owner of URL send relevant error message
//Else redirect to urls/:id
app.post("/urls/:id", (req, res) => {
  if(urlDatabase[req.params.id].userID === req.session.user_id){
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  }else{
    let templateVars = { user: req.session.user_id };
    res.render("login", templateVars);
  }
});

//If logged in, redirect to /
//Else login page
app.get("/login", (req, res) => {
  if(req.session.user_id){
    res.redirect('/');
  }else {
    res.status(200);
    let templateVars = { user: req.session.user_id };
    res.render("login", templateVars);
  }
});

//If logged in, redirect to /
//Else register page
app.get("/register", (req, res) => {
  if(req.session.user_id){
    res.redirect('/');
  }else{
    res.status(200);
    let templateVars = { user: req.session.user_id };
    res.render("register", templateVars);
  }
});

//Create a user, encrypt password, set a cookie
//if error return 400 response
app.post("/register", (req, res) => {
  let getUserID = generateRandomString();

  if(req.body.email && req.body.password){
    if(checkifExistingEmail(req.body.email) === false){
      let newUser = {
        id: getUserID,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
      };
      users[getUserID] = newUser;
      req.session.user_id = getUserID;
      res.redirect('/');
    }
  }else{
    res.status(400).render('400');
  }
});

//if email and password match existing user, set a cookie and redirect to /
//Else return 401 reponse
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

//Delete cookie, return to home page
app.post("/logout", (req, res) => {
  delete req.session.user_id;
  res.redirect('/');
});

app.post("/urls/:id/delete", (req, res) => {
  let templateVars = { user: req.session.user_id};
  if(urlDatabase[req.params.id].userID === req.session.user_id){
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }else{
    res.render("login", templateVars);
  }
});

app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}!`);
});

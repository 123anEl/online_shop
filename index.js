require("dotenv").config() // Импортируем переменные среды
// подключение необходимых модулей
const express = require("express");
const app = express();
const https = require('https')
const fs = require('fs')
const stripeSecretKey=process.env.STRIPE_SECRET_KEY
const stripePublicKey=process.env.STRIPE_PUBLIC_KEY
console.log(stripeSecretKey)
console.log(stripePublicKey)
//const path = require('path');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require('express-session');
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const Joi = require('joi')
const upload= require('express-fileupload')
const MongoStore= require('connect-mongo');
var expressLayouts = require('express-ejs-layouts');
const signupSchema= Joi.object({
  name:Joi.string(),
  age:Joi.number(),
  city:Joi.string(),
  email:Joi.string().email().required(),
  password1:Joi.string().pattern(new RegExp('(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])')),
    password2:Joi.ref('password1'),
    button:Joi.string()
})


app.use(express.json())
 // внедрение модули по обработке http запросов
app.use(upload())
/*let mongoClient=new mongodb.MongoClient('mongodb://localhost:27017',{
  useUnifiedTopology:true
})
mongoClient.connect(async function(error,mongo){
  if(!error){
let db=mongo.db('5assignment')
let coll= db.collection('users')
  }
  else{
    console.log(error)
  }
})*/
mongoose.connect('mongodb://localhost:27017/blog');
var db = mongoose.connection;
db.on('error',()=>console.log('Error in connecting to DB'))
db.once('open',()=>console.log('Connected to DB'))
var coll = db.collection("users")
var coll2=db.collection("products")

app.use(express.static('public'));
app.use(cookieParser()) // внедрение в наш сервер модуль по работе с cookies
app.use(bodyParser.urlencoded({extended:false})) // внедрение модули по обработке http запросов
app.use(session({
  secret: 'secret',
  resave:false,
  saveUninitialized:false,
}))
app.set('view engine', 'ejs') // установка движка шаблонизатора ejs, чтобы работать с ejs файлами


app.get('/', function(req,res){
  res.render('main')
})

app.get('/addproduct', (req,res)=>{
  res.render('addproduct')
})

const Product = require('./models/Product')

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/addproduct', async (req,res)=>{
  const newProduct = new Product({
    productname: req.body.productname,
    description: req.body.description,
    price: req.body.price,
    quantity: req.body.quantity,
    imgLink: req.body.imgLink
});
try {
    const savedProduct = await Product.save();
    res.json(savedProduct);
}catch(err){
    res.json({message: err});
}
})

app.get('/products', async function(req, res){
  const allProds = await db.collection('products').find().toArray();
  if(allProds){
    console.log(allProds);
  }
  res.render('products', {allProds, stripePublicKey:stripePublicKey});
})

app.get('/register', function(req, res){
  if(req.session.firstVisit){
    req.session.destroy();
  }
  res.render("register")
})


app.post('/register', async (req, res) => {
  const {name, email, city, age, password1} = req.body; // деструктуризация содержания запроса с
  var data={
    'name': name,
    'age': age,
    'email':email,
    'city':city,
    'password':password1,
    'isAdmin': false
  }
  try {
    const findUser = await db.collection('users').findOne({email : email})
    console.log(findUser);
    if(findUser){
      console.log("this account is already exist");
    }else{
      const {error} = signupSchema.validate(req.body,{
        abortEarly:false
      })
      if(error){
        console.log(error.details);
        return res.render('correctpassword')
      }else{
        db.collection('users').insertOne(data, (err,collection)=>{
          if(err){
            throw err;
          }
          console.log("inserted succesfully")
        })
      }
    }
    res.redirect('login');
  } catch (e) {
    throw e;
  }
})

// if (!req.session.firstVisit) { // проверка условным оператором, на наличие сессии, чтобы проверять, первое ли это посещение
//   req.session.firstVisit = new Date().getTime() // количество миллисекунд с 1 января 1970 года
// }
// const firstVisit = (new Date().getTime() - req.session.firstVisit) / 1000 // разница между последним посещением и первым посещением деленая на 1000, чтобы вычислить секунды
// res.render("display", {name, email, city, age, firstVisit})

app.get('/login', (req,res)=>{
  res.render('login')
})
app.post('/login', async (req, res) => {
  if (!req.session.firstVisit) { // проверка условным оператором, на наличие сессии, чтобы проверять, первое ли это посещение
    req.session.firstVisit = new Date().getTime() // количество миллисекунд с 1 января 1970 года
  }
  try {
    const findUser = await db.collection('users').findOne({email : req.body.email})
    // console.log(userFound);
    // res.cookie('username', userFound.username, {maxAge: 1000 * 3600}) // установка cookies для имени, фамилиии и email'
    if(!findUser || findUser.password !== req.body.password){
      console.log("Failure");
      res.redirect('/login');
    }else {
      const firstVisit = (new Date().getTime() - req.session.firstVisit) / 1000
      console.log("Success");
      console.log(findUser);
      res.render("display", {name: findUser.name, isAdmin : findUser.isAdmin, firstVisit : firstVisit})
    }
  } catch (e) {
    throw e;
  }
})



app.get("/currency", function (req, res){
  res.render(__dirname + "/currency.html")
})

app.post("/currency", function(req, res){
  console.log(req.body.from)
  console.log(req.body.to)

  var key = "&api_key=746741658e-53be55d617-rge2d2"
  var from =req.body.from
  var to = req.body.to
  var http = require("http");
  var url = "https://api.fastforex.io/fetch-one?from=" + from + "&to=" + to + key
  https.get(url, function(response){
    var data = []
    response.on("data", function(chunk){
      data.push(chunk)
    })
    response.on("end", function(){
      console.log('-----------------------');
      console.log(
        JSON.parse(Buffer.concat(data).toString())
      )
      var money = JSON.parse(Buffer.concat(data).toString())
      var toCurrency = Object.keys(money.result)[0]
      var toCurrencyAmount =Object.values(money.result)[0]
      res.write("<h1>The currency from " + money.base + " to " + toCurrency + " is " + toCurrencyAmount+"</h1>")
      res.send()
    })
  })
})

app.get('/adminPanel', async function (req, res) {
  var query = require('url').parse(req.url,true).query;
  sortBy = query.sortBy;
  deleteUser = query.deleteUser
  console.log(deleteUser);
  if(deleteUser){
    const toDeletef = await db.collection('users').findOne({"email": deleteUser})
    console.log(toDeletef);
    const toDelete = await db.collection('users').deleteOne({"email": deleteUser})
  }
  const allUsers = await db.collection('users').find().toArray();
  if(sortBy){
    // console.log(sortBy);
    const propComparator = (propName) => (a, b) =>
        a[propName] == b[propName] ? 0 : a[propName] < b[propName] ? -1 : 1
        allUsers.sort(propComparator(sortBy))  // console.log(allUsers);
  }

  res.render('adminPanel', {allUsers})
})

app.post('/deleteUser', async function(req, res) {
  const {id} = req.body;
  console.log(id);
  console.log("to delete");
  console.log(toDeleteF);
  const allUsers = await db.collection('users').find().toArray();
  // console.log(allUsers);
  res.redirect('adminPanel')
})
// app.post('/adminPanel', async function (req, res) {
//   const allUsers = await db.collection('users').find().toArray();
//   const {sortBy} = req.body
//   const propComparator = (propName) => (a, b) =>
//       a[propName] == b[propName] ? 0 : a[propName] < b[propName] ? -1 : 1
//   allUsers.sort(propComparator(sortBy))
//   // console.log(allUsers);
//   res.render('adminPanel', {allUsers, sortBy})
// })

app.post('/addUser', async function (req, res) {
  const allUsers = await db.collection('users').find().toArray();
  const {name, email, city, age, password1, isAdmin} = req.body; // деструктуризация содержания запроса с
  var data={
    'name': name,
    'age': age,
    'email':email,
    'city':city,
    'password':password1,
    'isAdmin': false
  }
  try {
    const findUser = await db.collection('users').findOne({email : email})
    console.log(findUser);
    if(findUser){
      console.log("this account is already exist");
    }else{
      const {error} = signupSchema.validate(req.body,{
        abortEarly:false
      })
      if(error){
        console.log(error);
        return res.send(error.details)
      }else{
        db.collection('users').insertOne(data, (err,collection)=>{
          if(err){
            throw err;
          }
          console.log("inserted succesfully")
        })
      }
    }
    res.redirect('adminPanel')
    // res.redirect('login');
  } catch (e) {
    throw e;
  }
})

app.post("/editUser", async function(req, res) {
  const {name, email, city, age, password1} = req.body; // деструктуризация содержания запроса с
  var data={
    'name': name,
    'age': age,
    'email':email,
    'city':city,
    'password':password1,
    'isAdmin': false
  }
  const findUser = await db.collection('users').findOne({"email" : email});
  if(!findUser){
    console.log("ERORR with query");
    console.log(data);
  }else{
    console.log(findUser);
    const editUser = await db.collection('users').updateOne({"email":email}, {$set:
      { name : name,
        age: age,
        email: email,
        city: city,
        password : password1 } } );
    res.redirect("adminPanel");
  }
})

app.get("/editUser", async function(req, res) {
  var query = require('url').parse(req.url,true).query;
  editCurrent = query.editCurrent;
  const findUser = await db.collection('users').findOne({"email" : editCurrent});
  if(!findUser){
    console.log("ERORR with query");
  }else{
    console.log(findUser);

  }
  res.render('editUser', {user : findUser});
})

app.get('/cart', (req,res)=>{
  res.render('customers/cart')
})


app.post("/cart", async (req, res) => {
  const newCart = new Cart(req.body);

  try {
    const savedCart = await newCart.save();
    res.status(200).json(savedCart);
  } catch (err) {
    res.status(500).json(err);
  }
});

//UPDATE
app.put("/cart/:id", async (req, res) => {
  try {
    const updatedCart = await Cart.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updatedCart);
  } catch (err) {
    res.status(500).json(err);
  }
});

//DELETE
app.delete("/cart/:id", async (req, res) => {
  try {
    await Cart.findByIdAndDelete(req.params.id);
    res.status(200).json("Cart has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET USER CART
app.get("/cart/find/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json(err);
  }
});

// //GET ALL

app.get("/cart", async (req, res) => {
  try {
    const carts = await Cart.find();
    res.status(200).json(carts);
  } catch (err) {
    res.status(500).json(err);
  }
});

const Cart = require('./models/Cart')
const Order = require("./models/Order");


app.post("/order", async (req, res) => {
  const newOrder = new Order(req.body);

  try {
    const savedOrder = await newOrder.save();
    res.status(200).json(savedOrder);
    console.log(savedOrder)
    res.redirect("cart")
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET MONTHLY INCOME

app.get("/order/income", async (req, res) => {
  const date = new Date();
  const lastMonth = new Date(date.setMonth(date.getMonth() - 1));
  const previousMonth = new Date(new Date().setMonth(lastMonth.getMonth() - 1));

  try {
    const income = await Order.aggregate([
      { $match: { createdAt: { $gte: previousMonth } } },
      {
        $project: {
          month: { $month: "$createdAt" },
          sales: "$amount",
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: "$sales" },
        },
      },
    ]);
    res.status(200).json(income);
  } catch (err) {
    res.status(500).json(err);
  }
});

//DELETE
app.delete("/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json("Order has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});


const KEY = process.env.STRIPE_SECRET_KEY
const stripe = require("stripe")(KEY);

app.post("/payment", (req, res) => {
  stripe.charges.create(
    {
      source: req.body.tokenId,
      amount: req.body.amount,
      currency: "kzt",
    },
    (stripeErr, stripeRes) => {
      if (stripeErr) {
        res.status(500).json(stripeErr);
      } else {
        res.status(200).json(stripeRes);
      }
    }
  );
});

let PORT=process.env.PORT || 3000
app.listen(PORT, function()
{
  console.log(`Listening on ${ PORT }`);
})

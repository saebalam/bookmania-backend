const express = require('express')
const cors = require('cors')
const bodyParser = require("body-parser");
const router = express.Router();
const path = require('path');
const app = express();
const cred = require('./Cred')
const featuredProducts = require('./FeaturedProducts')
const Products = require('./Products')
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser")
const { verify } = require('crypto');
var mysql = require('mysql');

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser())

//sql database connection

var con = mysql.createConnection({
    host: "sql12.freesqldatabase.com",
    user: "sql12579435",
    password: "fHNTZb5Y8g",
    database: "sql12579435"
});


//database
var cartItems = []
var wishlistItems = []
var filteredProducts = []
var filteredProductsList = []

const createToken = (email) => {
    const token = jwt.sign({ email: email }, "myjwtsecretkeytoken")
    return token
}

const validateToken = (req, res, next) => {
    const accessToken = req.body.accessToken
    if (!accessToken) return res.status(400).json("not authorised")

    try {
        const validToken = jwt.verify(accessToken, "myjwtsecretkeytoken")
        if (validToken) {
            // req.authenticated=true
            return next()
        }
    } catch (error) {
        return res.status(400).json({ err: error })
    }
}

// add router in express app


app.get('/', (req, res) => {
    res.send('hello from node')
})

app.get('/user', (req, res) => {
    res.send("hello user")
})

//login
app.post('/login', (req, res) => {
    console.log('reqbody is', req.body)
    console.log(req.body.email);
    var email = req.body.userInfo.email;
    var password = req.body.userInfo.password;

    // if ((email == "test@test.com" && password == "test") || (email == "test1@test1.com" && password == "test1")) {
    //     const accesstoken = createToken(email)
    //     res.send({"accesstoken":accesstoken,'loggedin':true})
    // } else {
    //     res.send(false)
    // }

    //using sql to login

    con.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], function (err, result, fields) {
        if (err) throw err;
        if (result.length > 0) {
            const accesstoken = createToken(email)
            res.send({ "accesstoken": accesstoken, 'loggedin': true })
        } else {
            res.send(false)
        }
    });

});

//register

app.post('/register', (req, res) => {
    var email = req.body.userInfo.email;
    var password = req.body.userInfo.password;

    //using sql to login
    const query = "INSERT INTO users (email, password) VALUES (email,)";
    con.query('INSERT INTO users (email, password) VALUES (?,?)', [email, password], function (err, result) {
        if (err) throw err;
        // console.log("1 record inserted");
        res.send(true)
    });

});


// homeProducts
app.get('/user/featuredProducts', (req, res) => {
    res.send(featuredProducts)
})


//searched products

app.post('/products/:query', (req, res) => {
    const query = req.params.query
    filteredProducts = Products.filter(product => product.category.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes(product.category.toLowerCase()))
    const filteredProductsTitle = filteredProducts.map(filteredProduct => filteredProduct.category)
    if (filteredProductsTitle.length > 0) {
        res.send(filteredProductsTitle)
    } else {
        res.status(200)
    }
})

app.get(`/collections/:pName`, (req, res) => {
    // res.send("productList")
    console.log('coll called');
    const query = req.params.pName

    filteredProductsList = Products.filter(product => product.category.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes(product.category.toLowerCase()))
    // const filteredProductsTitle=filteredProducts.map(filteredProduct=>filteredProduct.title)
    if (filteredProductsList.length > 0) {
        // console.log(filteredProductsList);
        res.send(filteredProductsList)
    } else {
        res.status(200)
        res.end()
    }
})

app.get(`/products/:productName`, (req, res) => {
    // res.send("productList")
    console.log('coll called');
    const query = req.params.productName

    filteredProductsList = Products.filter(product => product.category.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes(product.category.toLowerCase()))
    // const filteredProductsTitle=filteredProducts.map(filteredProduct=>filteredProduct.title)
    if (filteredProductsList.length > 0) {
        // console.log(filteredProductsList);
        res.send(filteredProductsList)
    } else {
        res.status(200)
        res.end()
    } 
})

//cart
app.post('/cart', validateToken, (req, res) => {
    res.send(cartItems)
})

app.post('/addToCart', (req, res) => {
    cartItems.push(req.body)
    res.send()
})

app.post('/addToWishlist', (req, res) => {
    const id = req.body.id;
    if (wishlistItems.length == 0) {
        wishlistItems.push(req.body)
        res.send(true)
    } else {
        const willAdd = false;
        wishlistItems.map(item => {
            if (item.id == id) {
                exist = true;
            }
        })
        if (!willAdd) {
            wishlistItems.push(req.body)
            res.send(true)
        } else {
            res.send(false)
        }
    }
})

app.post('/getWishlistItems', validateToken, (req, res) => {
    res.send(wishlistItems)
})

app.post('/removeFromWishlist/:id', (req, res) => {
    const id = req.params.id
    wishlistItems = wishlistItems.filter(item => item.id != id)
    res.send()
})

app.get('/getTotalPrice', (req, res) => {
    res.send(cartItems)
})

app.post('/increaseCartQuantity/:id', (req, res) => {
    const id = req.params.id
    const ind = cartItems.findIndex(cartItem => cartItem.id == id)
    cartItems[ind].quantity++
    res.send()
})

app.post('/decreaseCartQuantity/:id', (req, res) => {
    const id = req.params.id
    const ind = cartItems.findIndex(cartItem => cartItem.id == id)
    if (cartItems[ind].quantity > 1) {
        cartItems[ind].quantity--
    }
    res.send()
})

app.post('/removeItem/:id', (req, res) => {
    const id = req.params.id;
    cartItems = cartItems.filter(cartItem => cartItem.id != id)
    res.send()
})

//check email
var email;
app.post('/checkEmail', (req, res) => {
    email = req.body.email
    var sql = 'SELECT * FROM users WHERE email = ?'
    con.query(sql, [email], function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
            console.log('user found')
            res.send(true)
        } else {
            console.log('not found');
            res.send(false)
        }
    });
})

//update password
app.post('/updatePassword', (req, res) => {
    const newPassword = req.body.newPassword
    var sql = 'UPDATE users SET password = ? WHERE email = ?'
    con.query(sql, [newPassword, email], function (err, result) {
        if (err) throw err;
        res.send(true)

    });
})




app.listen(process.env.PORT || 5000)
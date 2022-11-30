// include express framework
const express = require("express")
 
// create an instance of it
const app = express()
 
// create http server from express instance
const http = require("http").createServer(app)
 
// database module
const mongodb = require("mongodb")
 
// client used to connect with database
const MongoClient = mongodb.MongoClient
 
// each Mongo document's unique ID
const ObjectId = mongodb.ObjectId

// Add headers before the routes are defined
app.use(function (req, res, next) {
 
    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "*")
 
    // Request methods you wish to allow
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE")
 
    // Request headers you wish to allow
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type,Authorization")
 
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader("Access-Control-Allow-Credentials", true)
 
    // Pass to next layer of middleware
    next()
});

// module required for parsing FormData values
const expressFormidable = require("express-formidable")
 
// setting the middleware
app.use(expressFormidable())

// module required for encrypting the passwords
// and verify the password as well
const bcrypt = require("bcrypt");

// JWT used for authentication
const jwt = require("jsonwebtoken");
 
// secret JWT key Keep secret !
const jwtSecret = "jwtSecret1234567890";
//include the authentication middleware 
const auth = require("./modules/auth");
 
const port = (process.env.PORT || 3000)

const contact = require("./modules/contact");
	
const chat = require("./modules/chat");
 
// start the server at port 3000 (for local) or for hosting server port
http.listen(port, function () {
    console.log("Server has been started at: " + port)
 
    // connect with database
    MongoClient.connect("mongodb://localhost:27017", function (error, client) {
        if (error) {
            console.error(error)
            return
        }
 
        // database name
        db = client.db("basketballapp")
        global.db = db
        console.log("Database connected")

        contact.init(app, express);
        chat.init(app, express);

        // route for logout request api
        app.post("/logout", auth, async function (request, result) {
            const user = request.user
        
            // update JWT of user in database
            await db.collection("users").findOneAndUpdate({
                _id: user._id
            }, {
                $set: {
                    accessToken: ""
                }
            })
        
            result.json({
                status: "success",
                message: "Logout successfully."
            })
        })

        //I create an API for fetching user data
        app.post("/getUser", auth, async function (request, result) {
            const user = request.user;
         
            result.json({
                status: "success",
                message: "Data has been fetched.",
                user: user
            });
        });

        // route for login requests
        app.post("/login", async function (request, result) {
        
            // get values from login form
            const email = request.fields.email;
            const password = request.fields.password;
        
            // check if email exists
            const user = await db.collection("users").findOne({
                "email": email
            });
        
            if (user == null) {
                result.json({
                    status: "error",
                    message: "Email does not exists."
                });
                return;
            }
        
            // check if password is correct
            bcrypt.compare(password, user.password, async function (error, isVerify) {
                if (isVerify) {
        
                    // generate JWT of user
                    const accessToken = jwt.sign({
                        "userId": user._id.toString()
                    }, jwtSecret);
        
                    // update JWT of user in database
                    await db.collection("users").findOneAndUpdate({
                        "email": email
                    }, {
                        $set: {
                            "accessToken": accessToken
                        }
                    });
        
                    result.json({
                        status: "success",
                        message: "Login successfully.",
                        accessToken: accessToken
                    });
        
                    return;
                }
        
                result.json({
                    status: "error",
                    message: "Password is not correct."
                });
            });
        });

        app.post("/registration", async function (request, result) {
            const name = request.fields.name;
            const email = request.fields.email;
            const password = request.fields.password;
            const createdAt = new Date().getTime();
     
            if (!name || !email || !password) {
                result.json({
                    status: "error",
                    message: "Please enter all values."
                });
                return;
            }
     
            // check if email already exists
            var user = await db.collection("users").findOne({
                email: email
            });
     
            if (user != null) {
                result.json({
                    status: "error",
                    message: "Email already exists."
                });
                return;
            }
     
            // encrypt the password
            bcrypt.hash(password, 10, async function (error, hash) {
     
                // insert in database
                await db.collection("users").insertOne({
                    name: name,
                    email: email,
                    password: hash,
                    accessToken: "",
                    contacts: [],
                    notifications: [],
                    createdAt: createdAt
                });
     
                result.status(200).json({
                    status: "success",
                    message: "Account has been created. Please login now."
                });
            });
        });
    });
});
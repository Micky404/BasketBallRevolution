const jwt = require("jsonwebtoken");
//Middleware stands between the client and the actual API endpoint. Middleware is called before the request actually processed by API. We will be creating our own middleware for authentication.
//We are including JWT and Mongo DB modules as we will be needing them
const jwtSecret = "jwtSecret1234567890";
 
const mongodb = require("mongodb");
const ObjectId = mongodb.ObjectId;
 //we are creating an asynchronous function that splitting the authorization header into 2 parts [“Bearer”, “access token”]
module.exports = async function (request, result, next) {
    try {
        const accessToken = request.headers.authorization.split(" ")[1];
        //Then we verify that token using JWT and our secret key.
        const decoded = jwt.verify(accessToken, jwtSecret);
        //return the “userId” which we saved during login
        const userId = decoded.userId;
        // we can get the user data using this access token
        const user = await db.collection("users").findOne({
            accessToken: accessToken
        });
 
        if (user == null) {
            result.status(401).json({
                status: "error",
                message: "User has been logged out."
            });
            return;
        }
        //We will delete all the unnecessary keys
 
        delete user.password;
        delete user.accessToken;
        delete user.createdAt;
        //Attach the user with the current request object.
        request.user = user;
        //next() function will continue to the API endpoint.
        next();
    } catch (exp) {
        result.status(401).json({
            status: "error",
            message: "User has been logged out."
        });
    }
};
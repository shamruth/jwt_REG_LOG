require("dotenv").config();
const express=require("express");
const app=express();
const mongoose=require("mongoose");
const { type } = require("os");
const jwt=require("jsonwebtoken");
const path = require("path");
const port=process.env.PORT;
const secret=process.env.SECRET;
const mongo_uri=process.env.MONGO_URI;
/*
CREATING A MIDDLE WARE FUNCTION TO VERIFY TOKEN AS PER CHATGPT
*/
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send("Access Denied: No or Invalid Token");
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).send("Invalid or Expired Token");
    }
}

let refreshTokens = [];

function generateRefreshToken(user) {
    const token = jwt.sign(user, process.env.REFRESH_SECRET, { expiresIn: "7d" });
    refreshTokens.push(token);
    return token;
}

app.use(express.json());

mongoose.connect(mongo_uri)
.then(()=>
{
    console.log("SUCCESFULLY CONNECTED DB");
})
.catch((err)=>
{
    console.log("ERROR CONNECTION TO BE DB \n",err);
})

const reg_schema=new mongoose.Schema(
    {
        USERNAME:{
            type:String,
            required:true,
        },
        EMAIL:{
            type:String,
            required:true,
        }
    }
)
const reg_model=mongoose.model("userdatas",reg_schema);


app.get('/LOGIN',(req,res)=>
{
    res.sendFile(path.join(__dirname,"login.html"));
});

app.post('/REGISTER',async(req,res)=>
{
    const new_user=req.body;
    try{
        const reg_user =await reg_model.create(new_user);
        if(reg_user)
        {
            res.status(200).send("USER HAS BEEN SUCCESSFULLY REGISTERED")
        }
        else
        {
            res.status(500).send("ERROR WITH SERVER");
        }
    }
    catch (err)
    {
        res.status(402).end("ENTER PROPERDATA")
    }
})

app.post('/LOGIN',async(req,res)=>
{
    const data=req.body;
    const check_login = await reg_model.findOne({USERNAME:data.USERNAME,EMAIL:data.EMAIL});
    if(!check_login)
    {
        res.end("INVALID CREDENTIAL");
        
    }
    else
    {
        const token=jwt.sign({id:check_login._id},secret,{expiresIn:"60S"})
        res.json(token);
        console.log("logged in succesfully")
    }
    
})



//asked chatgpt
app.use(express.static(path.join(__dirname))); 
app.post('/TODO',verifyToken,(req,res)=>
{
    //res.redirect(path.join(__dirname,"TODO.html"))
    res.status(200).send("SUCCESFULLY LOGGED IN")
    console.log("TODO ACCESSED");
})

app.post("/refresh", (req, res) => {
    const { token } = req.body;
    if (!token) return res.sendStatus(401);
    if (!refreshTokens.includes(token)) return res.sendStatus(403);

    jwt.verify(token, process.env.REFRESH_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const newAccessToken = jwt.sign(
            { id: user.id, username: user.username },
            secret,
            { expiresIn: "60s" }
        );
        res.json({ accessToken: newAccessToken });
    });
});


app.listen(port,()=>
{
    console.log(`http://localhost:${port}`);
})
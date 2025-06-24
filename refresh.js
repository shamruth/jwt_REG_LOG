require('dotenv').config();
const express=require('express');
const app =express();
const port=process.env.PORT;
const secret=process.env.SECRET;
const jwt=require("jsonwebtoken");
app.use(express.json());


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
function generateaccesstoken()
{
    const token=jwt.sign({data:"hii"},secret,{expiresIn:"60S"})
    return(token)
}
let refereshtoken=[]
function generaterefreshtoken()
{
    const token=jwt.sign({data:"hii"},secret,{expiresIn:"120s"})
    refereshtoken.push(token);
    return(token);
}
app.post('/LOGIN',(req,res)=>
{
    const accessToken=generateaccesstoken();
    const refereshToken=generaterefreshtoken();
    res.json({accessToken,refereshToken});
})
app.post('/refresh',(req,res)=>
{
    const {token}=req.body
    if(refereshtoken.includes(token))
    {
        if(jwt.verify(token, secret))
        {
            const accessToken = generateaccesstoken();
            res.json({ accessToken });
        }
    }
})
app.post('/TODO',verifyToken,(req,res)=>
{
    res.send("SUCCESSFULLY LOGGEDIN");
})
app.listen(port,()=>
{
    console.log(`http://localhost:${port}`);
})
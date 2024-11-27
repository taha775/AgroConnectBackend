export const generateToken =(user,message,statusCode ,res)=>{
    const token = user.generateJsonWebToken()

    res.status(statusCode)
    .cookie("token",token,{
        httpOnly : true,
    }).json({
        success:true,
        message,
        token,
        user
    })

}
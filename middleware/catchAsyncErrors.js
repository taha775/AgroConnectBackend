// this function is used for  throwing errors  but it  wwill not stop  this cathc next errors 

export const catchAsyncErrors = (theFunction)=>{
    return(req,res,next)=>{
        Promise.resolve(theFunction(req,res,next)).catch(next)
    }

}





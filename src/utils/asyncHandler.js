const asyncHandler = (fn) =>  { return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err))
}
};



export{ asyncHandler }




// const asyncHandle = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}

    
// const asyncHandle = (fn) => async (req, res, next) => {
//     try {    Promise.resolve(fn(req, res, next)).catch((err) => next(err));

//         await fn(req, req, next)
//     } catch (error) {
//         res.status(err.code || 500).json ({
//             success: false,
//             message: err.message
//         })
//     }
// }
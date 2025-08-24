// promise form
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(
            requestHandler(req, res, next)
        ).catch((error) => next(error))
    }
}

export { asyncHandler }

/*
higher order function
const asyncHandler = () => {}
const asyncHandler = (fn) => () => {}
const asyncHandler = (fn) => async () => {}
*/

/*
try catch
const asyncHandler = (fn) => async (req, res, next) => {
    try {
 
        await fn(req, res, next)

    } catch (error) {
        req.send(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}
*/
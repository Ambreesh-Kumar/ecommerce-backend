export const errorHandler = (err, req, res, next) => {
    console.log(`error:`, err)
    const status = err.statusCode || 500;
    res.status(status).json({
        status: "error",
        message: err.message || "Internal server error"
    })
}
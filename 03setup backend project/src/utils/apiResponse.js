class ApiResponse {
    constructor(statusCode, data, meaasge = "Success") {
        this.statusCode = statusCode,
        this.data = data,
        this.meaasge = meaasge,
        this.success = statusCode < 400
    }
}

export {ApiResponse}
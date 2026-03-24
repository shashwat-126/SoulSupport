class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;

    // Expose wrapped object fields at the top level for backward-compatible clients.
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      for (const [key, value] of Object.entries(data)) {
        if (!Object.prototype.hasOwnProperty.call(this, key)) {
          this[key] = value;
        }
      }
    }
  }
}

module.exports = ApiResponse;

export class ApiResponse<T = any> {
  constructor(
    public success: boolean,
    public data?: T,
    public message?: string,
    public error?: any
  ) {}

  static ok<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse<T>(true, data, message);
  }

  static fail(message: string, error?: any): ApiResponse {
    return new ApiResponse(false, undefined, message, error);
  }
}

export class ApiError extends Error {
  public status: number;
  public error: any;

  constructor(message: string, status = 500, error?: any) {
    super(message);
    this.status = status;
    this.error = error;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

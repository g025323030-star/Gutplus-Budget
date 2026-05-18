export interface MessageResponse {
  message: string;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface SuccessMessageResponse {
  success: true;
  message: string;
}

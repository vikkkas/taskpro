import axios, { AxiosResponse, AxiosError } from "axios";

// Set default timeout to 5 minutes
axios.defaults.timeout = 1000 * 60 * 5;

// Default headers for API requests
const customHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

// Types for API responses
interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
}

interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

// Helper function to get auth headers
const getAuthHeaders = (isFormData: boolean = false) => {
  const token = localStorage.getItem("token");
  const headers = {
    ...customHeaders,
    Authorization: token ? `Bearer ${token}` : null,
  };

  if (isFormData) {
    delete headers["Content-Type"];
  }

  return headers;
};

// Helper function to handle API errors
const handleApiError = (error: AxiosError, context: string): never => {
  console.error(`API Error in ${context}:`, error);
  
  // Safely extract error message
  let errorMessage = "An error occurred";
  if (error.response?.data && typeof error.response.data === 'object') {
    const responseData = error.response.data as { message?: string };
    errorMessage = responseData.message || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }
  
  const apiError: ApiError = {
    message: errorMessage,
    status: error.response?.status,
    data: error.response?.data,
  };
  
  throw apiError;
};

/**
 * Makes a POST request to the specified URL
 * @param url - The endpoint URL
 * @param payload - The data to send in the request body
 * @param segment - Optional segment parameter (currently unused)
 * @returns Promise containing the full Axios response
 */
export const postAPI = async <T = any>(
  url: string, 
  payload: any, 
  segment?: string
): Promise<AxiosResponse<T>> => {
  try {
    const isFormData = payload instanceof FormData;
    const headers = getAuthHeaders(isFormData);
    url = import.meta.env.VITE_BACKEND_URI + url; // Ensure the URL is absolute 
    const response = await axios.post<T>(url, payload, { headers });
    return response;
  } catch (error) {
    handleApiError(error as AxiosError, `POST ${url}`);
    throw error; // Ensure the error is re-thrown for further handling
  }
};

/**
 * Makes a POST request to the specified URL without a request body
 * @param url - The endpoint URL
 * @returns Promise containing the response data
 */
export const postAPIWithoutBody = async <T = any>(
  url: string,
  segment?: string
): Promise<AxiosResponse<T>> => {
  try {
    const headers = getAuthHeaders();
    url = import.meta.env.VITE_BACKEND_URI + url; // Ensure the URL is absolute
    const response = await axios.post<T>(url, {}, { headers });
    return response;
  } catch (error) {
    handleApiError(error as AxiosError, `POST ${url}`);
    throw error; // Ensure the error is re-thrown for further handling
  }
};

/**
 * Makes a GET request to the specified URL
 * @param url - The endpoint URL
 * @param segment - Optional segment parameter (currently unused)
 * @returns Promise containing the response data
 */
export const getAPI = async <T = any>(
  url: string, 
  segment?: string
): Promise<T> => {
  try {
    const headers = getAuthHeaders();
    url = import.meta.env.VITE_BACKEND_URI + url; // Ensure the URL is absolute
    const response = await axios.get<T>(url, { headers });
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError, `GET ${url}`);
  }
};

/**
 * Makes a PUT request to the specified URL
 * @param url - The endpoint URL
 * @param payload - The data to send in the request body
 * @param segment - Optional segment parameter (currently unused)
 * @returns Promise containing the response data
 */
export const putAPI = async <T = any>(
  url: string, 
  payload: any, 
  segment?: string
): Promise<T> => {
  try {
    const headers = getAuthHeaders();
    url = import.meta.env.VITE_BACKEND_URI + url; // Ensure the URL is absolute
    const response = await axios.put<T>(url, payload, { headers });
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError, `PUT ${url}`);
  }
};

/**
 * Makes a DELETE request to the specified URL
 * @param url - The endpoint URL
 * @param payload - Optional data to send in the request body
 * @param segment - Optional segment parameter (currently unused)
 * @returns Promise containing the full Axios response
 */
export const deleteAPI = async <T = any>(
  url: string, 
  payload?: any, 
  segment?: string
): Promise<AxiosResponse<T>> => {
  try {
    const headers = getAuthHeaders();
    url = import.meta.env.VITE_BACKEND_URI + url; // Ensure the URL is absolute
    const response = await axios.delete<T>(url, {
      headers,
      data: payload,
    });
    return response;
  } catch (error) {
    handleApiError(error as AxiosError, `DELETE ${url}`);
  }
};

// Additional utility functions

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return localStorage.getItem("token") !== null;
};

// Remove authentication token
export const clearAuthToken = (): void => {
  localStorage.removeItem("token");
};

// Set authentication token
export const setAuthToken = (token: string): void => {
  localStorage.setItem("token", token);
};

// API request with custom headers
export const customAPI = async <T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  payload?: any,
  customHeaders?: Record<string, string>
): Promise<AxiosResponse<T>> => {
  try {
    const headers = {
      ...getAuthHeaders(),
      ...customHeaders,
    };

    const config = {
      method,
      url: import.meta.env.VITE_BACKEND_URI + url, // Ensure the URL is absolute
      headers,
      ...(payload && ['POST', 'PUT', 'PATCH'].includes(method) ? { data: payload } : {}),
    };

    const response = await axios(config);
    return response;
  } catch (error) {
    handleApiError(error as AxiosError, `${method} ${url}`);
  }
};

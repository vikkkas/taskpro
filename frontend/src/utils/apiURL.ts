export const AUTH = {
    REGISTER : "/api/auth/register",
    LOGIN: "/api/auth/login",
    CHANGE_PASSWORD: "/api/auth/change-password",
}

export const TASK = {
    FETCH: "/api/tasks",
    CREATE : "/api/tasks",
    UPDATE : (taskId: string) => `/api/tasks/${taskId}`,
    DELETE: (taskId: string) => `/api/tasks/${taskId}`,
    TIMER_START: (taskId: string) => `/api/tasks/${taskId}/timer/start`,
    TIMER_STOP: (taskId: string) => `/api/tasks/${taskId}/timer/stop`,
}

export const COMMENTS = {
    CREATE : (taskId: string) => `/api/tasks/${taskId}/comments`,
}

export const USERS = {
    FETCH : "/api/auth/users",
    REGISTER: "/api/auth/register",
    DELETE: (userId: string) => `/api/auth/users/${userId}`
}
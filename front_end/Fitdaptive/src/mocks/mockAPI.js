import {
  mockUser,
  mockWorkouts,
  mockStats,
  mockExercises,
  mockNutrition,
  mockWorkoutPlans,
} from './mockData';

// Simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API service
export const mockAPI = {
  // Auth endpoints
  login: async (email, password) => {
    await delay();
    if (email && password) {
      return {
        success: true,
        data: {
          user: mockUser,
          token: 'mock-jwt-token-12345',
        },
      };
    }
    return { success: false, error: 'Invalid credentials' };
  },

  register: async (userData) => {
    await delay();
    return {
      success: true,
      data: {
        user: { ...mockUser, ...userData },
        token: 'mock-jwt-token-12345',
      },
    };
  },

  // User endpoints
  getProfile: async () => {
    await delay();
    return { success: true, data: mockUser };
  },

  updateProfile: async (updates) => {
    await delay();
    return { success: true, data: { ...mockUser, ...updates } };
  },

  // Workout endpoints
  getWorkouts: async () => {
    await delay();
    return { success: true, data: mockWorkouts };
  },

  getWorkoutById: async (id) => {
    await delay();
    const workout = mockWorkouts.find(w => w.id === id);
    return { success: true, data: workout };
  },

  createWorkout: async (workoutData) => {
    await delay();
    const newWorkout = {
      id: mockWorkouts.length + 1,
      ...workoutData,
      date: new Date().toISOString(),
    };
    return { success: true, data: newWorkout };
  },

  updateWorkout: async (id, updates) => {
    await delay();
    const workout = mockWorkouts.find(w => w.id === id);
    return { success: true, data: { ...workout, ...updates } };
  },

  deleteWorkout: async (id) => {
    await delay();
    return { success: true, message: 'Workout deleted' };
  },

  // Stats endpoints
  getStats: async () => {
    await delay();
    return { success: true, data: mockStats };
  },

  // Exercise endpoints
  getExercises: async () => {
    await delay();
    return { success: true, data: mockExercises };
  },

  getExerciseById: async (id) => {
    await delay();
    const exercise = mockExercises.find(e => e.id === id);
    return { success: true, data: exercise };
  },

  // Nutrition endpoints
  getNutrition: async () => {
    await delay();
    return { success: true, data: mockNutrition };
  },

  logMeal: async (mealData) => {
    await delay();
    return { success: true, data: mealData };
  },

  // Workout plans endpoints
  getWorkoutPlans: async () => {
    await delay();
    return { success: true, data: mockWorkoutPlans };
  },

  getWorkoutPlanById: async (id) => {
    await delay();
    const plan = mockWorkoutPlans.find(p => p.id === id);
    return { success: true, data: plan };
  },
};

export default mockAPI;

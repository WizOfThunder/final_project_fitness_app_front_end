// Mock user data
export const mockUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://via.placeholder.com/150',
};

// Mock workout data
export const mockWorkouts = [
  {
    id: 1,
    title: 'Morning Run',
    type: 'Cardio',
    duration: 30,
    calories: 250,
    date: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Weight Training',
    type: 'Strength',
    duration: 45,
    calories: 180,
    date: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    title: 'Yoga Session',
    type: 'Flexibility',
    duration: 60,
    calories: 120,
    date: new Date(Date.now() - 172800000).toISOString(),
  },
];

// Mock fitness stats
export const mockStats = {
  totalWorkouts: 45,
  totalCalories: 12500,
  totalDuration: 1350,
  weeklyGoal: 5,
  weeklyCompleted: 3,
};

// Mock exercise library
export const mockExercises = [
  {
    id: 1,
    name: 'Push-ups',
    category: 'Strength',
    difficulty: 'Beginner',
    description: 'Classic upper body exercise',
    videoUrl: 'https://example.com/video1',
  },
  {
    id: 2,
    name: 'Squats',
    category: 'Strength',
    difficulty: 'Beginner',
    description: 'Lower body compound exercise',
    videoUrl: 'https://example.com/video2',
  },
  {
    id: 3,
    name: 'Plank',
    category: 'Core',
    difficulty: 'Intermediate',
    description: 'Core stability exercise',
    videoUrl: 'https://example.com/video3',
  },
];

// Mock nutrition data
export const mockNutrition = {
  dailyCalories: 2000,
  consumed: 1450,
  protein: { target: 150, consumed: 95 },
  carbs: { target: 250, consumed: 180 },
  fats: { target: 65, consumed: 48 },
};

// Mock workout plans
export const mockWorkoutPlans = [
  {
    id: 1,
    name: 'Beginner Full Body',
    duration: '4 weeks',
    difficulty: 'Beginner',
    daysPerWeek: 3,
    description: 'Perfect for getting started with fitness',
  },
  {
    id: 2,
    name: 'Advanced HIIT',
    duration: '6 weeks',
    difficulty: 'Advanced',
    daysPerWeek: 5,
    description: 'High intensity interval training program',
  },
];

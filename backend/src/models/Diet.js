import mongoose from "mongoose"

const mealLogSchema = new mongoose.Schema({
  mealType: { type: String, enum: ["breakfast", "lunch", "dinner", "snack"], required: true },
  foods: [{
    name: { type: String, required: true },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    quantity: { type: String, default: "1 serving" }
  }],
  totalCalories: { type: Number, default: 0 },
  notes: String,
  time: { type: String },
  date: { type: Date, default: Date.now }
})

const dietSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // User Profile for personalized recommendations
  profile: {
    age: Number,
    weight: Number, // in kg
    height: Number, // in cm
    gender: { type: String, enum: ["male", "female", "other"] },
    activityLevel: { type: String, enum: ["sedentary", "light", "moderate", "active", "very_active"], default: "moderate" },
    goal: { type: String, enum: ["lose_weight", "maintain", "gain_muscle", "healthy_eating"], default: "healthy_eating" }
  },
  
  // Daily targets
  dailyTargets: {
    calories: { type: Number, default: 2000 },
    protein: { type: Number, default: 50 }, // grams
    carbs: { type: Number, default: 250 }, // grams
    fat: { type: Number, default: 65 }, // grams
    water: { type: Number, default: 8 } // glasses
  },
  
  // Dietary preferences
  preferences: {
    dietType: { type: String, enum: ["omnivore", "vegetarian", "vegan", "keto", "paleo", "mediterranean"], default: "omnivore" },
    allergies: [String], // e.g., ["peanuts", "dairy", "gluten"]
    dislikedFoods: [String],
    cuisinePreferences: [String] // e.g., ["indian", "italian", "mexican"]
  },
  
  // Meal logs
  mealLogs: [mealLogSchema],
  
  // Water intake tracking
  waterLogs: [{
    glasses: { type: Number, default: 1 },
    date: { type: Date, default: Date.now }
  }],
  
  // AI meal suggestions history
  aiSuggestions: [{
    query: String,
    suggestion: String,
    date: { type: Date, default: Date.now }
  }]
  
}, { timestamps: true })

// Calculate daily totals
dietSchema.methods.getDailyTotals = function(date) {
  const targetDate = date ? new Date(date) : new Date()
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))
  
  const todayMeals = this.mealLogs.filter(meal => 
    meal.date >= startOfDay && meal.date <= endOfDay
  )
  
  const todayWater = this.waterLogs.filter(log =>
    log.date >= startOfDay && log.date <= endOfDay
  ).reduce((sum, log) => sum + log.glasses, 0)
  
  const totals = todayMeals.reduce((acc, meal) => {
    meal.foods.forEach(food => {
      acc.calories += food.calories || 0
      acc.protein += food.protein || 0
      acc.carbs += food.carbs || 0
      acc.fat += food.fat || 0
    })
    return acc
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
  
  totals.water = todayWater
  return totals
}

export default mongoose.model("Diet", dietSchema)

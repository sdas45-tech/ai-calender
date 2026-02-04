import Diet from "../models/Diet.js"
import Groq from "groq-sdk"

// Get or create user's diet profile
export async function getDietProfile(req, res) {
  try {
    let diet = await Diet.findOne({ userId: req.user.id })
    if (!diet) {
      diet = await Diet.create({ userId: req.user.id })
    }
    res.json(diet)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Update diet profile
export async function updateDietProfile(req, res) {
  try {
    const { profile, dailyTargets, preferences } = req.body
    let diet = await Diet.findOne({ userId: req.user.id })
    
    if (!diet) {
      diet = await Diet.create({ userId: req.user.id })
    }
    
    if (profile) diet.profile = { ...diet.profile, ...profile }
    if (dailyTargets) diet.dailyTargets = { ...diet.dailyTargets, ...dailyTargets }
    if (preferences) diet.preferences = { ...diet.preferences, ...preferences }
    
    // Auto-calculate targets based on profile if requested
    if (req.body.autoCalculate && diet.profile.weight && diet.profile.height && diet.profile.age) {
      const bmr = calculateBMR(diet.profile)
      const tdee = calculateTDEE(bmr, diet.profile.activityLevel)
      diet.dailyTargets = calculateMacros(tdee, diet.profile.goal)
    }
    
    await diet.save()
    res.json(diet)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Log a meal
export async function logMeal(req, res) {
  try {
    const { mealType, foods, notes, time } = req.body
    let diet = await Diet.findOne({ userId: req.user.id })
    
    if (!diet) {
      diet = await Diet.create({ userId: req.user.id })
    }
    
    const totalCalories = foods.reduce((sum, f) => sum + (f.calories || 0), 0)
    
    diet.mealLogs.push({
      mealType,
      foods,
      totalCalories,
      notes,
      time,
      date: new Date()
    })
    
    await diet.save()
    res.json({ success: true, meal: diet.mealLogs[diet.mealLogs.length - 1] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Log water intake
export async function logWater(req, res) {
  try {
    const { glasses = 1 } = req.body
    let diet = await Diet.findOne({ userId: req.user.id })
    
    if (!diet) {
      diet = await Diet.create({ userId: req.user.id })
    }
    
    diet.waterLogs.push({ glasses, date: new Date() })
    await diet.save()
    
    // Calculate today's total
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayWater = diet.waterLogs
      .filter(log => new Date(log.date) >= today)
      .reduce((sum, log) => sum + log.glasses, 0)
    
    res.json({ success: true, todayTotal: todayWater, target: diet.dailyTargets.water })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get daily summary
export async function getDailySummary(req, res) {
  try {
    const { date } = req.query
    const diet = await Diet.findOne({ userId: req.user.id })
    
    if (!diet) {
      return res.json({ totals: { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 }, meals: [], targets: { calories: 2000, protein: 50, carbs: 250, fat: 65, water: 8 } })
    }
    
    const targetDate = date ? new Date(date) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)
    
    const todayMeals = diet.mealLogs.filter(meal => {
      const mealDate = new Date(meal.date)
      return mealDate >= startOfDay && mealDate <= endOfDay
    })
    
    const todayWater = diet.waterLogs
      .filter(log => {
        const logDate = new Date(log.date)
        return logDate >= startOfDay && logDate <= endOfDay
      })
      .reduce((sum, log) => sum + log.glasses, 0)
    
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
    
    res.json({
      totals,
      meals: todayMeals,
      targets: diet.dailyTargets,
      remaining: {
        calories: diet.dailyTargets.calories - totals.calories,
        protein: diet.dailyTargets.protein - totals.protein,
        carbs: diet.dailyTargets.carbs - totals.carbs,
        fat: diet.dailyTargets.fat - totals.fat,
        water: diet.dailyTargets.water - totals.water
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get weekly stats
export async function getWeeklyStats(req, res) {
  try {
    const diet = await Diet.findOne({ userId: req.user.id })
    if (!diet) {
      return res.json({ days: [], averages: {} })
    }
    
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      const dayMeals = diet.mealLogs.filter(meal => {
        const mealDate = new Date(meal.date)
        return mealDate >= date && mealDate <= endOfDay
      })
      
      const totals = dayMeals.reduce((acc, meal) => {
        meal.foods.forEach(food => {
          acc.calories += food.calories || 0
          acc.protein += food.protein || 0
        })
        return acc
      }, { calories: 0, protein: 0 })
      
      days.push({
        date: date.toISOString().split('T')[0],
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        ...totals
      })
    }
    
    const averages = {
      calories: Math.round(days.reduce((s, d) => s + d.calories, 0) / 7),
      protein: Math.round(days.reduce((s, d) => s + d.protein, 0) / 7)
    }
    
    res.json({ days, averages, targets: diet.dailyTargets })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// AI Diet Assistant - Get personalized recommendations
export async function getAIDietAdvice(req, res) {
  try {
    const { query } = req.body
    const diet = await Diet.findOne({ userId: req.user.id })
    
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: "AI service not configured" })
    }
    
    const groq = new Groq({ apiKey })
    
    // Build context from user's diet profile
    let context = "User Diet Profile:\n"
    if (diet?.profile) {
      context += `- Age: ${diet.profile.age || 'Not set'}, Weight: ${diet.profile.weight || 'Not set'}kg, Height: ${diet.profile.height || 'Not set'}cm\n`
      context += `- Activity Level: ${diet.profile.activityLevel || 'moderate'}\n`
      context += `- Goal: ${diet.profile.goal || 'healthy_eating'}\n`
    }
    if (diet?.preferences) {
      context += `- Diet Type: ${diet.preferences.dietType || 'omnivore'}\n`
      if (diet.preferences.allergies?.length) context += `- Allergies: ${diet.preferences.allergies.join(', ')}\n`
      if (diet.preferences.dislikedFoods?.length) context += `- Dislikes: ${diet.preferences.dislikedFoods.join(', ')}\n`
      if (diet.preferences.cuisinePreferences?.length) context += `- Preferred Cuisines: ${diet.preferences.cuisinePreferences.join(', ')}\n`
    }
    if (diet?.dailyTargets) {
      context += `- Daily Targets: ${diet.dailyTargets.calories} cal, ${diet.dailyTargets.protein}g protein, ${diet.dailyTargets.carbs}g carbs, ${diet.dailyTargets.fat}g fat\n`
    }
    
    // Get today's intake
    if (diet) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayMeals = diet.mealLogs.filter(m => new Date(m.date) >= today)
      const consumed = todayMeals.reduce((acc, meal) => {
        meal.foods.forEach(food => {
          acc.calories += food.calories || 0
          acc.protein += food.protein || 0
        })
        return acc
      }, { calories: 0, protein: 0 })
      context += `- Today's Intake: ${consumed.calories} calories, ${consumed.protein}g protein\n`
    }
    
    const systemPrompt = `You are a helpful nutritionist and diet assistant. Provide personalized, practical diet advice based on the user's profile and goals.

${context}

Guidelines:
- Give specific food recommendations with approximate calories and macros when possible
- Consider the user's allergies, preferences, and dietary restrictions
- Suggest realistic portion sizes
- For meal plans, include variety and balance
- If suggesting recipes, keep them simple and practical
- Be encouraging and supportive
- Format responses clearly with bullet points or numbered lists when appropriate
- If asked about foods, provide nutritional information
- Consider the user's remaining daily targets when suggesting meals`

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
    
    const reply = completion.choices[0]?.message?.content || "I couldn't generate a response."
    
    // Save the suggestion
    if (diet) {
      diet.aiSuggestions.push({ query, suggestion: reply })
      if (diet.aiSuggestions.length > 50) diet.aiSuggestions = diet.aiSuggestions.slice(-50)
      await diet.save()
    }
    
    res.json({ reply })
  } catch (err) {
    console.error("AI Diet Error:", err)
    res.status(500).json({ error: err.message })
  }
}

// Delete a meal log
export async function deleteMeal(req, res) {
  try {
    const { mealId } = req.params
    const diet = await Diet.findOne({ userId: req.user.id })
    
    if (!diet) {
      return res.status(404).json({ error: "Diet profile not found" })
    }
    
    diet.mealLogs = diet.mealLogs.filter(m => m._id.toString() !== mealId)
    await diet.save()
    
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Helper functions for calorie calculations
function calculateBMR(profile) {
  const { weight, height, age, gender } = profile
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161
  }
}

function calculateTDEE(bmr, activityLevel) {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  }
  return Math.round(bmr * (multipliers[activityLevel] || 1.55))
}

function calculateMacros(tdee, goal) {
  let calories = tdee
  if (goal === 'lose_weight') calories = tdee - 500
  if (goal === 'gain_muscle') calories = tdee + 300
  
  return {
    calories: Math.round(calories),
    protein: Math.round(calories * 0.25 / 4), // 25% from protein
    carbs: Math.round(calories * 0.45 / 4), // 45% from carbs
    fat: Math.round(calories * 0.30 / 9), // 30% from fat
    water: 8
  }
}

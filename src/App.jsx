import { useState, useEffect } from "react";
import Groq from "groq-sdk";
import "./App.css";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

// MacroCard Component - moved outside to prevent recreation on each render
const MacroCard = ({ label, current, total, color, percentage }) => (
  <div className="glass-card p-6 rounded-2xl flex items-center justify-between ambient-shadow hover:scale-105 transition-transform">
    <div>
      <p className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold">
        {current}
        <span className="text-sm font-normal text-gray-500 ml-1">/ {total}g</span>
      </p>
    </div>
    <div className="relative w-20 h-20">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          className="text-gray-200"
          cx="40"
          cy="40"
          r="32"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="8"
        />
        <circle
          className={`progress-ring-circle ${color}`}
          cx="40"
          cy="40"
          r="32"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="201"
          strokeDashoffset={201 - (201 * percentage) / 100}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{percentage}%</span>
    </div>
  </div>
);

export default function App() {
  const [dietPlan, setDietPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [goal, setGoal] = useState("Weight Loss");
  const [calories, setCalories] = useState(2000);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [scrolled, setScrolled] = useState(false);
  const [showDietPlanPage, setShowDietPlanPage] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const generateDietPlan = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('Generate button clicked!'); // Debug
    setIsLoading(true);
    setError(null);
    setDietPlan(null);
    setActiveTab(0);
    setShowDietPlanPage(true); // Switch to diet plan view
    setActiveNav("Meal Plan"); // Update nav

    try {
      // Generate 3 different plan variations
      console.log('Starting to generate 3 plans...'); // Debug
      const planPromises = [1, 2, 3].map(async (planNum) => {
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a professional nutritionist. You must return ONLY valid JSON with no additional text. Use simple sentences without special characters. Do not use line breaks within strings.",
            },
            {
              role: "user",
              content: `Create a 7-day meal plan (variation ${planNum}) for ${goal} goal with ${calories} calories daily.

Return ONLY this JSON structure:
{
  "plan_name": "Creative plan name here",
  "days": [
    {
      "day": "Day 1",
      "breakfast": "Simple meal description",
      "lunch": "Simple meal description",
      "dinner": "Simple meal description",
      "daily_calories": ${calories}
    }
  ]
}

Make 7 days total. Keep meal descriptions simple (2-3 sentences max). Vary the meals for each plan variation.`,
            },
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 2000,
        });

        const rawContent = chatCompletion.choices[0]?.message?.content || "{}";
        console.log(`Plan ${planNum} raw response:`, rawContent.substring(0, 200)); // Debug
        
        try {
          const parsed = JSON.parse(rawContent);
          return parsed;
        } catch (parseError) {
          console.error(`Failed to parse plan ${planNum}:`, parseError);
          // Return a fallback plan structure
          return {
            plan_name: `${goal} Plan ${planNum}`,
            days: Array.from({ length: 7 }, (_, i) => ({
              day: `Day ${i + 1}`,
              breakfast: "Oatmeal with fresh berries and nuts. A balanced start to your day.",
              lunch: "Grilled chicken salad with mixed greens and olive oil dressing.",
              dinner: "Baked salmon with quinoa and roasted vegetables.",
              daily_calories: calories
            }))
          };
        }
      });

      const allPlans = await Promise.all(planPromises);
      
      // Validate and add plan names if missing
      allPlans.forEach((plan, index) => {
        if (!plan.plan_name) {
          plan.plan_name = `${goal} Plan ${index + 1}`;
        }
        // Ensure days array exists
        if (!plan.days || !Array.isArray(plan.days) || plan.days.length === 0) {
          plan.days = Array.from({ length: 7 }, (_, i) => ({
            day: `Day ${i + 1}`,
            breakfast: "Oatmeal with fresh berries and nuts. A balanced start to your day.",
            lunch: "Grilled chicken salad with mixed greens and olive oil dressing.",
            dinner: "Baked salmon with quinoa and roasted vegetables.",
            daily_calories: calories
          }));
        }
      });

      console.log('Plans generated successfully:', allPlans); // Debug
      setDietPlan({ plans: allPlans, selectedPlanIndex: 0 });
    } catch (err) {
      console.error("Error generating diet plan:", err);
      
      // Create fallback plans if API fails
      const fallbackPlans = [1, 2, 3].map((num) => ({
        plan_name: `${goal} - Balanced Plan ${num}`,
        days: Array.from({ length: 7 }, (_, i) => ({
          day: `Day ${i + 1}`,
          breakfast: num === 1 
            ? "Greek yogurt with honey, almonds, and mixed berries. Protein-rich breakfast."
            : num === 2
            ? "Whole grain toast with avocado and poached eggs. Heart-healthy fats."
            : "Protein smoothie with banana, spinach, and protein powder. Quick energy.",
          lunch: num === 1
            ? "Grilled chicken breast with quinoa and steamed broccoli. Lean protein meal."
            : num === 2
            ? "Tuna salad wrap with whole wheat tortilla and mixed vegetables."
            : "Turkey and vegetable stir-fry with brown rice. Asian-inspired flavors.",
          dinner: num === 1
            ? "Baked salmon with sweet potato and asparagus. Omega-3 rich dinner."
            : num === 2
            ? "Lean beef with roasted vegetables and wild rice. Satisfying meal."
            : "Grilled tofu with sauteed vegetables and quinoa. Plant-based option.",
          daily_calories: calories
        }))
      }));
      
      setDietPlan({ plans: fallbackPlans, selectedPlanIndex: 0 });
      setError("Using sample meal plans. Check your internet connection and API key for AI-generated plans.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    setShowDietPlanPage(false);
    setActiveNav("Dashboard");
  };

  // Diet Plan Page View
  if (showDietPlanPage) {
    return (
      <div className="min-h-screen bg-[#f9f9f8] text-[#191c1c]">
        {/* Top Navigation */}
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 shadow-md' : 'bg-white/70 shadow-sm'} backdrop-blur-xl border-b border-gray-200`}>
          <div className="flex justify-between items-center h-20 px-4 md:px-16 max-w-[1280px] mx-auto">
            <div className="flex items-center gap-2">
              <button onClick={handleBackToDashboard} className="text-2xl font-bold text-[#4a654f] tracking-tight hover:opacity-80">
                VitalNourish
              </button>
            </div>
            <button onClick={handleBackToDashboard} className="bg-[#4a654f] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg transition-all">
              ← Back to Dashboard
            </button>
          </div>
        </nav>

        <main className="pt-20 pb-12">
          <div className="px-5 md:px-16 py-12 max-w-[1280px] mx-auto">
            {/* Loading State */}
            {isLoading && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-3xl p-12 text-center shadow-xl">
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex gap-3">
                      <div className="w-5 h-5 bg-[#4a654f] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-5 h-5 bg-[#74593f] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-5 h-5 bg-[#506354] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-[#4a654f] mb-3">Creating Your Personalized Meal Plans</h2>
                      <p className="text-lg text-gray-600 mb-2">Our AI nutritionist is crafting 3 unique plans for you...</p>
                      <p className="text-sm text-gray-500">This will take about 10-15 seconds</p>
                    </div>
                    <div className="w-full max-w-md bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-[#4a654f] h-full rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error State - Only show if no plans available */}
            {error && !isLoading && !dietPlan && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 text-center">
                  <span className="text-6xl mb-4 block">❌</span>
                  <h2 className="text-2xl font-bold text-red-700 mb-3">Oops! Something went wrong</h2>
                  <p className="text-red-600 mb-6">{error}</p>
                  <button 
                    onClick={handleBackToDashboard}
                    className="bg-red-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-red-700 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
            
            {/* Warning banner if using fallback plans */}
            {error && dietPlan && dietPlan.plans && (
              <div className="max-w-4xl mx-auto mb-6">
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-yellow-800">{error}</p>
                </div>
              </div>
            )}

            {/* Plans Display */}
            {dietPlan && dietPlan.plans && !isLoading && (
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-[#4a654f] mb-3">Your Personalized Meal Plans</h1>
                  <p className="text-lg text-gray-600">Choose the plan that best fits your lifestyle</p>
                </div>

                {/* Plan Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {dietPlan.plans.map((plan, planIndex) => (
                    <div
                      key={planIndex}
                      onClick={() => setDietPlan({ ...dietPlan, selectedPlanIndex: planIndex })}
                      className={`cursor-pointer p-8 rounded-3xl transition-all transform hover:scale-105 hover:shadow-2xl ${
                        dietPlan.selectedPlanIndex === planIndex
                          ? 'bg-gradient-to-br from-[#4a654f] to-[#506354] text-white shadow-2xl scale-105'
                          : 'bg-white text-gray-800 shadow-lg'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-5xl">{planIndex === 0 ? '🥗' : planIndex === 1 ? '🍱' : '🥙'}</span>
                        <div className="flex-1">
                          <h3 className="font-bold text-xl mb-1">{plan.plan_name || `Plan ${planIndex + 1}`}</h3>
                          <p className={`text-sm ${dietPlan.selectedPlanIndex === planIndex ? 'text-white/80' : 'text-gray-500'}`}>
                            7-Day Nutrition Plan
                          </p>
                        </div>
                      </div>
                      {plan.days && plan.days[0] && (
                        <div className={`text-sm mb-4 ${dietPlan.selectedPlanIndex === planIndex ? 'text-white/90' : 'text-gray-600'}`}>
                          <p className="line-clamp-3 leading-relaxed">
                            <strong>Day 1 Breakfast:</strong> {plan.days[0].breakfast?.substring(0, 80)}...
                          </p>
                        </div>
                      )}
                      {dietPlan.selectedPlanIndex === planIndex ? (
                        <div className="flex items-center gap-2 text-sm font-semibold bg-white/20 rounded-full px-4 py-2 w-fit">
                          <span>✓</span>
                          <span>Selected Plan</span>
                        </div>
                      ) : (
                        <div className="text-sm font-semibold text-[#4a654f]">
                          Click to select →
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Selected Plan Display */}
                {dietPlan.plans[dietPlan.selectedPlanIndex]?.days && (
                  <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
                    <div className="bg-gradient-to-r from-[#4a654f] via-[#506354] to-[#4a654f] p-8 text-white">
                      <h3 className="text-3xl font-bold mb-2">
                        {dietPlan.plans[dietPlan.selectedPlanIndex].plan_name || `Plan ${dietPlan.selectedPlanIndex + 1}`}
                      </h3>
                      <p className="text-lg opacity-90">Your personalized 7-day nutrition journey • {calories} calories/day • {goal}</p>
                    </div>
                    
                    <div className="flex overflow-x-auto bg-[#f3f4f3] border-b border-gray-200 px-8">
                      {dietPlan.plans[dietPlan.selectedPlanIndex].days.map((day, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveTab(index)}
                          className={`flex-1 min-w-[120px] px-6 py-5 text-sm font-bold transition-all ${
                            activeTab === index
                              ? 'bg-white text-[#4a654f] border-b-4 border-[#4a654f] -mb-[1px]'
                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                          }`}
                        >
                          <div className="text-xs mb-1 opacity-70">Day</div>
                          <div className="text-2xl">{index + 1}</div>
                        </button>
                      ))}
                    </div>
                    
                    <div className="p-10">
                      <div className="flex justify-between items-center border-b-2 border-gray-100 pb-6 mb-8">
                        <h3 className="text-3xl font-bold text-[#191c1c]">
                          {dietPlan.plans[dietPlan.selectedPlanIndex].days[activeTab].day || `Day ${activeTab + 1}`}
                        </h3>
                        <span className="bg-gradient-to-r from-[#e8f8f5] to-[#d3e8d5] text-[#16a085] px-6 py-3 rounded-full font-bold text-lg shadow-md">
                          🔥 {dietPlan.plans[dietPlan.selectedPlanIndex].days[activeTab].daily_calories || calories} kcal
                        </span>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="p-6 bg-gradient-to-r from-[#fff5e6] to-[#fcfdfe] border-l-4 border-[#f39c12] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                          <h4 className="text-xl font-bold text-[#d35400] mb-3 flex items-center gap-2">
                            <span className="text-3xl">🍳</span> Breakfast
                          </h4>
                          <p className="leading-relaxed text-gray-700 text-lg">
                            {dietPlan.plans[dietPlan.selectedPlanIndex].days[activeTab].breakfast}
                          </p>
                        </div>
                        <div className="p-6 bg-gradient-to-r from-[#e8f8f5] to-[#fcfdfe] border-l-4 border-[#2ecc71] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                          <h4 className="text-xl font-bold text-[#27ae60] mb-3 flex items-center gap-2">
                            <span className="text-3xl">🥗</span> Lunch
                          </h4>
                          <p className="leading-relaxed text-gray-700 text-lg">
                            {dietPlan.plans[dietPlan.selectedPlanIndex].days[activeTab].lunch}
                          </p>
                        </div>
                        <div className="p-6 bg-gradient-to-r from-[#e3f2fd] to-[#fcfdfe] border-l-4 border-[#3498db] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                          <h4 className="text-xl font-bold text-[#2980b9] mb-3 flex items-center gap-2">
                            <span className="text-3xl">🍽️</span> Dinner
                          </h4>
                          <p className="leading-relaxed text-gray-700 text-lg">
                            {dietPlan.plans[dietPlan.selectedPlanIndex].days[activeTab].dinner}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-8 flex justify-between items-center">
                        <button 
                          onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
                          disabled={activeTab === 0}
                          className="bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700 px-6 py-3 rounded-full font-semibold transition-all"
                        >
                          ← Previous Day
                        </button>
                        <button 
                          onClick={() => setActiveTab(Math.min(6, activeTab + 1))}
                          disabled={activeTab === 6}
                          className="bg-[#4a654f] hover:bg-[#334d38] disabled:opacity-30 disabled:cursor-not-allowed text-white px-6 py-3 rounded-full font-semibold transition-all"
                        >
                          Next Day →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Dashboard View (default)
  return (
    <div className="min-h-screen bg-[#f9f9f8] text-[#191c1c]">
      {/* Top Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 shadow-md' : 'bg-white/70 shadow-sm'} backdrop-blur-xl border-b border-gray-200`}>
        <div className="flex justify-between items-center h-20 px-4 md:px-16 max-w-[1280px] mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#4a654f] tracking-tight">VitalNourish</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {["Dashboard", "Meal Plan", "Recipes", "Analytics"].map((item) => (
              <a
                key={item}
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveNav(item); }}
                className={`${activeNav === item ? 'text-[#4a654f] font-bold border-b-2 border-[#4a654f] pb-1' : 'text-gray-500 hover:text-[#4a654f]'} transition-colors`}
              >
                {item}
              </a>
            ))}
          </div>
          <button className="bg-[#4a654f] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg transition-all">
            Build Your Plan
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        <div className="px-5 md:px-16 py-12 max-w-[1280px] mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-[#4a654f] mb-6 leading-tight">
              Nourish Your Body, <br />
              <span className="text-[#74593f]">Empower Your Life</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience clinical precision meets organic warmth. Our AI-driven platform crafts a nutritional journey as unique as you are.
            </p>
          </section>

          {/* Macro Tracking */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-[#4a654f] mb-6 text-center">Nutrition Pulse</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <MacroCard label="Carbs" current="145" total="200" color="text-[#74593f]" percentage={72} />
              <MacroCard label="Protein" current="88" total="120" color="text-[#4a654f]" percentage={73} />
              <MacroCard label="Fat" current="42" total="60" color="text-[#506354]" percentage={70} />
            </div>
          </section>

          {/* AI Diet Plan Generator */}
          <section className="mb-12 bg-gradient-to-br from-[#cceacf] to-[#d3e8d5] p-12 rounded-3xl shadow-2xl max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-6xl mb-4 block">🤖</span>
              <h2 className="text-4xl font-bold text-[#253f2b] mb-3">AI Nutrition Planner</h2>
              <p className="text-lg text-[#253f2b]/80">Generate 3 personalized meal plans tailored to your goals</p>
            </div>
            
            <form onSubmit={generateDietPlan} className="max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-[#253f2b]">Diet Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="px-5 py-4 rounded-xl border-2 border-white bg-white text-lg focus:outline-none focus:ring-4 focus:ring-[#4a654f]/30"
                  >
                    <option value="Weight Loss">🏃 Weight Loss</option>
                    <option value="Muscle Gain">💪 Muscle Gain</option>
                    <option value="Maintenance">⚖️ Maintenance</option>
                    <option value="Vegan">🌱 Vegan</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-[#253f2b]">Daily Calories</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    step="100"
                    min="1000"
                    max="5000"
                    className="px-5 py-4 rounded-xl border-2 border-white bg-white text-lg focus:outline-none focus:ring-4 focus:ring-[#4a654f]/30"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full py-5 text-xl font-bold bg-[#4a654f] text-white rounded-xl hover:bg-[#334d38] transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
              >
                Generate 3 Personalized Plans →
              </button>
            </form>
          </section>

          {/* Nutrition Tips */}
          <section className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-[#4a654f] mb-8 text-center">Daily Nourishment Tips</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { icon: "💧", title: "Hydration Boost", desc: "Drink 500ml of water before your first meal to jumpstart your metabolism." },
                { icon: "🍴", title: "Mindful Eating", desc: "Chew each bite 20 times to improve digestion and feel fuller faster." },
                { icon: "😴", title: "The 3-Hour Rule", desc: "Avoid large meals at least 3 hours before sleep for optimal recovery." },
                { icon: "🏋️", title: "Pre-Workout Fuel", desc: "A small banana 30 mins before training provides sustained energy." }
              ].map((tip, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-md hover:-translate-y-2 transition-transform">
                  <div className="text-4xl mb-3">{tip.icon}</div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{tip.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#e7e8e7] w-full py-12 mt-16">
        <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-16 max-w-[1280px] mx-auto gap-4">
          <div>
            <span className="text-2xl font-bold text-[#4a654f]">VitalNourish</span>
            <p className="text-gray-500 text-sm">© 2024 VitalNourish. Nourishing your journey.</p>
          </div>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms", "Help", "Contact"].map((link) => (
              <a key={link} href="#" className="text-gray-500 hover:text-[#4a654f] text-sm">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

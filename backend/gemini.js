import axios from "axios"

// ─── Local Pattern Matching (runs BEFORE calling Gemini for speed) ───

const YOUTUBE_PLAY_PATTERNS = [
  // English: "play X on youtube/yt/you tube"
  /play\s+(.+?)\s+on\s+(youtube|yt|you\s*tube)/i,
  // English: "on youtube/yt play X"
  /on\s+(youtube|yt|you\s*tube)\s+play\s+(.+)/i,
  // English: "play on youtube/yt X"
  /play\s+on\s+(youtube|yt|you\s*tube)\s+(.+)/i,
  // Hindi/Hinglish: "youtube pe X chalao/bajao/play karo"
  /(?:youtube|yt)\s+(?:pe|par|p)\s+(.+?)\s+(chalao|bajao|play\s*karo|chala\s*do|baja\s*do)/i,
  // Hindi/Hinglish: "X chalao/bajao youtube pe"
  /(.+?)\s+(chalao|bajao)\s+(?:youtube|yt)\s+(?:pe|par|p)/i,
]

const YOUTUBE_SEARCH_PATTERNS = [
  /search\s+(.+?)\s+on\s+(youtube|yt|you\s*tube)/i,
  /(?:youtube|yt)\s+(?:pe|par)\s+(.+?)\s+(search\s*karo|dikhao|dhundho|search)/i,
  /search\s+(?:youtube|yt)\s+(?:for\s+)?(.+)/i,
  /on\s+(?:youtube|yt)\s+search\s+(.+)/i,
]

const GOOGLE_SEARCH_PATTERNS = [
  /(?:google|search)\s+(?:for|about|karo)?\s*(.+)/i,
  /(?:google)\s+(?:pe|par)\s+(.+?)\s+(search\s*karo|dhundho|search)/i,
  /search\s+(.+?)\s+on\s+google/i,
]

const APP_OPEN_PATTERNS = [
  { regex: /open\s+(calculator|calc)/i, type: "calculator-open" },
  { regex: /(?:calculator|calc)\s+(open\s*karo|kholo)/i, type: "calculator-open" },
  { regex: /open\s+instagram/i, type: "instagram-open" },
  { regex: /(?:instagram)\s+(open\s*karo|kholo)/i, type: "instagram-open" },
  { regex: /open\s+facebook/i, type: "facebook-open" },
  { regex: /(?:facebook)\s+(open\s*karo|kholo)/i, type: "facebook-open" },
  { regex: /open\s+(whatsapp|whats\s*app)/i, type: "whatsapp-open" },
  { regex: /(?:whatsapp|whats\s*app)\s+(open\s*karo|kholo)/i, type: "whatsapp-open" },
  { regex: /open\s+(twitter|x\.com)/i, type: "twitter-open" },
  { regex: /(?:twitter)\s+(open\s*karo|kholo)/i, type: "twitter-open" },
  { regex: /open\s+linkedin/i, type: "linkedin-open" },
  { regex: /(?:linkedin)\s+(open\s*karo|kholo)/i, type: "linkedin-open" },
  { regex: /open\s+(spotify)/i, type: "spotify-open" },
  { regex: /(?:spotify)\s+(open\s*karo|kholo)/i, type: "spotify-open" },
  { regex: /open\s+(github)/i, type: "github-open" },
  { regex: /(?:github)\s+(open\s*karo|kholo)/i, type: "github-open" },
  { regex: /open\s+(reddit)/i, type: "reddit-open" },
  { regex: /(?:reddit)\s+(open\s*karo|kholo)/i, type: "reddit-open" },
  { regex: /open\s+(amazon)/i, type: "amazon-open" },
  { regex: /(?:amazon)\s+(open\s*karo|kholo)/i, type: "amazon-open" },
  { regex: /open\s+(snapchat)/i, type: "snapchat-open" },
  { regex: /(?:snapchat)\s+(open\s*karo|kholo)/i, type: "snapchat-open" },
  { regex: /open\s+(telegram)/i, type: "telegram-open" },
  { regex: /(?:telegram)\s+(open\s*karo|kholo)/i, type: "telegram-open" },
  { regex: /open\s+(gmail|email|mail)/i, type: "gmail-open" },
  { regex: /(?:gmail|email|mail)\s+(open\s*karo|kholo)/i, type: "gmail-open" },
  { regex: /open\s+(maps|google\s*maps|map)/i, type: "maps-open" },
  { regex: /(?:maps|google\s*maps|map)\s+(open\s*karo|kholo)/i, type: "maps-open" },
  { regex: /open\s+(pinterest)/i, type: "pinterest-open" },
  { regex: /(?:pinterest)\s+(open\s*karo|kholo)/i, type: "pinterest-open" },
  { regex: /open\s+(.+)/i, type: "app-open" },
]

const TIME_DATE_PATTERNS = [
  { regex: /\b(what\s*(?:'s|is)\s*the\s*time|time\s+(?:kya|batao|bata\s*do)|kitne\s+baje)/i, type: "get-time" },
  { regex: /\b(what\s*(?:'s|is)\s*(?:the|today'?s?)\s*date|date\s+(?:kya|batao)|aaj\s+(?:kya|ki)\s+(?:date|tarikh))/i, type: "get-date" },
  { regex: /\b(what\s*(?:'s|is)\s*(?:the)?\s*day|(?:aaj|today)\s+(?:kya|kaun\s*sa)\s+(?:day|din))/i, type: "get-day" },
  { regex: /\b(what\s*(?:'s|is)\s*(?:the)?\s*(?:current\s*)?month|(?:kaun\s*sa|kya|konsa)\s+(?:month|mahina))/i, type: "get-month" },
]

const WEATHER_PATTERNS = [
  /\b(weather|mausam|mosam)\b/i,
  /\b(temperature|temp)\b/i,
]

const NEWS_PATTERNS = [
  /\b(news|khabar|khabaren|headlines|samachar)\b/i,
  /\b(latest\s*news|trending\s*news|top\s*news)\b/i,
]

const JOKE_PATTERNS = [
  /\b(tell\s*(?:me\s*)?(?:a\s*)?joke|joke\s*sunao|mazak\s*sunao|funny\s*joke)\b/i,
  /\b(make\s*me\s*laugh|kuch\s*funny\s*bolo)\b/i,
]

const TRANSLATE_PATTERNS = [
  /translate\s+(.+?)\s+(?:to|in|into)\s+(.+)/i,
  /(.+?)\s+(?:ko|ka)\s+(.+?)\s+(?:me|mein)\s+translate\s*karo/i,
]

const MUSIC_PLAY_PATTERNS = [
  /play\s+(?:some\s+)?music/i,
  /(?:music|gaana|song)\s+(chalao|bajao|play\s*karo)/i,
  /play\s+(?:a\s+)?song/i,
]

const PLAY_RESPONSES = [
  "Playing it now on YouTube!",
  "Sure, playing that for you!",
  "Got it, playing on YouTube!",
  "Here you go, playing now!",
]

const SEARCH_RESPONSES = [
  "Searching YouTube for that!",
  "Let me find that on YouTube!",
  "Here are the YouTube results!",
]

/**
 * Extract search term from a YouTube play command by cleaning known phrases.
 */
function extractYouTubeTerm(command) {
  let term = command
    .replace(/\b(play|on|youtube|yt|you\s*tube|chalao|bajao|play\s*karo|chala\s*do|baja\s*do|pe|par|p|hey|veda)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  return term || command
}

/**
 * Try to match command locally before calling Gemini API.
 * Returns a response object if matched, null otherwise.
 */
function matchLocally(command) {
  const lower = command.toLowerCase()

  // --- YouTube Play ---
  for (const pattern of YOUTUBE_PLAY_PATTERNS) {
    const m = command.match(pattern)
    if (m) {
      const term = extractYouTubeTerm(command)
      return {
        type: "youtube-play",
        userInput: term,
        response: PLAY_RESPONSES[Math.floor(Math.random() * PLAY_RESPONSES.length)],
        confidence: 0.95,
      }
    }
  }
  // Catch-all: "play X" + command contains youtube/yt anywhere
  if (/\bplay\b/i.test(lower) && /\b(youtube|yt|you\s*tube)\b/i.test(lower)) {
    return {
      type: "youtube-play",
      userInput: extractYouTubeTerm(command),
      response: PLAY_RESPONSES[Math.floor(Math.random() * PLAY_RESPONSES.length)],
      confidence: 0.9,
    }
  }

  // --- YouTube Search ---
  for (const pattern of YOUTUBE_SEARCH_PATTERNS) {
    const m = command.match(pattern)
    if (m) {
      const term = m[1]
        .replace(/\b(on|youtube|yt|you\s*tube|search|karo|pe|par)\b/gi, '')
        .trim() || command
      return {
        type: "youtube-search",
        userInput: term,
        response: SEARCH_RESPONSES[Math.floor(Math.random() * SEARCH_RESPONSES.length)],
        confidence: 0.9,
      }
    }
  }

  // --- App Open / Social Media ---
  for (const { regex, type } of APP_OPEN_PATTERNS) {
    const m = command.match(regex)
    if (m) {
      const appName = m[1] || ""
      return {
        type,
        userInput: command,
        response: `Opening ${appName || type.replace('-open', '')} for you!`,
        confidence: 0.95,
        ...(type === "app-open" ? { appName: appName.trim() } : {}),
      }
    }
  }

  // --- Time / Date ---
  for (const { regex, type } of TIME_DATE_PATTERNS) {
    if (regex.test(command)) {
      return { type, userInput: command, response: "", confidence: 0.95 }
    }
  }

  // --- Weather ---
  for (const pattern of WEATHER_PATTERNS) {
    if (pattern.test(command)) {
      return { type: "weather-show", userInput: command, response: "Let me check the weather for you!", confidence: 0.85 }
    }
  }

  // --- News ---
  for (const pattern of NEWS_PATTERNS) {
    if (pattern.test(command)) {
      return { type: "news-show", userInput: command, response: "Let me get the latest news for you!", confidence: 0.85 }
    }
  }

  // --- Jokes ---
  for (const pattern of JOKE_PATTERNS) {
    if (pattern.test(command)) {
      return { type: "joke-tell", userInput: command, response: "", confidence: 0.9 }
    }
  }

  // --- Translate ---
  for (const pattern of TRANSLATE_PATTERNS) {
    const m = command.match(pattern)
    if (m) {
      return { type: "translate", userInput: m[1]?.trim() || command, response: "", targetLang: m[2]?.trim() || "English", confidence: 0.9 }
    }
  }

  // --- Music (generic play music/song → YouTube) ---
  for (const pattern of MUSIC_PLAY_PATTERNS) {
    if (pattern.test(command)) {
      return { type: "music-play", userInput: "popular music mix", response: "Playing some music for you!", confidence: 0.85 }
    }
  }

  return null // no local match → fall through to Gemini
}

// ─── Gemini API Call ─────────────────────────────────────────────────

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

async function callGeminiAPI(apiUrl, payload, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await axios.post(apiUrl, payload, { timeout: 30000 })
      return result.data
    } catch (err) {
      console.log(`Gemini API attempt ${attempt + 1} failed:`, err.message)
      if (err.response) {
        console.log(`Status: ${err.response.status}, Data:`, JSON.stringify(err.response.data).slice(0, 300))
      }
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)))
      } else {
        throw err
      }
    }
  }
}

/**
 * Parse Gemini text response into a JSON object safely.
 */
function parseGeminiJSON(responseText) {
  // Strip markdown code fences if present
  let cleaned = responseText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()

  // Find JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }
  return JSON.parse(cleaned)
}

// ─── Main Export ─────────────────────────────────────────────────────

const geminiResponse = async (command, assistantName = "VEDA", userName = "User") => {
  try {
    // 1. Clean wake-word from command
    const cleanCommand = command
      .replace(/^(hey\s+)?(veda|VEDA)\s*/i, '')
      .trim()

    // 2. Try local pattern matching first (fast, no API call)
    const localMatch = matchLocally(cleanCommand)
    if (localMatch && localMatch.confidence >= 0.85) {
      console.log("[Local match]", localMatch.type, "→", localMatch.userInput)
      // Return as JSON string so the controller's existing JSON extraction works
      return JSON.stringify(localMatch)
    }

    // 3. Fall through to Gemini API
    const apiUrl = process.env.GEMINI_API_URL
    if (!apiUrl) {
      console.error("GEMINI_API_URL is not set in environment variables")
      return JSON.stringify({
        type: "general",
        userInput: command,
        response: "Sorry, I'm not configured properly right now.",
      })
    }

    const prompt = `You are a virtual assistant named ${assistantName} created by Pratham.
You are a voice-enabled assistant that understands natural language commands in English and Hindi/Hinglish.
The user's name is ${userName}.

Analyze the user's spoken input and return ONLY a valid JSON object (no other text).

JSON structure:
{
  "type": "<one of the types listed below>",
  "userInput": "<extracted search term or cleaned user input>",
  "response": "<short, natural spoken response to be read aloud>",
  "appName": "<optional: only for app-open type>"
}

Valid types:
- "general": factual/informational question, greeting, small talk, or any question you can answer directly. Keep response short and voice-friendly.
- "google-search": user wants to search Google. userInput = the search query only.
- "youtube-search": user wants to search YouTube. userInput = the search term only.
- "youtube-play": user wants to play a video/song on YouTube. userInput = ONLY the song/video name (remove "play", "on youtube", "on yt", "chalao", etc.).
- "get-time": user asks current time.
- "get-date": user asks today's date.
- "get-day": user asks what day it is.
- "get-month": user asks current month.
- "calculator-open": user wants to open calculator.
- "instagram-open": user wants to open Instagram.
- "facebook-open": user wants to open Facebook.
- "whatsapp-open": user wants to open WhatsApp.
- "twitter-open": user wants to open Twitter/X.
- "linkedin-open": user wants to open LinkedIn.
- "spotify-open": user wants to open Spotify.
- "github-open": user wants to open GitHub.
- "reddit-open": user wants to open Reddit.
- "amazon-open": user wants to open Amazon.
- "snapchat-open": user wants to open Snapchat.
- "telegram-open": user wants to open Telegram.
- "gmail-open": user wants to open Gmail/email.
- "maps-open": user wants to open Google Maps.
- "pinterest-open": user wants to open Pinterest.
- "weather-show": user wants weather info.
- "news-show": user wants latest news or headlines.
- "joke-tell": user wants to hear a joke. Provide a short, clean funny joke in response.
- "translate": user wants to translate text. userInput = text to translate, add "targetLang" field with the target language.
- "music-play": user wants to play random music/songs. userInput = genre or "popular music mix".
- "app-open": user wants to open any other app (set appName field).

CRITICAL RULES:
1. "yt" = "youtube". Always treat "yt" as YouTube.
2. "you tube" (with space) = "youtube". 
3. For youtube-play: extract ONLY the song/video name. Examples:
   - "play Despacito on youtube" → userInput: "Despacito"
   - "play on yt Shape of You" → userInput: "Shape of You"
   - "youtube pe Believer chalao" → userInput: "Believer"
4. Remove the assistant name (${assistantName}) from userInput if present.
5. For google-search: extract only the search query (remove "search for", "Google", etc.).
6. If someone asks who made/created you → "I was created by Pratham".
7. Respond ONLY with the JSON object. No markdown, no explanation.

User said: "${cleanCommand}"
`

    const data = await callGeminiAPI(apiUrl, {
      contents: [{ parts: [{ text: prompt }] }],
    })

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!responseText) {
      console.log("Empty Gemini response")
      return JSON.stringify({
        type: "general",
        userInput: command,
        response: "I didn't catch that. Could you say it again?",
      })
    }

    // Validate parsed result has required fields
    try {
      const parsed = parseGeminiJSON(responseText)
      if (!parsed.type || !parsed.response) {
        throw new Error("Missing required fields in Gemini response")
      }
      // Normalize: if Gemini returned raw object, stringify for controller
      return JSON.stringify(parsed)
    } catch (parseErr) {
      console.log("JSON parse error:", parseErr.message, "| Raw:", responseText)
      return JSON.stringify({
        type: "general",
        userInput: command,
        response: "I didn't understand that. Could you please repeat?",
      })
    }
  } catch (error) {
    console.log("Gemini API Error:", error.message)
    if (error.response) {
      console.log("Response status:", error.response.status)
      console.log("Response data:", JSON.stringify(error.response.data).slice(0, 500))
    } else if (error.code) {
      console.log("Error code:", error.code)
    }
    return JSON.stringify({
      type: "general",
      userInput: command,
      response: "Sorry, I'm having trouble connecting right now.",
    })
  }
}

// ─── Helper: test YouTube commands directly (useful for debugging) ───

export const testYouTubeCommand = (command) => {
  const cleaned = command.replace(/^(hey\s+)?(veda|VEDA)\s*/i, '').trim()
  return matchLocally(cleaned)
}

export default geminiResponse
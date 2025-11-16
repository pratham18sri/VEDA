import axios from "axios";

const geminiResponse = async (command) => {
  try {
    const apiUrl = process.env.GEMINI_API_URL;

    const prompt = `
You are a virtual assistant named VEDA created by Pratham Srivastav. 
Behave like a voice-enabled smart assistant.

You must respond ONLY in the following JSON format:

{
  "type": "general" | 
          "google-search" | 
          "youtube-search" | 
          "youtube-play" |
          "instagram-open" |
          "facebook-open" |
          "calculator-open" |
          "weather-show" |
          "whatsapp-open" |
          "gmail-open" |
          "maps-open" |
          "maps-search" |
          "camera-open" |
          "settings-open" |
          "files-open" |
          "music-open" |
          "twitter-open" |
          "snapchat-open" |
          "open-website" |
          "alarm-set" |
          "reminder-set" |
          "timer-set" |
          "torch-on" |
          "torch-off" |
          "phone-call" |
          "message-send" |
          "volume-up" |
          "volume-down" |
          "brightness-up" |
          "brightness-down" |
          "wifi-on" |
          "wifi-off" |
          "bluetooth-on" |
          "bluetooth-off" |
          "get-time" |
          "get-date" |
          "get-day" |
          "get-month",

  "userInput": "<cleaned user text>",
  "response": "<short spoken response>"
}

RULES FOR "userInput":
- Remove your name “VEDA” if mentioned.
- If the user asks for Google or YouTube search, ONLY include the search query.
- If user says “open website amazon.com”, then userInput = “amazon.com”.

INTENT detection rules:

"google-search" → user asks "google pe search", "search on google", etc.  
"youtube-search" → user asks to search something on YouTube  
"youtube-play" → user asks to play a video or music  
"instagram-open" → open Instagram  
"facebook-open" → open Facebook  
"whatsapp-open" → open WhatsApp  
"gmail-open" → open Gmail  
"maps-open" → open Google Maps  
"maps-search" → search a location  
"open-website" → if user says "open (any-url)"  
"alarm-set" → set alarm  
"reminder-set" → set reminder  
"timer-set" → set timer  
"phone-call" → call someone  
"message-send" → send sms/message  
"torch-on/off" → flashlight control  
"volume-up/down" → control volume  
"brightness-up/down" → control brightness  
"wifi-on/off" → WiFi control  
"bluetooth-on/off" → BT control  
"get-time" → ask time  
"get-date" → ask date  
"get-day" → ask day  
"get-month" → ask month  
"general" → normal questions or information  

IMPORTANT:
- If someone asks "Who made you?" → reply: "I was created by Pratham."
- Response must be short and voice-friendly.
- Return ONLY the JSON. No extra text.

NOW PROCESS THIS USER INPUT:
${command}
`;

    const result = await axios.post(apiUrl, {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    });

    return result.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.log("VEDA Error:", error);
  }
};

export default geminiResponse;

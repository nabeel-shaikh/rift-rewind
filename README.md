🎮 **Replay.gg – AI-Powered League Coaching & Wrapped Insights**

Replay.gg transforms your League of Legends stats into a Spotify Wrapped–style experience.
It combines live match data from the Riot Games API with AWS Bedrock (Claude 3 Sonnet) to generate personal coaching summaries, insights, and champion recommendations — all visualized in a clean Next.js frontend.

🚀 **Features**

🧠 **AI Coaching Summaries** – Bedrock analyzes your last 5, 10, and 15 games and produces three tailored motivational blurbs.
🧩 **Champion Suggestions** – Claude recommends three new champions based on your playstyle and performance trends.
📊 **Live Match Data** – Stats pulled directly from the Riot Developer API.
🎨 **Responsive Interface** – Next.js App Router + Tailwind CSS for a sleek, immersive UI.
🏆 **“Rift Wrapped” Mode** – A year-end recap inspired by Spotify Wrapped, highlighting your gameplay story.

         


**Here are the setup instructions**

1. Clone the Repo

run these 2 commands:

         git clone https://github.com/<username>/rift-rewind.git

         cd rift-rewind

2. Install dependencies

Run these 2 commands:

         cd client && npm install

         cd ../server && npm install



3. Configure Environment Variables
Create a .env file in server/ with your credentials:
RIOT_API_KEY=your-riot-api-key
AWS_ACCESS_KEY_ID=your-bedrock-access-key
AWS_SECRET_ACCESS_KEY=your-bedrock-secret-key
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
PORT=4000

For local frontend dev, create an .env file in /client, add this to client/.env.local:
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

4. Run project
For this, it is easier to have two terminals open.
For Terminal 1 (run first):

          cd server
          
          npm start

For Terminal 2 (run once server is running):

          cd client
          
          npm start

Finally, visit: http://localhost:3000



**Tech Stack:**
| Layer                     | Technologies                                   |
| ------------------------- | ---------------------------------------------- |
| **Frontend**              | Next.js 16 (React 19), Tailwind CSS v4         |
| **Backend**               | Node.js + Express                              |
| **AI / Cloud**            | AWS Bedrock (Claude 3 Sonnet)                  |
| **Game Data**             | Riot Developer API (Summoner V4, Match V5)     |
| **HTTP Client**           | Axios                                          |
| **Hosting (Recommended)** | Frontend → Vercel, Backend → Render or Railway |


🤖 **How It Works**

The user searches their summoner on the home page.
The frontend sends a request to /api/summary/:summonerName via Axios.
The backend fetches recent Riot match data, computes stats, and sends them to AWS Bedrock.
Bedrock returns structured JSON with three summaries (5-game, 10-game, and 15-game).
The frontend displays the summaries dynamically as users switch tabs.
A separate endpoint /api/ai/suggestChampions asks Bedrock to recommend three new champions to try next.


📸 **Demo**

Coming soon — hosted demo (planned for Vercel + Render).
For now, you can run the app locally with your Riot and AWS keys.

🔒 **License**

This project is open-source under the MIT License.
Copyright 2025 Nabeel Shaikh
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.







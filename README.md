# PocketPilot – Personal Finance Tracker

PocketPilot is a full-stack personal finance management web application that helps users track their income, expenses, and spending habits. It provides a structured dashboard, categorized transactions, and useful summaries to support better financial decisions.

## Features

- Add, edit, and delete transactions  
- Track income and expenses  
- Category-based expense management (Food, Travel, Bills, etc.)  
- Monthly summaries and insights  
- Dashboard with overall financial overview  
- Budget tracking (optional)  
- Authentication using JWT (optional)

## Tech Stack

Frontend:
- React (Vite)
- Tailwind CSS
- Axios

Backend:
- Node.js
- Express.js

Database:
- MongoDB (Mongoose)

## Project Structure

PocketPilot/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── server.js
│
└── README.md

## Installation and Setup

1. Clone the repository

git clone https://github.com/your-username/pocketpilot.git  
cd pocketpilot  

2. Setup Backend

cd backend  
npm install  

Create a .env file in the backend folder with the following:

PORT=5000  
MONGO_URI=your_mongodb_connection_string  
JWT_SECRET=your_secret_key  

Run the backend server:

npm start  

3. Setup Frontend

cd frontend  
npm install  
npm run dev  

## API Endpoints

Transactions:

GET /transactions  
Fetch all transactions  

POST /transactions  
Add a new transaction  

PUT /transactions/:id  
Update an existing transaction  

DELETE /transactions/:id  
Delete a transaction  

## Key Learnings

- Understanding full-stack architecture (frontend, backend, database)  
- Building REST APIs using Express  
- Managing state in React  
- Performing CRUD operations with MongoDB  
- Handling asynchronous requests with Axios  

## Future Enhancements

- Add data visualization using charts (Chart.js or Recharts)  
- Implement AI-based spending insights  
- Improve mobile responsiveness  
- Add budget alerts and notifications  
- Deploy the application (Render, Vercel, MongoDB Atlas)  

## Author

Dhananjai Yadav  

## License

This project is licensed under the MIT License.

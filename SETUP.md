# Setup & Dependancies
### Linux setup

Install node.js and npm <br />
`sudo apt install node.js npm`

Clone this repository and open your terminal in the root of the directory.

Install the required dependancies: <br />
`npm install discord.js` <br />
`npm install mongoose`

### .env Setup

In the root of the directory, create a file called `.env`

In this file you need to add two API keys: <br />
`TOKEN=(discord bot app token)` <br />
`MONGO_URL=(url for your mongodb database)`

### Running the bot

In linux, the bot should run with: `./start.sh` <br />
If the script doesnt run use `chmod 777 start.sh` then try running the script again

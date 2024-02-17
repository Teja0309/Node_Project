const mysql = require("mysql2/promise");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const nodeApp = express();
nodeApp.use(express.json());
const port = 7000;

let db;

const initializeDbAndServer = async() => {
    try {
        db = await mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "Teja@0309",
            database: "tejadb"
        });
        nodeApp.listen(port, () => {
            console.log("Server Running at http://localhost:7000");
        });   
    } catch (error) {
        console.log(`DB error: ${error}`);
    } 
};

initializeDbAndServer();

nodeApp.post('/addUser/', async (request, response) => {
    const {username, name, password, gender, location} = request.body;
    const encryptedPassword = await bcrypt.hash(password, 10);
    const userExistQuery = `SELECT * FROM user WHERE username='${username}';`;
    const dbUser = await db.execute(userExistQuery);
    if (dbUser.username===undefined){
      const query = `INSERT INTO user(name, username, password, gender, location) VALUES ('${name}', '${username}', '${encryptedPassword}', '${gender}', '${location}');`;
      await db.execute(query);
      response.send('User added succcessfully');
    } else{
      response.status(400).send("User already exists");
    }
  })


nodeApp.post('/login/', async (request, response) => {
    const {username, password} = request.body;
    const userExistQuery = `SELECT * FROM user WHERE username='${username}';`;
    const dbUser = await db.execute(userExistQuery);
    if (dbUser[0].length!==0){
        const checkPassword = await bcrypt.compare(password, dbUser[0][0].password);
        if (checkPassword){
            const payload = {
                username: username,
            };
            const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
            response.send({ jwtToken });
        } else{
            response.status(404).send('Incorrect Password');
        }
    } else{
        response.status(404).send('Invalid User');
    }
})


nodeApp.get('/userDetails/:id/', async (request, response) => {
     const {id} = request.params;
     let jwtToken;
     const authHeader = request.headers['authorization'];
     if (authHeader !== undefined){
        jwtToken = authHeader.split(' ')[1];
     }
     if (jwtToken === undefined){
        response.status(401).send('Invalid Access Token');
     } else{
        jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
            if (error){
                response.send('Invalid Access Token');
            } else{
                const getUserDetailsQuery = `SELECT * FROM user_data WHERE id=${id};`;
                const data = await db.execute(getUserDetailsQuery);
                response.send(data[0][0]);
            }
        })
     }
})
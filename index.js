const express = require('express');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = 3000;

// Set up MongoDB connection
const mongoURI = 'mongodb://localhost:27017';
const dbName = 'guess-the-number';
const collectionName = 'games';
const client = new MongoClient(mongoURI);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
  try {
    const leaderboard = await getLeaderboard();
    res.render('index', { leaderboard });
  } catch (error) {
    console.error('Error retrieving leaderboard:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/game', async (req, res) => {
  const playerName = req.body.playerName;
  try {
    const gameId = await createNewGame(playerName);
    res.redirect(`/game/${gameId}`);
  } catch (error) {
    console.error('Error creating new game:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/game/:id', async (req, res) => {
  const gameId = req.params.id;
  try {
    const game = await getGame(gameId);
    res.render('game', { game });
  } catch (error) {
    console.error('Error retrieving game:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/game/:id/guess', async (req, res) => {
  const gameId = req.params.id;
  const guess = parseInt(req.body.guess);
  try {
    const result = await makeGuess(gameId, guess);
    res.json(result);
  } catch (error) {
    console.error('Error making guess:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function createNewGame(playerName) {
  try {
    await client.connect();
    const db = client.db(dbName);

    const randomNumber = Math.floor(Math.random() * 100) + 1;
    const result = await db.collection(collectionName).insertOne({
      playerName,
      randomNumber,
      attempts: 0,
      guesses: [],
    });

    return result.insertedId.toString();
  } catch (error) {
    throw error;
  }
}

async function getGame(gameId) {
    try {
      await client.connect();
      const db = client.db(dbName);
      const game = await db.collection('games').findOne({ _id: new ObjectId(gameId) });
      return game;
    } catch (error) {
      throw error;
    }
  }
  

  async function makeGuess(gameId, guess) {
    try {
      await client.connect();
      const db = client.db(dbName);
      const game = await db.collection('games').findOne({ _id: new ObjectId(gameId) });
  
      ++game.attempts;
      game.guesses.push(guess);
  
      let result = '';
  
      if (guess === game.randomNumber) {
        result = 'correct';
      } else if (guess < game.randomNumber) {
        result = 'low';
      } else {
        result = 'high';
      }
  
      if (game.attempts >= 3) {
        result = 'gameover';
      }
  
      await db.collection('games').updateOne({ _id: new ObjectId(gameId) }, { $set: { attempts: game.attempts, guesses: game.guesses } });
  
      return { result };
    } catch (error) {
      throw error;
    }
  }
  
  
  
  

async function getLeaderboard() {
  try {
    await client.connect();
    const db = client.db(dbName);
    const leaderboard = await db.collection(collectionName).find().sort({ attempts: 1 }).limit(10).toArray();
    return leaderboard;
  } catch (error) {
    throw error;
  }
}

async function createDatabaseAndCollection() {
  try {
    await client.connect();
    const db = client.db(dbName);

    // Create the collection if it doesn't exist
    if (!(await db.listCollections({ name: collectionName }).hasNext())) {
      await db.createCollection(collectionName);
      console.log(`Collection '${collectionName}' created.`);
    } else {
      console.log(`Collection '${collectionName}' already exists.`);
    }
  } catch (error) {
    throw error;
  }
}

async function startServer() {
  try {
    await createDatabaseAndCollection();
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

startServer();

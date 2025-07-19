import express from "express"

const app = express();
const port = process.env.port || 3000;

const jokes = [
    {
        id: 0,
        title: "First joke",
        content: "Why did the chicken cross the road? To get to the other side!"
    },
    {
        id: 1,
        title: "Second joke",
        content: "Why don't scientists trust atoms? Because they make up everything!"
    },
    {
        id: 2,
        title: "Third joke",
        content: "What do you get when you cross a snowman with a vampire? Frostbite!"
    },
    {
        id: 3,
        title: "Fourth joke",
        content: "Why did the scarecrow win an award? Because he was outstanding in his field!"
    },
    {
        id: 4,
        title: "Fifth joke",
        content: "Why don't skeletons fight each other? They don't have the guts!"
    },
    {
        id: 5,
        title: "Sixth joke",
        content: "What do you call fake spaghetti? An impasta!"
    }
]

app.get('/api/jokes', (req, res) => {
    res.send(jokes)
})

app.listen(port, () => {
    console.log(`Our server: ${port}`)
})
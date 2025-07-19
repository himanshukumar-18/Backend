import express from "express"

const app = express();
const port = process.env.port || 4000;

app.get('/', (req, res) => {
    res.send('Welcome')
})

app.get('/twitter', (req, res) => {
    res.send('himanshu@twitter.com')
})

app.listen(port, () => {
    console.log(`Our Server: ${port}`)
})
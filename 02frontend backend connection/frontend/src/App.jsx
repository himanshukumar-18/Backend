import { useEffect, useState } from 'react'
import axios from "axios"
import './App.css'

function App() {

  const [joke, setJoke] = useState([])

  useEffect(() => {
    axios.get('/api/jokes')
      .then(res => setJoke(res.data))
      .catch(err => console.log(err))
  }, [])

  return (
    <>
      <h1>Full Stack With Himanshu</h1>
      <p>Total jokes: {joke.length}</p>

      {
        joke.map((joke, index) => (
          <div key={index}>
            <h2>{joke.title}</h2>
            <p>{joke.content}</p>
          </div>
        ))
      }
    </>
  )
}

export default App

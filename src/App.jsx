import { useState } from 'react'
import LandingPage from './LandingPage'
import AnimatedBackground from './AnimatedBackground'

function App() {
  return (
    <div className="app-container">
      <AnimatedBackground />
      <LandingPage />
    </div>
  )
}

export default App

import React from 'react';
import ApologyForm from './components/ApologyForm';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>道歉信生成器</h1>
      </header>
      <main>
        <ApologyForm />
      </main>
      <footer>
        <p>&copy; 2023 道歉信生成器. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
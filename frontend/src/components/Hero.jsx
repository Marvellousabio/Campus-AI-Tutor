import React from 'react'
import {  assets } from '../js/script.js';

assets();
const Hero = () => {
  return (
    <div>
      <div className="main-content">
      <div className="ask-section">
        <h2>Ask a Question</h2>
<textarea 
  id="question" 
  placeholder="What would you like to learn today?\n\nExamples:\n• How do I solve quadratic equations step by step?\n• Explain the process of photosynthesis in detail\n• What's the difference between mitosis and meiosis?\n• Analyze the themes in Shakespeare's Romeo and Juliet\n• What are the causes of World War II?"></textarea>
        
        <div className="input-footer">
          <span className="char-count">
            <span id="charCount">0</span>/500 characters
          </span>
          <span className="keyboard-hint">Ctrl + Enter to submit</span>
        </div>

        <button id="askBtn">
          <span className="btn-text">🚀 Ask AI Tutor</span>
        </button>

        <div className="connection-status" id="connectionStatus">
          <span>🔗</span>
          <span id="statusText">Checking connection...</span>
        </div>

        <div className="current-answer hidden" id="answer">
          <div className="answer-content">Your answer will appear here...</div>
          <div className="answer-actions hidden">
            <button className="action-btn" id="copyAnswer">📋 Copy</button>
            <button className="action-btn" id="saveAnswer">💾 Save</button>
          </div>
        </div>
        <div className="current-answer hidden" id="answer">
        <div className="quick-questions">
          <h4>Quick Start</h4>
          <button className="quick-question" data-question="Explain the water cycle in detail">🌊 Explain the water cycle in detail</button>
          <button className="quick-question" data-question="How do I write a strong thesis statement?">📝 How do I write a strong thesis statement?</button>
          <button className="quick-question" data-question="What is the Pythagorean theorem and how is it used?">📐 What is the Pythagorean theorem and how is it used?</button>
          <button className="quick-question" data-question="Explain the main causes of World War 2">🌍 Explain the main causes of World War 2</button>
        </div>
      </div>

      <div className="library-section">
        <div className="library-header">
          <h2>Knowledge Library</h2>
          <div className="search-box">
            <input type="text" id="searchInput" placeholder="Search your questions..." />
          </div>
          <button className="refresh-btn" id="refreshBtn" title="Refresh from database">🔄</button>
        </div>

        <div className="stats">
          <div className="stat-item">
            <span>📊</span>
            <span>Total: <strong id="totalCount">0</strong></span>
          </div>
          <div className="stat-item">
            <span>🕒</span>
            <span id="lastUpdated">Loading...</span>
          </div>
          <div className="stat-item">
            <span>📈</span>
            <span>Today: <strong id="todayCount">0</strong></span>
          </div>
        </div>

        <div className="category-filters">
          <button className="filter-btn active" data-category="all">All Topics</button>
          <button className="filter-btn" data-category="math">📊 Math</button>
          <button className="filter-btn" data-category="science">🔬 Science</button>
          <button className="filter-btn" data-category="english">📚 English</button>
          <button className="filter-btn" data-category="history">🏛️ History</button>
          <button className="filter-btn" data-category="other">🎯 Other</button>
        </div>

        <div className="qa-list" id="qaList">
          <div className="empty-state">
            <h3>🎓 Ready to Learn?</h3>
            <p>Connect to our AI tutor and start building your personalized knowledge base! Your questions and answers will be saved for future reference.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
    </div>
  )
}

export default Hero

    class CampusQALibrary {
      constructor() {
        this.questionInput = document.getElementById("question");
        this.askBtn = document.getElementById("askBtn");
        this.answerDiv = document.getElementById("answer");
        this.qaList = document.getElementById("qaList");
        this.searchInput = document.getElementById("searchInput");
        this.totalCount = document.getElementById("totalCount");
        this.lastUpdated = document.getElementById("lastUpdated");
        this.todayCount = document.getElementById("todayCount");
        this.charCount = document.getElementById("charCount");
        this.connectionStatus = document.getElementById("connectionStatus");
        this.statusText = document.getElementById("statusText");
        this.refreshBtn = document.getElementById("refreshBtn");
        
        this.questions = [];
        this.filteredQuestions = [];
        this.currentCategory = 'all';
        this.isOnline = false;
        
        this.init();
      }

      async init() {
        this.setupEventListeners();
        this.updateCharCount();
        await this.checkConnection();
        await this.loadQuestionsFromDatabase();
        this.filterQuestions();
        this.updateStats();
      }

      async checkConnection() {
        try {
          // Test connection to your Netlify function
          const response = await fetch('/.netlify/functions/ask-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: 'test' })
          });
          
          this.isOnline = response.ok || response.status === 400; // 400 is expected for empty question
          
        } catch (error) {
          console.error('Connection test failed:', error);
          this.isOnline = false;
        }
        
        this.updateConnectionStatus();
      }

      updateConnectionStatus() {
        if (this.isOnline) {
          this.connectionStatus.className = 'connection-status online';
          this.statusText.textContent = 'Connected to AI Tutor';
        } else {
          this.connectionStatus.className = 'connection-status offline';
          this.statusText.textContent = 'Offline - Check connection';
        }
      }

      async loadQuestionsFromDatabase() {
        try {
          // Create a new Netlify function to fetch questions
          const response = await fetch('/.netlify/functions/get-questions');
          
          if (response.ok) {
            const data = await response.json();
            this.questions = data.questions.map(q => ({
              ...q,
              timestamp: new Date(q.created_at || q.timestamp),
              category: q.category || this.categorizeQuestion(q.question)
            }));
          } else {
            console.error('Failed to load questions from database');
            this.questions = this.loadFromLocalStorage() || [];
          }
        } catch (error) {
          console.error('Error loading questions:', error);
          this.questions = this.loadFromLocalStorage() || [];
        }
      }

      loadFromLocalStorage() {
        try {
          const stored = localStorage.getItem('campusQALibrary');
          if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.map(q => ({
              ...q,
              timestamp: new Date(q.timestamp)
            }));
          }
        } catch (error) {
          console.error('Error loading from localStorage:', error);
        }
        return [];
      }

      saveToLocalStorage() {
        try {
          localStorage.setItem('campusQALibrary', JSON.stringify(this.questions));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }

      setupEventListeners() {
        this.askBtn.addEventListener("click", () => this.askQuestion());
        
        this.questionInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter" && e.ctrlKey) {
            this.askQuestion();
          }
        });

        this.questionInput.addEventListener("input", () => {
          this.updateCharCount();
        });

        this.searchInput.addEventListener("input", (e) => {
          this.filterQuestions(e.target.value);
        });

        this.refreshBtn.addEventListener("click", async () => {
          this.refreshBtn.style.transform = 'rotate(360deg)';
          await this.loadQuestionsFromDatabase();
          this.filterQuestions();
          this.updateStats();
          setTimeout(() => {
            this.refreshBtn.style.transform = 'rotate(0deg)';
          }, 500);
          this.showNotification("Library refreshed!", "success");
        });

        // Category filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            this.currentCategory = e.target.dataset.category;
            this.filterQuestions(this.searchInput.value);
          });
        });

        // Quick questions
        document.querySelectorAll('.quick-question').forEach(btn => {
          btn.addEventListener('click', (e) => {
            this.questionInput.value = e.target.dataset.question;
            this.updateCharCount();
            this.questionInput.focus();
          });
        });

        // Answer actions
        document.getElementById('copyAnswer').addEventListener('click', () => {
          this.copyToClipboard();
        });

        document.getElementById('saveAnswer').addEventListener('click', () => {
          this.saveCurrentAnswer();
        });
      }

      updateCharCount() {
        const count = this.questionInput.value.length;
        this.charCount.textContent = count;
        
        if (count > 450) {
          this.charCount.style.color = 'var(--error)';
        } else if (count > 400) {
          this.charCount.style.color = 'var(--warning)';
        } else {
          this.charCount.style.color = 'var(--text-light)';
        }
      }

      async askQuestion() {
        const question = this.questionInput.value.trim();
        
        if (!question) {
          this.showNotification("Please enter a question", "error");
          return;
        }

        if (question.length > 500) {
          this.showNotification("Question is too long (max 500 characters)", "error");
          return;
        }

        if (!this.isOnline) {
          this.showNotification("No connection to AI Tutor. Please check your internet connection.", "error");
          return;
        }

        this.setLoading(true);
        this.answerDiv.style.display = 'block';
        
        try {
          // Call your Netlify function
          const response = await fetch('/.netlify/functions/ask-ai', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question })
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const answer = data.answer;
          
          if (!answer) {
            throw new Error('No answer received from AI');
          }

          // Create new question object
          const newQuestion = {
            id: Date.now(),
            question,
            answer,
            timestamp: new Date(),
            category: this.categorizeQuestion(question)
          };
          
          // Add to local array and save to localStorage as backup
          this.questions.unshift(newQuestion);
          this.saveToLocalStorage();
          
          // Show answer and update UI
          this.showAnswer(answer);
          this.questionInput.value = "";
          this.updateCharCount();
          this.filterQuestions();
          this.updateStats();
          this.showNotification("Question answered successfully!", "success");
          
        } catch (error) {
          console.error("Error asking question:", error);
          this.showAnswer("Sorry, I'm having trouble connecting to the AI tutor. Please try again in a moment.");
          this.showNotification("Error processing question. Please try again.", "error");
        } finally {
          this.setLoading(false);
        }
      }

      categorizeQuestion(question) {
        const q = question.toLowerCase();
        
        const categories = {
          math: ['math', 'equation', 'algebra', 'calculus', 'geometry', 'theorem', 'calculate', 'formula', 'solve', 'integral', 'derivative', 'quadratic', 'linear', 'trigonometry', 'statistics', 'probability'],
          science: ['science', 'physics', 'chemistry', 'biology', 'photosynthesis', 'cell', 'atom', 'molecule', 'reaction', 'evolution', 'DNA', 'ecosystem', 'gravity', 'energy', 'matter', 'organism'],
          english: ['english', 'literature', 'essay', 'shakespeare', 'writing', 'thesis', 'grammar', 'poem', 'novel', 'analysis', 'metaphor', 'symbolism', 'character', 'theme', 'rhetoric'],
          history: ['history', 'war', 'ancient', 'civilization', 'revolution', 'century', 'historical', 'empire', 'battle', 'timeline', 'democracy', 'politics', 'culture', 'society']
        };
        
        for (const [category, keywords] of Object.entries(categories)) {
          if (keywords.some(keyword => q.includes(keyword))) {
            return category;
          }
        }
        
        return 'other';
      }

      setLoading(isLoading) {
        const btnText = this.askBtn.querySelector('.btn-text');
        
        if (isLoading) {
          this.askBtn.disabled = true;
          btnText.innerHTML = '<span class="loading"></span>AI Tutor is thinking...';
          this.answerDiv.className = "current-answer loading";
          this.answerDiv.querySelector('.answer-content').textContent = "Processing your question with AI...";
        } else {
          this.askBtn.disabled = false;
          btnText.innerHTML = '🚀 Ask AI Tutor';
          this.answerDiv.className = "current-answer";
        }
      }

      showAnswer(answer) {
        this.answerDiv.querySelector('.answer-content').textContent = answer;
        this.answerDiv.querySelector('.answer-actions').style.display = 'flex';
        this.currentAnswer = answer;
      }

      filterQuestions(searchTerm = '') {
        let filtered = this.questions;
        
        if (this.currentCategory !== 'all') {
          filtered = filtered.filter(q => q.category === this.currentCategory);
        }
        
        if (searchTerm) {
          filtered = filtered.filter(q => 
            q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.answer.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        this.filteredQuestions = filtered;
        this.renderQuestions();
      }

      renderQuestions() {
        if (this.filteredQuestions.length === 0) {
          this.qaList.innerHTML = `
            <div class="empty-state">
              <h3>🎓 ${this.questions.length === 0 ? 'Ready to Learn?' : 'No matches found'}</h3>
              <p>${this.questions.length === 0 ? 
                'Connect to our AI tutor and start building your personalized knowledge base! Your questions and answers will be saved for future reference.' : 
                'Try adjusting your search terms or category filter to find what you\'re looking for.'}</p>
            </div>
          `;
          return;
        }

        this.qaList.innerHTML = this.filteredQuestions
          .map(item => `
            <div class="qa-item" data-id="${item.id}">
              <div class="qa-question">${this.escapeHtml(item.question)}</div>
              <div class="qa-answer">${this.escapeHtml(item.answer)}</div>
              <div class="qa-meta">
                <span class="category-tag">${this.getCategoryIcon(item.category)} ${item.category}</span>
                <span>${this.formatTime(item.timestamp)}</span>
              </div>
            </div>
          `).join('');
      }

      getCategoryIcon(category) {
        const icons = {
          math: '📊',
          science: '🔬',
          english: '📚',
          history: '🏛️',
          other: '🎯'
        };
        return icons[category] || '🎯';
      }

      updateStats() {
        this.totalCount.textContent = this.questions.length;
        
        // Count today's questions
        const today = new Date();
        const todayQuestions = this.questions.filter(q => {
          const qDate = new Date(q.timestamp);
          return qDate.toDateString() === today.toDateString();
        });
        this.todayCount.textContent = todayQuestions.length;
        
        if (this.questions.length > 0) {
          const lastQuestion = this.questions[0];
          this.lastUpdated.textContent = `Updated ${this.formatTime(lastQuestion.timestamp)}`;
        } else {
          this.lastUpdated.textContent = 'No questions yet';
        }
      }

      copyToClipboard() {
        if (this.currentAnswer) {
          navigator.clipboard.writeText(this.currentAnswer).then(() => {
            this.showNotification("Answer copied to clipboard!", "success");
          }).catch(() => {
            this.showNotification("Could not copy to clipboard", "error");
          });
        }
      }

      saveCurrentAnswer() {
        // This feature is already handled by the database save in askQuestion
        this.showNotification("Answer saved to your library!", "success");
      }

      showNotification(message, type) {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide after 4 seconds
        setTimeout(() => {
          notification.classList.remove('show');
          setTimeout(() => notification.remove(), 400);
        }, 4000);
      }

      escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'yesterday';
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
      }
    }

    // Initialize the application
    document.addEventListener('DOMContentLoaded', () => {
      new CampusQALibrary();
    });
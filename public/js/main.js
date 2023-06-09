document.addEventListener('DOMContentLoaded', () => {
    const guessForm = document.getElementById('guessForm');
    const guessInput = document.getElementById('guessInput');
    const resultDiv = document.getElementById('result');
  
    guessForm.addEventListener('submit', async (event) => {
      event.preventDefault();
  
      const guess = parseInt(guessInput.value);
      if (isNaN(guess) || guess < 1 || guess > 100) {
        alert('Please enter a valid number between 1 and 100.');
        return;
      }
  
      const gameId = window.location.pathname.split('/').pop();
      const response = await makeGuess(gameId, guess);
  
      if (response.error) {
        alert('An error occurred while making a guess. Please try again.');
      } else {
        if (response.result === 'correct') {
          resultDiv.innerHTML = 'Congratulations! You guessed the correct number.';
        } else if (response.result === 'low') {
          resultDiv.innerHTML = 'Too low! Try a higher number.';
        } else {
          resultDiv.innerHTML = 'Too high! Try a lower number.';
        }
      }
  
      guessInput.value = '';
    });
  
    async function makeGuess(gameId, guess) {
      const response = await fetch(`/game/${gameId}/guess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guess }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to make a guess.');
      }
  
      return response.json();
    }
  });

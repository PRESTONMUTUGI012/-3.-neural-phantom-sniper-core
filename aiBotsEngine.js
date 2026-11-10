class AISpeedBotsEngine {
  constructor(derivApiEngine, logCallback) {
    this.api = derivApiEngine;
    this.log = logCallback || console.log;
    this.activeBot = null; 
    this.lastDigits = [];
    this.tickHistory = [];
    this.isExecuting = false;
  }

  setBot(botType) {
    this.activeBot = botType;
    this.lastDigits = [];
    this.tickHistory = [];
    this.isExecuting = false;
    this.log(`[AI Speed Boat] Activated high-winrate automated strategy: ${botType.toUpperCase()}`, 'bot');
  }

  stopBot() {
    this.activeBot = null;
    this.isExecuting = false;
    this.log("[AI Speed Boat] All speed boats disengaged.", 'warning');
  }

  async processTick(tick) {
    if (!this.activeBot || this.isExecuting || !this.api.authorized) return;

    const priceStr = tick.quote.toString();
    const decimalSplit = priceStr.split('.');
    const fractionalPart = decimalSplit[1] || '0';
    const lastDecimal = parseInt(fractionalPart.slice(-1));
    const currentPrice = parseFloat(tick.quote);

    this.lastDigits.push(lastDecimal);
    if (this.lastDigits.length > 50) this.lastDigits.shift();

    this.tickHistory.push(currentPrice);
    if (this.tickHistory.length > 20) this.tickHistory.shift();

    if (this.activeBot === 'even_odd') {
      await this.runEvenOddSpeedBoat(lastDecimal);
    } else if (this.activeBot === 'matches') {
      await this.runMatchesSpeedBoat(lastDecimal);
    } else if (this.activeBot === 'rise_fall') {
      await this.runRiseFallSpeedBoat();
    }
  }

  // 🚤 SPEED BOAT 1: EVEN / ODD (Statistical Reversion High Winrate Engine)
  async runEvenOddSpeedBoat(lastDigit) {
    if (this.lastDigits.length < 10) return;

    const recent10 = this.lastDigits.slice(-10);
    const evens = recent10.filter(d => d % 2 === 0).length;
    const odds = 10 - evens;

    let contractType = null;
    if (evens >= 8) {
      contractType = 'DIGITODD'; 
    } else if (odds >= 8) {
      contractType = 'DIGITEVEN'; 
    }

    if (contractType) {
      this.isExecuting = true;
      const symbol = document.getElementById('select-market').value;
      const stake = document.getElementById('input-stake').value;

      this.log(`[Even/Odd Speed Boat] Imbalance spotted (Evens: ${evens}, Odds: ${odds}). Executing ${contractType} at ms speed...`, 'bot');
      
      try {
        const res = await this.api.executeTrade({
          symbol: symbol,
          amount: stake,
          duration: 1,
          duration_unit: 't',
          contract_type: contractType
        });
        this.log(`[Even/Odd Success] ID: ${res.contract_id} | Cost: $${res.buy_price} | Payout: $${res.payout}`, 'success');
      } catch (err) {
        this.log(`[Even/Odd Error]: ${err.message || err.code}`, 'error');
      }

      setTimeout(() => { this.isExecuting = false; }, 2000);
    }
  }

  // 🚤 SPEED BOAT 2: MATCHES (High-Frequency Pattern Digit Hunter)
  async runMatchesSpeedBoat(lastDigit) {
    if (this.lastDigits.length < 20) return;

    const counts = {};
    this.lastDigits.slice(-20).forEach(d => { counts[d] = (counts[d] || 0) + 1; });
    
    let targetDigit = 0;
    let maxFreq = 0;
    for (let d in counts) {
      if (counts[d] > maxFreq) {
        maxFreq = counts[d];
        targetDigit = parseInt(d);
      }
    }

    if (maxFreq >= 5) {
      this.isExecuting = true;
      const symbol = document.getElementById('select-market').value;
      const stake = document.getElementById('input-stake').value;

      this.log(`[Matches Speed Boat] Dominant digit ${targetDigit} detected (${maxFreq}/20). Firing DIGITMATCH barrier...`, 'bot');

      try {
        const res = await this.api.executeTradeWithBarrier({
          symbol: symbol,
          amount: stake,
          duration: 1,
          duration_unit: 't',
          contract_type: 'DIGITMATCH',
          barrier: targetDigit.toString()
        });
        this.log(`[Matches Success] ID: ${res.contract_id} | Cost: $${res.buy_price} | Payout: $${res.payout}`, 'success');
      } catch (err) {
        this.log(`[Matches Error]: ${err.message || err.code}`, 'error');
      }

      setTimeout(() => { this.isExecuting = false; }, 2500);
    }
  }

  // 🚤 SPEED BOAT 3: RISE / FALL (Millisecond Micro-Momentum Engine)
  async runRiseFallSpeedBoat() {
    if (this.tickHistory.length < 3) return;

    const p1 = this.tickHistory[this.tickHistory.length - 1];
    const p2 = this.tickHistory[this.tickHistory.length - 2];
    const p3 = this.tickHistory[this.tickHistory.length - 3];

    let contractType = null;
    if (p1 > p2 && p2 > p3) {
      contractType = 'CALL'; 
    } else if (p1 < p2 && p2 < p3) {
      contractType = 'PUT';  
    }

    if (contractType) {
      this.isExecuting = true;
      const symbol = document.getElementById('select-market').value;
      const stake = document.getElementById('input-stake').value;
      const duration = document.getElementById('input-duration').value || 1;
      const durationUnit = document.getElementById('input-duration-unit').value || 't';

      this.log(`[Rise/Fall Speed Boat] Micro-momentum confirmed. Firing ${contractType}...`, 'bot');

      try {
        const res = await this.api.executeTrade({
          symbol: symbol,
          amount: stake,
          duration: duration,
          duration_unit: durationUnit,
          contract_type: contractType
        });
        this.log(`[Rise/Fall Success] ID: ${res.contract_id} | Cost: $${res.buy_price} | Payout: $${res.payout}`, 'success');
      } catch (err) {
        this.log(`[Rise/Fall Error]: ${err.message || err.code}`, 'error');
      }

      setTimeout(() => { this.isExecuting = false; }, 1500);
    }
  }
}

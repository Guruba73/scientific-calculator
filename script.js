class Calculator {
    constructor() {
        this.previousOperandElement = document.getElementById('previous-operand');
        this.currentOperandElement = document.getElementById('current-operand');
        this.isRadian = false;
        this.isShifted = false;
        this.memory = 0;
        this.lastAnswer = '0';
        this.currentFormat = 'decimal'; // 'decimal' or 'fraction'
        
        // Advanced State
        this.history = []; // stores previously executed calculations
        this.historyIndex = -1;
        this.cursorPosition = 0;
        
        this.clear();
        
        // Configure math.js to use degrees or radians
        math.config({
            number: 'BigNumber',      // Default type of number (optional)
            precision: 64             // Number of significant digits for BigNumbers
        });
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.cursorPosition = 1;
        this.historyIndex = this.history.length;
        this.updateDisplay();
    }

    clearAll() {
        this.history = [];
        this.clear();
    }

    delete() {
        if (this.currentOperand === 'Error') {
            this.clear();
            return;
        }
        if (this.currentOperand === '0') return;
        
        if (this.cursorPosition > 0) {
            this.currentOperand = this.currentOperand.slice(0, this.cursorPosition - 1) + this.currentOperand.slice(this.cursorPosition);
            this.cursorPosition--;
            if (this.currentOperand === '') this.currentOperand = '0';
        }
        
        this.updateDisplay();
    }

    // --- Cursor Navigation & Replay ---
    moveCursorLeft() {
        if (this.currentOperand === '0' || this.currentOperand === 'Error') {
            // Replay backwards
            if (this.history.length > 0) {
                this.historyIndex = Math.max(0, this.historyIndex - 1);
                this.loadHistoryState();
            }
            return;
        }
        this.cursorPosition = Math.max(0, this.cursorPosition - 1);
        this.updateDisplay();
    }

    moveCursorRight() {
        if (this.currentOperand === '0' || this.currentOperand === 'Error') {
            // Replay forwards
            if (this.history.length > 0) {
                this.historyIndex = Math.min(this.history.length - 1, this.historyIndex + 1);
                this.loadHistoryState();
            }
            return;
        }
        this.cursorPosition = Math.min(this.currentOperand.length, this.cursorPosition + 1);
        this.updateDisplay();
    }
    
    moveCursorUp() {
       if (this.history.length > 0) {
           this.historyIndex = Math.max(0, this.historyIndex - 1);
           this.loadHistoryState();
       }
    }
    
    moveCursorDown() {
        if (this.history.length > 0) {
           this.historyIndex = Math.min(this.history.length - 1, this.historyIndex + 1);
           this.loadHistoryState();
       }
    }
    
    loadHistoryState() {
        if (this.history[this.historyIndex]) {
            this.currentOperand = this.history[this.historyIndex].expression;
            this.previousOperand = this.history[this.historyIndex].result ? (this.currentOperand + " =") : '';
            this.cursorPosition = this.currentOperand.length;
            this.updateDisplay();
        }
    }
    // ----------------------------------

    insertAtCursor(str) {
        if (this.currentOperand === '0' && str !== '.') {
            this.currentOperand = str;
        } else if (this.currentOperand === 'Error') {
            this.currentOperand = str;
        } else {
            this.currentOperand = this.currentOperand.slice(0, this.cursorPosition) + str + this.currentOperand.slice(this.cursorPosition);
        }
        this.cursorPosition += str.length;
        this.updateDisplay();
    }

    appendNumber(number) {
        this.insertAtCursor(number.toString());
    }

    appendConstant(constant) {
        let value = constant === 'π' ? 'pi' : 'e';
        this.insertAtCursor(value);
    }

    appendOperation(operation) {
        if (this.currentOperand === 'Error') return;
        let op = operation === '×' ? '*' : (operation === '÷' ? '/' : operation);
        this.insertAtCursor(op);
    }

    appendScientific(func) {
        if (this.currentOperand === 'Error') return;
        
        let expr = '';
        if (this.isShifted) {
             const shiftMap = {
                 'inv': 'sqrt(',
                 'square': '^3',
                 'sqrt': '10^',
                 'pow': 'e^',
                 'log': '10^',
                 'ln': 'e^',
                 'sin': 'asin(',
                 'cos': 'acos(',
                 'tan': 'atan(',
                 'fact': '!',
                 'f(x)': 'abs('
             };
             expr = shiftMap[func] || func;
             this.toggleShift(); // disable shift after use
        } else {
            const baseMap = {
                 'inv': '^-1',
                 'square': '^2',
                 'sqrt': 'sqrt(',
                 'pow': '^',
                 'log': 'log10(',
                 'ln': 'log(',
                 'sin': 'sin(',
                 'cos': 'cos(',
                 'tan': 'tan(',
                 'fact': '!',
                 '10^': '*10^',
                 'ans': 'Ans',
                 'f(x)': 'x'
            };
            expr = baseMap[func] !== undefined ? baseMap[func] : func;
        }

        if (expr.includes('(') || expr === '10^' || expr === 'e^' || expr === 'Ans') {
             if (this.currentOperand === '0') {
                 // if ans is clicked on an empty operand, we should start with ans
                 if (expr === 'Ans') this.insertAtCursor('Ans');
                 else this.insertAtCursor(expr);
             } else {
                 this.insertAtCursor(expr);
             }
        } else {
            // e.g. ^2, ^-1, ^3, ! - should append to "0" also
            this.insertAtCursor(expr);
        }
        
        this.updateDisplay();
    }

    toggleShift() {
        this.isShifted = !this.isShifted;
        let shiftInd = document.getElementById('shift-indicator');
        if (!shiftInd) {
            shiftInd = document.createElement('span');
            shiftInd.id = 'shift-indicator';
            shiftInd.innerText = 'S';
            document.querySelector('.status-bar').prepend(shiftInd);
        }
        if (this.isShifted) {
            shiftInd.classList.add('active');
        } else {
            shiftInd.classList.remove('active');
        }
    }

    toggleAngleMode() {
        this.isRadian = !this.isRadian;
        const degInd = document.getElementById('deg-indicator');
        const radInd = document.getElementById('rad-indicator');
        
        if (this.isRadian) {
            if(degInd) degInd.classList.remove('active');
            if(radInd) radInd.classList.add('active');
        } else {
            if(degInd) degInd.classList.add('active');
            if(radInd) radInd.classList.remove('active');
        }
    }
    
    // Memory Functions
    memoryClear() {
        this.memory = 0;
    }
    
    memoryRecall() {
        if (this.currentOperand === '0') {
            this.insertAtCursor(this.memory.toString());
        } else {
             this.insertAtCursor(this.memory.toString());
        }
    }
    
    memoryAdd() {
        if (this.isShifted) {
             this.memorySubtract();
             this.toggleShift();
             return;
        }
        try {
            const result = this.evaluateExpression(this.currentOperand);
            this.memory += parseFloat(result);
        } catch(e) {
            // Ignore if current expression is invalid
        }
    }
    
    memorySubtract() {
         try {
            const result = this.evaluateExpression(this.currentOperand);
            this.memory -= parseFloat(result);
        } catch(e) {
            // Ignore
        }
    }

    formatExpressionForMathJs(expr) {
        let formatted = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/pi/g, 'pi').replace(/e\^/g, 'exp(').replace(/Ans/g, `(${this.lastAnswer})`);
        
        // Handle degrees vs radians for trig functions
        if (!this.isRadian) {
             formatted = formatted.replace(/(sin|cos|tan)\(([^)]+)\)/g, '$1($2 deg)');
             formatted = formatted.replace(/(asin|acos|atan)\(([^)]+)\)/g, '$1($2) deg');
             
             // Handle unmatched parentheses for trig at end of string
             const trigMatches = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan'];
             trigMatches.forEach(trig => {
                 let regex = new RegExp(trig + '\\(([^)]+)$');
                 if (regex.test(formatted)) {
                     formatted = formatted.replace(regex, trig + '($1 deg)');
                 }
                 
                 // if just sin( etc.
                 let regex2 = new RegExp(trig + '\\($');
                 if (regex2.test(formatted)) {
                      // we can't evaluate yet
                 }
             });
        }
        return formatted;
    }

    evaluateExpression(expr) {
        let toEvaluate = this.formatExpressionForMathJs(expr);
        try {
            // Balance parentheses if needed
            const openP = (toEvaluate.match(/\(/g) || []).length;
            const closeP = (toEvaluate.match(/\)/g) || []).length;
            for(let i=0; i < (openP - closeP); i++) {
                toEvaluate += ')';
            }
            
            // Allow math.js to evaluate
            let result = math.evaluate(toEvaluate);
            
            // Format result
            if (typeof result === 'object' && result.isBigNumber) {
                result = result.toNumber();
            }
            
            // Fix floating point precision issues (e.g. sin(pi) != 0)
            if (Math.abs(result) < 1e-10) result = 0;
            
            // Format length
            result = math.format(result, { precision: 14 });
            
            return result.toString();
        } catch (error) {
            throw error;
        }
    }

    compute() {
        if (this.currentOperand === '0' || this.currentOperand === 'Error') return;
        
        let expressionSaved = this.currentOperand;
        
        try {
            this.previousOperand = this.currentOperand + ' =';
            const result = this.evaluateExpression(this.currentOperand);
            this.currentOperand = this.formatResult(result);
            this.lastAnswer = result;
            this.cursorPosition = this.currentOperand.length;
            
            // Save to history
            this.history.push({ expression: expressionSaved, result: result });
            this.historyIndex = this.history.length;
            
        } catch (error) {
            this.previousOperand = expressionSaved + ' =';
            this.currentOperand = 'Error';
            this.cursorPosition = 0;
            this.history.push({ expression: expressionSaved, result: null });
            this.historyIndex = this.history.length;
        }
        this.updateDisplay();
    }

    formatResult(value) {
        if (this.currentFormat === 'fraction') {
            try {
                // Attempt to convert to fraction
                const frac = math.fraction(value);
                return `${frac.n}/${frac.d}`;
            } catch (e) {
                return value.toString();
            }
        }
        return value.toString();
    }
    
    toggleFormat() {
        if (this.currentOperand === '0' || this.currentOperand === 'Error' || this.historyIndex < 0) return;
        
        // Only toggle formatting if we are currently displaying a result
        if (this.previousOperand.includes('=')) {
             this.currentFormat = this.currentFormat === 'decimal' ? 'fraction' : 'decimal';
             this.currentOperand = this.formatResult(this.lastAnswer);
             this.cursorPosition = this.currentOperand.length;
             this.updateDisplay();
        }
    }

    updateDisplay() {
        // Render Cursor
        if (this.currentOperand === 'Error') {
             this.currentOperandElement.innerText = this.currentOperand;
        } else {
             const beforeCursor = this.currentOperand.slice(0, this.cursorPosition);
             const afterCursor = this.currentOperand.slice(this.cursorPosition);
             this.currentOperandElement.innerHTML = `${beforeCursor}<span class="cursor">|</span>${afterCursor}`;
        }
        this.previousOperandElement.innerText = this.previousOperand;
    }
}

const calculator = new Calculator();

// Keyboard support
document.addEventListener('keydown', e => {
    if (e.key >= '0' && e.key <= '9' || e.key === '.') {
        calculator.appendNumber(e.key);
    }
    if (e.key === '+' || e.key === '-') {
        calculator.appendOperation(e.key);
    }
    if (e.key === '*' || e.key === '/') {
        let op = e.key === '*' ? '×' : '÷';
        calculator.appendOperation(op);
    }
    if (e.key === '(' || e.key === ')') {
        calculator.appendNumber(e.key);
    }
    if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculator.compute();
    }
    if (e.key === 'Backspace') {
        calculator.delete();
    }
    if (e.key === 'Escape') {
        calculator.clear();
    }
});

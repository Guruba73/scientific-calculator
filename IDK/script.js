class Calculator {
    constructor() {
        this.previousOperandElement = document.getElementById('previous-operand');
        this.currentOperandElement = document.getElementById('current-operand');
        this.isRadian = false;
        this.memory = 0;
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
        this.updateDisplay();
    }

    delete() {
        if (this.currentOperand === 'Error') {
            this.clear();
            return;
        }
        if (this.currentOperand.length <= 1) {
            this.currentOperand = '0';
        } else {
            this.currentOperand = this.currentOperand.toString().slice(0, -1);
        }
        this.updateDisplay();
    }

    appendNumber(number) {
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number;
        } else if (this.currentOperand === 'Error') {
            this.currentOperand = number;
        } else {
            this.currentOperand += number.toString();
        }
        this.updateDisplay();
    }

    appendConstant(constant) {
        let value = '';
        if (constant === 'π') value = 'pi';
        if (constant === 'e') value = 'e';
        
        if (this.currentOperand === '0' || this.currentOperand === 'Error') {
            this.currentOperand = value;
        } else {
            this.currentOperand += value;
        }
        this.updateDisplay();
    }

    appendOperation(operation) {
        if (this.currentOperand === 'Error') return;
        
        let op = operation;
        if (operation === '×') op = '*';
        if (operation === '÷') op = '/';
        
        this.currentOperand += op;
        this.updateDisplay();
    }

    appendScientific(func) {
        if (this.currentOperand === 'Error') return;
        
        let expr = '';
        switch(func) {
            case 'sin':
            case 'cos':
            case 'tan':
            case 'asin':
            case 'acos':
            case 'atan':
                // For trig functions, we parse it at compute time to handle deg/rad
                expr = `${func}(`;
                break;
            case 'log':
                expr = 'log10(';
                break;
            case 'ln':
                expr = 'log(';
                break;
            case 'sqrt':
                expr = 'sqrt(';
                break;
            case 'square':
                expr = '^2';
                break;
            case 'fact':
                expr = '!';
                break;
            case '10^':
                expr = '10^';
                break;
            case 'e^':
                expr = 'e^';
                break;
            case 'inv':
                expr = '1/(';
                break;
            case 'exp':
                expr = 'E';
                break;
        }

        if (expr.includes('(') || expr === '10^' || expr === 'e^' || expr === 'E') {
             if (this.currentOperand === '0') {
                 this.currentOperand = expr;
             } else {
                 this.currentOperand += expr;
             }
        } else {
            this.currentOperand += expr;
        }
        
        this.updateDisplay();
    }

    toggleAngleMode() {
        this.isRadian = !this.isRadian;
        const btn = document.getElementById('deg-rad-btn');
        const degInd = document.getElementById('deg-indicator');
        const radInd = document.getElementById('rad-indicator');
        
        if (this.isRadian) {
            btn.innerText = 'DEG';
            degInd.classList.remove('active');
            radInd.classList.add('active');
        } else {
            btn.innerText = 'RAD';
            degInd.classList.add('active');
            radInd.classList.remove('active');
        }
    }
    
    // Memory Functions
    memoryClear() {
        this.memory = 0;
    }
    
    memoryRecall() {
        if (this.currentOperand === '0') {
            this.currentOperand = this.memory.toString();
        } else {
             this.currentOperand += this.memory.toString();
        }
        this.updateDisplay();
    }
    
    memoryAdd() {
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
        let formatted = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/pi/g, 'pi').replace(/e\^/g, 'exp(');
        
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
        
        try {
            this.previousOperand = this.currentOperand + ' =';
            const result = this.evaluateExpression(this.currentOperand);
            this.currentOperand = result;
        } catch (error) {
            this.previousOperand = this.currentOperand + ' =';
            this.currentOperand = 'Error';
        }
        this.updateDisplay();
    }

    updateDisplay() {
        this.currentOperandElement.innerText = this.currentOperand;
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

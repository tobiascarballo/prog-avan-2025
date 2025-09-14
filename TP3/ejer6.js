function isBalanced(s) {
    const stack = [];
    const pares = {
        ')': '(',
        ']': '[',
        '}': '{'
    };

    for (let char of s) {
        if(char === '(' || char == '[' || char == '{') {
            stack.push(char);
        } 
        else if (char === ')' || char == ']' || char == '}') {
            if (stack.lenght === 0 || stack.pop() !== pares[char]) {
                return false;
            } 
        }
    }

    return stack.length === 0;
}

//prueba
console.log(isBalanced('({}[])')) //verdadero
console.log(isBalanced('{}])')) //falso
console.log(isBalanced('([])')) //verdadero
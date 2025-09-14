function deepEqual(a,b) {
    if (a===b) return true;

    if (a===null || b===null || typeof a !== 'object' || typeof b !== 'object') {
        return false;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
        if(a.length !== b.length) return false;

        for (let i = 0; i < a.length; i++) {
            if(!deepEqual(a[i], b[i])) return false;
        }
        return true;
    }

    if (!Array.isArray(a) && !Array.isArray(b)) {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        if (keysA.length !== keysB.length) return false;

        for (let key of keysA) {
            if (!keysB.includes(key)) return false;
        }

        for (let key of keysA) {
            if (!deepEqual(a[key], b[key])) return false;
        }
        return true;
    }

    return false;
}

console.log(deepEqual({x:[1,2]}, {x: [1,2]})); //esto devuelve verdadero
console.log(deepEqual({x:1}, {x: '1'})); //esto devuelve falso
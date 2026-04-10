const jwt = require('jsonwebtoken');
const { jwtVerify } = require('jose');

const JWT_SECRET_STR = process.env.JWT_SECRET || 'fallback_secret';
const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET_STR);

async function test() {
    const token = jwt.sign({ id: '123', email: 'test@test.com' }, JWT_SECRET_STR, { expiresIn: '1d' });
    console.log("Token:", token);
    
    try {
        const result = await jwtVerify(token, JWT_SECRET_BYTES);
        console.log("Jose Success:", result.payload);
    } catch(e) {
        console.error("Jose Error:", e.name, e.message);
    }
}

test();

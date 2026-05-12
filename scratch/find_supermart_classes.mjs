import fetch from 'node-fetch';

async function findClasses() {
    const url = 'https://www.supermart.ng/collections/fresh-food';
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
    });
    const html = await res.text();
    
    // Find "Tomato" and look at the parent tags
    const index = html.toLowerCase().indexOf('tomato');
    if (index !== -1) {
        const context = html.substring(index - 1000, index + 1000);
        console.log('Context around "Tomato":');
        console.log(context);
    } else {
        console.log('Tomato not found');
    }
}

findClasses();
